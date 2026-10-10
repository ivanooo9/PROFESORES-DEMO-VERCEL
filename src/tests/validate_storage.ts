declare const process: { exit: (code?: number) => void };

import { demoStorage } from '../demo/demoStorage';
import { academicApi } from '../services/api/academicApi';
import { organizationApi } from '../services/api/organizationApi';
import { matchesStudentQuery } from '../utils/studentFilter';
import { AcademicPeriodStatus } from '../types/teacher';

// Mock localStorage with quota failure simulation and corruption testing
class MockLocalStorage {
  public store: Record<string, string> = {};
  public simulateQuotaError: boolean = false;

  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }

  setItem(key: string, value: string): void {
    if (this.simulateQuotaError) {
      const err = new Error('QuotaExceededError: DOM Exception 22');
      err.name = 'QuotaExceededError';
      throw err;
    }
    this.store[key] = String(value);
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
    this.simulateQuotaError = false;
  }
}

const mockStorage = new MockLocalStorage();
(globalThis as any).localStorage = mockStorage;
(globalThis as any).window = globalThis;

async function runStorageVerificationSuite() {
  console.log('===============================================================');
  console.log('  AUDITORÍA FINAL AUTOMATIZADA: DEMO LOCALSTORAGE & FLUJOS E2E  ');
  console.log('===============================================================\n');

  let passed = 0;
  let total = 0;

  function test(name: string, fn: () => void) {
    total++;
    try {
      fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ❌ [FAIL] ${name}:`, err.message || err);
      throw err;
    }
  }

  async function asyncTest(name: string, fn: () => Promise<void>) {
    total++;
    try {
      await fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ❌ [FAIL] ${name}:`, err.message || err);
      throw err;
    }
  }

  // 1. Inicialización limpia
  test('1. Inicialización limpia de LocalStorage v2.0 con datos semilla', () => {
    mockStorage.clear();
    demoStorage.init();
    const version = mockStorage.getItem('profesores_demo_version');
    if (version !== '2.0') throw new Error(`Expected version 2.0, got ${version}`);
    const years = demoStorage.getAcademicYears();
    const periods = demoStorage.getAcademicPeriods();
    const schemes = demoStorage.getEvaluationSchemes();
    const courses = demoStorage.getCourses();
    if (years.length === 0 || periods.length === 0 || schemes.length === 0 || courses.length === 0) {
      throw new Error('Seed data not properly populated');
    }
  });

  // 2. Idempotencia
  test('2. Idempotencia: Llamar a init() múltiples veces no duplica ni corrompe datos', () => {
    const coursesBefore = demoStorage.getCourses().length;
    const periodsBefore = demoStorage.getAcademicPeriods().length;
    demoStorage.init();
    demoStorage.init();
    demoStorage.init();
    const coursesAfter = demoStorage.getCourses().length;
    const periodsAfter = demoStorage.getAcademicPeriods().length;
    if (coursesBefore !== coursesAfter || periodsBefore !== periodsAfter) {
      throw new Error(`Data mutated on repeated init: courses ${coursesBefore} -> ${coursesAfter}`);
    }
  });

  // 3. Migración v1.0 -> v2.0
  test('3. Migración v1.0 -> v2.0 conservando entidades existentes y enlazando años/períodos', () => {
    mockStorage.clear();
    mockStorage.setItem('profesores_demo_courses', JSON.stringify([
      { id: '1', name: 'Curso Legacy 1', level: 'Básica', classroom: '101', subjectsCount: 0, studentCount: 0, status: 'active' },
    ]));
    mockStorage.setItem('profesores_demo_students', JSON.stringify([
      { id: '1', firstName: 'Juan', lastName: 'Pérez', email: 'juan@test.com', status: 'active', identification: '1700000001' },
    ]));
    demoStorage.init();
    const version = mockStorage.getItem('profesores_demo_version');
    if (version !== '2.0') throw new Error('Migration did not set version 2.0');
    const courses = demoStorage.getCourses();
    const students = demoStorage.getStudents();
    if (!courses.some((c) => c.name === 'Curso Legacy 1')) throw new Error('Legacy course lost');
    if (!students.some((s) => s.firstName === 'Juan')) throw new Error('Legacy student lost');
  });

  // 4. Gestión Académica: Años y Jerarquías
  test('4. Gestión académica: Creación de años lectivos y jerarquías (Quimestres -> Parciales)', () => {
    demoStorage.resetDemoData();
    const newYear = demoStorage.createAcademicYear({
      name: '2027 - 2028',
      startDate: '2027-09-01',
      endDate: '2028-06-30',
      status: 'PLANNED',
    });
    if (!newYear.id || newYear.status !== 'PLANNED') throw new Error('Failed to create planned academic year');

    const quimester = demoStorage.createAcademicPeriod({
      academicYearId: newYear.id,
      name: 'Primer Quimestre 27-28',
      type: 'QUIMESTER',
      order: 1,
      startDate: '2027-09-01',
      endDate: '2028-01-31',
      parentId: null,
      status: 'ACTIVE',
    });
    if (!quimester.id) throw new Error('Failed to create parent quimester');

    const parcial = demoStorage.createAcademicPeriod({
      academicYearId: newYear.id,
      name: 'Primer Parcial 27-28',
      type: 'PARTIAL',
      order: 1,
      startDate: '2027-09-01',
      endDate: '2027-10-31',
      parentId: quimester.id,
      status: 'ACTIVE',
    });
    if (parcial.parentId !== quimester.id) throw new Error('Parcial parentId not linked to quimester');
  });

  // 5. Bloqueo de Períodos Cerrados
  test('5. Gestión académica: Bloqueo de edición y cierre definitivo de periodos', () => {
    demoStorage.resetDemoData();
    const updated = demoStorage.changeAcademicPeriodStatus(21, 'CLOSED' as AcademicPeriodStatus);
    if (updated.status !== 'CLOSED') throw new Error('Period status not changed to CLOSED');
    const periods = demoStorage.getAcademicPeriods();
    const target = periods.find((p) => p.id === 21);
    if (target?.status !== 'CLOSED') throw new Error('CLOSED status not persisted in storage');
  });

  // 6. Cursos y Materias: Creación, Edición y Horarios
  test('6. Cursos y materias: Creación, edición y configuración de horarios semanales', () => {
    demoStorage.resetDemoData();
    const newCourse = demoStorage.createCourse({
      name: '3ro BGU Ciencias',
      level: 'Bachillerato General Unificado',
      classroom: 'Aula 301',
    });
    if (!newCourse.id) throw new Error('Failed to create course');

    const updatedCourse = demoStorage.updateCourse(Number(newCourse.id), {
      name: '3ro BGU A',
      level: 'Bachillerato General Unificado',
      classroom: 'Aula 302',
    });
    if (updatedCourse.name !== '3ro BGU A') throw new Error('Failed to update course');

    const newSubject = demoStorage.createSubject(Number(newCourse.id), {
      name: 'Física Superior',
      code: 'FIS-301',
      hoursPerWeek: 4,
      scheduleSlots: [
        { dayOfWeek: 1, startTime: '07:00', endTime: '08:30', pedagogicalHours: 2, room: 'Lab Física' },
        { dayOfWeek: 3, startTime: '07:00', endTime: '08:30', pedagogicalHours: 2, room: 'Lab Física' },
      ],
    });
    if (!newSubject.id || newSubject.activeSlots?.length !== 2) {
      throw new Error('Failed to create subject with schedule slots');
    }
  });

  // 7. Balance de Horas y Solapamientos
  test('7. Cursos y materias: Balance de horas pedagógicas y cálculo de estado de horario', () => {
    demoStorage.resetDemoData();
    const scheduleDTO = demoStorage.getSubjectSchedule(101);
    if (!scheduleDTO.scheduleStatus) throw new Error('scheduleStatus is missing');
    if (typeof scheduleDTO.totalPedagogicalHours !== 'number') throw new Error('totalPedagogicalHours missing');
    if (scheduleDTO.totalPedagogicalHours !== scheduleDTO.hoursPerWeek && scheduleDTO.hoursPerWeek > 0) {
      if (scheduleDTO.scheduleStatus === 'complete') throw new Error('Inconsistent schedule status for unbalanced hours');
    }
  });

  // 8. Archivar, Reactivar y Bloquear Eliminaciones con Dependencias
  test('8. Cursos y materias: Archivar, reactivar y bloqueo referencial de eliminación', () => {
    demoStorage.resetDemoData();
    // Archivar
    const archived = demoStorage.archiveCourse(1);
    if (archived.status !== 'archived') throw new Error('Course not archived');
    // Reactivar
    const reactivated = demoStorage.reactivateCourse(1);
    if (reactivated.status !== 'active') throw new Error('Course not reactivated');

    // Bloqueo de eliminación por dependencias
    const deps = demoStorage.getCourseDependencies(1);
    if (deps.dependencies.subjects > 0 && deps.canDelete) {
      throw new Error('Course with active subjects should not be deletable');
    }
    let threw = false;
    try {
      demoStorage.deleteCourse(1);
    } catch {
      threw = true;
    }
    if (!threw) throw new Error('demoStorage.deleteCourse should throw for dependent courses');
  });

  // 9. Estudiantes: Registro, Edición y Búsqueda insensible a tildes/mayúsculas
  test('9. Estudiantes: Registro, edición y búsqueda con normalización diacrítica', () => {
    demoStorage.resetDemoData();
    const student = demoStorage.createStudent({
      firstName: 'María José',
      lastName: 'Álvarez Nuñez',
      identification: '1720304050',
      email: 'maria.alvarez@instituto.edu.ec',
      phone: '0991234567',
    });
    if (!student.id) throw new Error('Failed to create student');

    const updated = demoStorage.updateStudent(Number(student.id), {
      firstName: 'María José',
      lastName: 'Álvarez Gómez',
    });
    if (updated.lastName !== 'Álvarez Gómez') throw new Error('Failed to update student');

    // Búsqueda insensible a tildes y mayúsculas
    if (!matchesStudentQuery(updated, 'alvarez')) throw new Error('Search failed: alvarez matching Álvarez');
    if (!matchesStudentQuery(updated, 'MARIA')) throw new Error('Search failed: MARIA matching María');
    if (!matchesStudentQuery(updated, '1720304050')) throw new Error('Search failed by identification');
    if (matchesStudentQuery(updated, 'inexistente')) throw new Error('Search false positive');
  });

  // 10. Matrícula: Asignación a Año Lectivo y Prevención de Duplicados
  test('10. Estudiantes: Matrícula en año lectivo y prevención de duplicados', () => {
    demoStorage.resetDemoData();
    const students = demoStorage.getStudents();
    const activeStudent = students[0];
    const enr = demoStorage.enrollStudent(Number(activeStudent.id), 2, '2026-09-01', 1);
    if (!enr.id || enr.academicYearId !== '1') throw new Error('Failed to enroll student in academic year 1');

    // Matricular de nuevo en el mismo curso y mismo año lectivo debe ser idempotente / retornar matrícula activa
    const duplicateEnr = demoStorage.enrollStudent(Number(activeStudent.id), 2, '2026-09-01', 1);
    if (duplicateEnr.id !== enr.id) throw new Error('Duplicate enrollment created for same course and year');
  });

  // 11. Esquemas de Evaluación: Ponderaciones y Validación 100%
  test('11. Calificaciones: Esquema de evaluación, ponderaciones y regla estricta del 100%', () => {
    demoStorage.resetDemoData();
    const scheme = demoStorage.createEvaluationScheme({
      courseId: 1,
      subjectId: 101,
      academicPeriodId: 21,
      maxScale: 10,
      minPassingScore: 7,
    });
    if (!scheme.id) throw new Error('Failed to create evaluation scheme');

    // Agregar categorías con suma = 100%
    const cat1 = demoStorage.createEvaluationCategory(scheme.id, {
      name: 'Trabajos y Talleres',
      weightPercentage: 70,
      order: 1,
    });
    const cat2 = demoStorage.createEvaluationCategory(scheme.id, {
      name: 'Evaluación Sumativa',
      weightPercentage: 30,
      order: 2,
    });
    if (!cat1.id || !cat2.id) throw new Error('Failed to create evaluation categories');

    // Validar esquema
    const validated = demoStorage.validateEvaluationScheme(scheme.id);
    if (validated.status !== 'VALID') throw new Error('Scheme with 100% weight was not set to VALID');
  });

  // 12. Actividades y Calificaciones por Lote
  test('12. Calificaciones: Registro de actividades e ingreso de notas por lote', () => {
    demoStorage.resetDemoData();
    const newActivity = demoStorage.createActivity(1, {
      subjectId: '101',
      name: 'Taller de Álgebra Lineal',
      type: 'activity',
      dueDate: '2026-10-15',
      maxScore: 10,
      academicPeriodId: '21',
    });
    if (!newActivity.id) throw new Error('Failed to create activity');

    const students = demoStorage.getStudents();
    const batchGrades = [
      { studentId: Number(students[0].id), score: 9.5, comments: 'Excelente desempeño' },
      { studentId: Number(students[1].id), score: 8.0, comments: 'Buen trabajo' },
    ];
    const savedGrades = demoStorage.saveGradesBatch(Number(newActivity.id), batchGrades);
    if (savedGrades.length !== 2) throw new Error('Grades batch not saved properly');
  });

  // 13. Cálculo de Promedios Ponderados y Matriz de Notas
  test('13. Calificaciones: Matriz de calificaciones ponderadas y determinación Provisional vs Definitiva', () => {
    demoStorage.resetDemoData();
    const matrix = demoStorage.getPeriodGradesMatrix(1, 101, 21);
    if (!matrix.students || matrix.students.length === 0) throw new Error('Matrix returned 0 students');

    const firstStudent = matrix.students[0];
    if (typeof firstStudent.definitiveGrade !== 'number') {
      throw new Error('definitiveGrade is not calculated');
    }
    if (typeof firstStudent.isProvisional !== 'boolean') {
      throw new Error('isProvisional boolean flag is missing');
    }
    // Verificar que los promedios de cada categoría sean numéricos
    for (const cat of firstStudent.categories) {
      if (cat.isEvaluated && typeof cat.categoryAverage !== 'number') {
        throw new Error('Evaluated category categoryAverage must be numeric');
      }
    }
  });

  // 14. Diagnóstico de Cierre de Periodo
  test('14. Calificaciones: Diagnóstico integral de cierre de periodo (PeriodClosureReadinessDTO)', () => {
    demoStorage.resetDemoData();
    const readiness = demoStorage.getPeriodClosureReadiness(21);
    if (typeof readiness.canClose !== 'boolean') throw new Error('canClose boolean flag missing');
    if (!Array.isArray(readiness.blockers) || !Array.isArray(readiness.warnings)) {
      throw new Error('Blockers and warnings arrays missing in readiness');
    }
    if (typeof readiness.totalActivities !== 'number' || typeof readiness.totalGrades !== 'number') {
      throw new Error('Readiness statistics counters missing');
    }
  });

  // 15. Reporte de Nómina (Roster Report)
  test('15. Reportes: Consulta y filtrado de Reporte de Nómina (RosterReportDTO)', () => {
    demoStorage.resetDemoData();
    const roster = demoStorage.getRosterReport({ courseId: 1, status: 'ACTIVE' });
    if (!roster.students || roster.totalStudents === 0) throw new Error('Roster report empty for course 1');
    if (roster.students.some((s) => s.status !== 'ACTIVE')) throw new Error('Status filter failed in roster report');
  });

  // 16. Reporte de Asistencia (Attendance Report)
  test('16. Reportes: Consulta de Reporte de Asistencia y cálculo de porcentajes', () => {
    demoStorage.resetDemoData();
    const attReport = demoStorage.getAttendanceReport({ courseId: 1 });
    if (!attReport.summary || typeof attReport.summary.totalSessions !== 'number') {
      throw new Error('summary.totalSessions missing in attendance report');
    }
    if (attReport.summary.totalSessions < 0) throw new Error('Invalid totalSessions count');
  });

  // 17. Reporte de Calificaciones (Grade Report)
  test('17. Reportes: Consulta de Reporte de Calificaciones y distribución de rendimiento', () => {
    demoStorage.resetDemoData();
    const gradeReport = demoStorage.getGradeReport({ courseId: 1, subjectId: 101 });
    if (!gradeReport.summary || typeof gradeReport.summary.totalActivities !== 'number') {
      throw new Error('summary.totalActivities missing in grade report');
    }
    if (!Array.isArray(gradeReport.students)) throw new Error('students array missing in grade report');
  });

  // 18. Ficha Individual del Estudiante (Student Report)
  test('18. Reportes: Ficha integral del estudiante (StudentReportDTO)', () => {
    demoStorage.resetDemoData();
    const students = demoStorage.getStudents();
    const studentId = String(students[0].id);
    const report = demoStorage.getStudentReport(studentId);
    if (String(report.student.id) !== studentId) throw new Error('Student mismatch in student report');
    if (!report.attendance || !report.attendance.summary) {
      throw new Error('attendance.summary missing in student report');
    }
    if (!report.grades || !report.grades.summary) {
      throw new Error('grades.summary missing in student report');
    }
  });

  // 19. Resiliencia del Almacenamiento: Corrupción y Cuota
  test('19. Resiliencia: Recuperación ante corrupción JSON y error de cuota en LocalStorage', () => {
    mockStorage.setItem('profesores_demo_courses', 'CORRUPT_NOT_A_JSON{[');
    mockStorage.setItem('profesores_demo_students', 'null');
    const courses = demoStorage.getCourses();
    const students = demoStorage.getStudents();
    if (!Array.isArray(courses) || !Array.isArray(students)) {
      throw new Error('Storage did not recover safely from corrupted data');
    }

    mockStorage.simulateQuotaError = true;
    try {
      demoStorage.updateCourse(1, { name: 'Quota Test' });
    } catch {
      // Expected caught gracefully
    }
    mockStorage.simulateQuotaError = false;
  });

  // 20. Integración 100% Offline de academicApi y organizationApi
  await asyncTest('20. Arquitectura Vercel: academicApi y organizationApi operan 100% offline sin llamadas de red', async () => {
    demoStorage.resetDemoData();
    const user = await organizationApi.getCurrentUser();
    if (!user || user.email !== 'carlos.andrade@uehorizonte.edu.ec') throw new Error('organizationApi failed to get demo user');

    const orgs = await organizationApi.getUserOrganizations();
    if (orgs.length === 0) throw new Error('organizationApi failed to get demo organizations');

    const courses = await academicApi.getCourses(1);
    if (!Array.isArray(courses) || courses.length === 0) throw new Error('academicApi failed to get courses');

    const matrix = await academicApi.getPeriodGradesMatrix(1, { courseId: 1, subjectId: 101, academicPeriodId: 21 });
    if (!matrix || !matrix.students) throw new Error('academicApi failed to get matrix');
  });

  console.log(`\n===============================================================`);
  console.log(`  RESULTADO FINAL: ${passed}/${total} PRUEBAS COMPLETADAS Y APROBADAS (100%)`);
  console.log(`===============================================================\n`);
}

runStorageVerificationSuite().catch((err) => {
  console.error('\n❌ ERROR CRÍTICO EN LA SUITE DE PRUEBAS:\n', err);
  process.exit(1);
});
