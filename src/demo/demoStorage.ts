import {
  Activity,
  AttendanceRecord,
  AttendanceStatus,
  ClassSession,
  Course,
  Enrollment,
  EnrollmentResult,
  GradeItem,
  Student,
  Subject,
  AcademicDashboardDTO,
  RosterReportDTO,
  AttendanceReportDTO,
  GradeReportDTO,
  StudentReportDTO,
  AcademicYear,
  AcademicYearStatus,
  AcademicPeriod,
  AcademicPeriodType,
  AcademicPeriodStatus,
  AcademicEvaluationScheme,
  AcademicEvaluationCategory,
  AcademicGradeStatus,
  PeriodClosureReadinessDTO,
  PeriodClosureBlocker,
  PeriodClosureWarning,
  PeriodGradesMatrixDTO,
  PeriodGradesMatrixStudent,
  PeriodGradesMatrixCategory,
  PeriodGradesMatrixActivityScore,
  CourseDependenciesDTO,
  ScheduleSlot,
  SubjectScheduleDTO,
} from '../types/teacher';
import { Organization, UserSession, OrganizationModuleRecord } from '../services/api/organizationApi';
import {
  DEMO_USER,
  DEMO_ORGANIZATION,
  DEMO_COURSES,
  DEMO_SUBJECTS,
  DEMO_STUDENTS,
  DEMO_ENROLLMENTS,
  DEMO_CLASS_SESSIONS,
  DEMO_ACTIVITIES,
  DEMO_GRADES,
  DEMO_ATTENDANCE,
  DEMO_ACADEMIC_YEARS,
  DEMO_ACADEMIC_PERIODS,
  DEMO_EVALUATION_SCHEMES,
  DEMO_EVALUATION_CATEGORIES,
  DEMO_SCHEDULE_SLOTS,
} from './mockData';
import { getLocalDateString } from '../utils/date';

const STORAGE_PREFIX = 'profesores_demo_';
const VERSION_KEY = `${STORAGE_PREFIX}version`;
const CURRENT_VERSION = '2.0';

const KEYS = {
  USER: `${STORAGE_PREFIX}user`,
  ORGS: `${STORAGE_PREFIX}organizations`,
  MODULES: `${STORAGE_PREFIX}modules`,
  YEARS: `${STORAGE_PREFIX}academic_years`,
  PERIODS: `${STORAGE_PREFIX}academic_periods`,
  SCHEMES: `${STORAGE_PREFIX}evaluation_schemes`,
  CATEGORIES: `${STORAGE_PREFIX}evaluation_cats`,
  SCHEDULES: `${STORAGE_PREFIX}subject_schedules`,
  COURSES: `${STORAGE_PREFIX}courses`,
  SUBJECTS: `${STORAGE_PREFIX}subjects`,
  STUDENTS: `${STORAGE_PREFIX}students`,
  ENROLLMENTS: `${STORAGE_PREFIX}enrollments`,
  SESSIONS: `${STORAGE_PREFIX}sessions`,
  ACTIVITIES: `${STORAGE_PREFIX}activities`,
  GRADES: `${STORAGE_PREFIX}grades`,
  ATTENDANCE: `${STORAGE_PREFIX}attendance`,
};

function getItem<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (parsed === null || parsed === undefined) return fallback;
    return parsed as T;
  } catch (e) {
    console.error(`[DemoStorage] Error reading ${key}`, e);
    return fallback;
  }
}

function setItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`[DemoStorage] Error writing ${key}`, e);
  }
}

export const demoStorage = {
  init(): void {
    if (typeof window === 'undefined') return;

    const version = localStorage.getItem(VERSION_KEY);
    const hasData = localStorage.getItem(KEYS.COURSES);

    if (!hasData) {
      this.resetDemoData();
      return;
    }

    if (version !== CURRENT_VERSION) {
      this.migrateFromV1();
    }
  },

  migrateFromV1(): void {
    if (typeof window === 'undefined') return;
    try {
      // 1. Backfill Years
      const existingYears = getItem<AcademicYear[]>(KEYS.YEARS, []);
      if (existingYears.length === 0) {
        setItem(KEYS.YEARS, DEMO_ACADEMIC_YEARS);
      }

      // 2. Backfill Periods
      const existingPeriods = getItem<AcademicPeriod[]>(KEYS.PERIODS, []);
      if (existingPeriods.length === 0) {
        setItem(KEYS.PERIODS, DEMO_ACADEMIC_PERIODS);
      }

      // 3. Backfill Schemes and Categories
      const existingSchemes = getItem<AcademicEvaluationScheme[]>(KEYS.SCHEMES, []);
      if (existingSchemes.length === 0) {
        setItem(KEYS.SCHEMES, DEMO_EVALUATION_SCHEMES);
      }

      const existingCats = getItem<AcademicEvaluationCategory[]>(KEYS.CATEGORIES, []);
      if (existingCats.length === 0) {
        setItem(KEYS.CATEGORIES, DEMO_EVALUATION_CATEGORIES);
      }

      // 4. Backfill Schedules
      const existingSchedules = getItem<Record<string, ScheduleSlot[]>>(KEYS.SCHEDULES, {});
      if (Object.keys(existingSchedules).length === 0) {
        setItem(KEYS.SCHEDULES, DEMO_SCHEDULE_SLOTS);
      }

      // 5. Backfill Enrollments with academicYearId
      const enrollments = getItem<Enrollment[]>(KEYS.ENROLLMENTS, []);
      let enrollmentsUpdated = false;
      for (const e of enrollments) {
        if (!e.academicYearId) {
          e.academicYearId = '1';
          e.academicYearName = 'Año Lectivo 2025-2026';
          enrollmentsUpdated = true;
        }
      }
      if (enrollmentsUpdated) {
        setItem(KEYS.ENROLLMENTS, enrollments);
      }

      // 6. Backfill Activities with academicPeriodId
      const activities = getItem<Activity[]>(KEYS.ACTIVITIES, []);
      let activitiesUpdated = false;
      for (const a of activities) {
        if (!a.academicPeriodId) {
          a.academicPeriodId = '21';
          activitiesUpdated = true;
        }
      }
      if (activitiesUpdated) {
        setItem(KEYS.ACTIVITIES, activities);
      }

      localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
    } catch (e) {
      console.error('[DemoStorage] Migration failed, preserving existing data:', e);
    }
  },

  resetDemoData(): void {
    if (typeof window === 'undefined') return;

    localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
    setItem(KEYS.USER, DEMO_USER);
    setItem(KEYS.ORGS, [DEMO_ORGANIZATION]);
    setItem(KEYS.MODULES, [
      {
        id: 1,
        organizationId: DEMO_ORGANIZATION.id,
        moduleId: 1,
        status: 'ACTIVE',
        module: {
          id: 1,
          code: 'TEACHING',
          name: 'Gestión Académica',
          description: 'Módulo integral para profesores y control de clases.',
          status: 'ACTIVE',
        },
      },
    ] as OrganizationModuleRecord[]);

    setItem(KEYS.YEARS, DEMO_ACADEMIC_YEARS);
    setItem(KEYS.PERIODS, DEMO_ACADEMIC_PERIODS);
    setItem(KEYS.SCHEMES, DEMO_EVALUATION_SCHEMES);
    setItem(KEYS.CATEGORIES, DEMO_EVALUATION_CATEGORIES);
    setItem(KEYS.SCHEDULES, DEMO_SCHEDULE_SLOTS);
    setItem(KEYS.COURSES, DEMO_COURSES);
    setItem(KEYS.SUBJECTS, DEMO_SUBJECTS);
    setItem(KEYS.STUDENTS, DEMO_STUDENTS);
    setItem(KEYS.ENROLLMENTS, DEMO_ENROLLMENTS);
    setItem(KEYS.SESSIONS, DEMO_CLASS_SESSIONS);
    setItem(KEYS.ACTIVITIES, DEMO_ACTIVITIES);
    setItem(KEYS.GRADES, DEMO_GRADES);
    setItem(KEYS.ATTENDANCE, DEMO_ATTENDANCE);
  },

  // USER & ORGS
  getUser(): UserSession {
    this.init();
    return getItem(KEYS.USER, DEMO_USER);
  },

  getOrganizations(): Organization[] {
    this.init();
    return getItem(KEYS.ORGS, [DEMO_ORGANIZATION]);
  },

  getModules(orgId: number): OrganizationModuleRecord[] {
    this.init();
    const modules = getItem<OrganizationModuleRecord[]>(KEYS.MODULES, []);
    return modules.filter((m) => m.organizationId === orgId);
  },

  enableModule(orgId: number, moduleCode: string): boolean {
    this.init();
    const modules = getItem<OrganizationModuleRecord[]>(KEYS.MODULES, []);
    const existing = modules.find(
      (m) => m.organizationId === orgId && m.module.code === moduleCode
    );
    if (existing) {
      existing.status = 'ACTIVE';
    } else {
      modules.push({
        id: Date.now(),
        organizationId: orgId,
        moduleId: Date.now(),
        status: 'ACTIVE',
        module: {
          id: Date.now(),
          code: moduleCode,
          name: moduleCode === 'TEACHING' ? 'Gestión Académica' : moduleCode,
          status: 'ACTIVE',
        },
      });
    }
    setItem(KEYS.MODULES, modules);
    return true;
  },

  // ============================================================================
  // COURSES
  // ============================================================================
  getCourses(filter?: { status?: string; search?: string }): Course[] {
    this.init();
    let list = getItem<Course[]>(KEYS.COURSES, DEMO_COURSES);
    if (filter?.status) {
      list = list.filter((c) => c.status.toLowerCase() === filter.status?.toLowerCase());
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q) || c.classroom.toLowerCase().includes(q));
    }
    return list;
  },

  getCourseById(courseId: string | number): Course | null {
    const list = this.getCourses();
    return list.find((c) => String(c.id) === String(courseId)) || null;
  },

  createCourse(data: { name: string; level: string; classroom?: string; tutorUserId?: number | null }): Course {
    this.init();
    const list = getItem<Course[]>(KEYS.COURSES, DEMO_COURSES);
    const newCourse: Course = {
      id: String(Date.now()),
      name: data.name,
      level: data.level,
      classroom: data.classroom || 'Aula por asignar',
      tutorName: 'Lic. Carlos Andrade M.',
      studentCount: 0,
      subjectsCount: 0,
      status: 'active',
    };
    list.push(newCourse);
    setItem(KEYS.COURSES, list);
    return newCourse;
  },

  updateCourse(courseId: string | number, data: { name?: string; level?: string; classroom?: string }): Course {
    this.init();
    const list = getItem<Course[]>(KEYS.COURSES, DEMO_COURSES);
    const index = list.findIndex((c) => String(c.id) === String(courseId));
    if (index === -1) throw new Error('Curso no encontrado.');

    const updated = {
      ...list[index],
      name: data.name ?? list[index].name,
      level: data.level ?? list[index].level,
      classroom: data.classroom ?? list[index].classroom,
    };
    list[index] = updated;
    setItem(KEYS.COURSES, list);
    return updated;
  },

  archiveCourse(courseId: string | number): Course {
    this.init();
    const list = getItem<Course[]>(KEYS.COURSES, DEMO_COURSES);
    const index = list.findIndex((c) => String(c.id) === String(courseId));
    if (index === -1) throw new Error('Curso no encontrado.');
    list[index].status = 'archived';
    setItem(KEYS.COURSES, list);
    return list[index];
  },

  reactivateCourse(courseId: string | number): Course {
    this.init();
    const list = getItem<Course[]>(KEYS.COURSES, DEMO_COURSES);
    const index = list.findIndex((c) => String(c.id) === String(courseId));
    if (index === -1) throw new Error('Curso no encontrado.');
    list[index].status = 'active';
    setItem(KEYS.COURSES, list);
    return list[index];
  },

  getCourseDependencies(courseId: string | number): CourseDependenciesDTO {
    this.init();
    const course = this.getCourseById(courseId);
    if (!course) throw new Error('Curso no encontrado.');

    const strId = String(courseId);
    const enrollments = this.getEnrollments({ courseId: strId, status: 'active' });
    const subjects = this.getSubjectsByCourse(strId);
    const activities = this.getActivities({ courseId: strId });
    const sessions = this.getSessions({ courseId: strId });
    const grades = this.getGradesHistory({ courseId: strId });
    const schemes = getItem<AcademicEvaluationScheme[]>(KEYS.SCHEMES, []).filter(
      (s) => String(s.courseId) === strId
    );

    const dependencies = {
      enrollments: enrollments.length,
      subjects: subjects.length,
      activities: activities.length,
      grades: grades.length,
      evaluationSchemes: schemes.length,
      classSessions: sessions.length,
    };

    const totalDeps =
      dependencies.enrollments +
      dependencies.subjects +
      dependencies.activities +
      dependencies.grades +
      dependencies.evaluationSchemes +
      dependencies.classSessions;

    const canDelete = totalDeps === 0;
    let reason: string | null = null;
    if (!canDelete) {
      const reasons: string[] = [];
      if (dependencies.enrollments > 0) reasons.push(`${dependencies.enrollments} matrícula(s)`);
      if (dependencies.subjects > 0) reasons.push(`${dependencies.subjects} materia(s)`);
      if (dependencies.activities > 0) reasons.push(`${dependencies.activities} actividad(es)`);
      if (dependencies.grades > 0) reasons.push(`${dependencies.grades} nota(s)`);
      reason = `No se puede eliminar porque contiene: ${reasons.join(', ')}. Considere archivar el curso.`;
    }

    return {
      courseId: Number(courseId),
      courseName: course.name,
      level: course.level,
      status: course.status,
      canDelete,
      reason,
      dependencies,
    };
  },

  deleteCourse(courseId: string | number): void {
    this.init();
    const deps = this.getCourseDependencies(courseId);
    if (!deps.canDelete) {
      throw new Error(deps.reason || 'El curso tiene dependencias activas y no puede eliminarse.');
    }
    const list = getItem<Course[]>(KEYS.COURSES, DEMO_COURSES);
    const filtered = list.filter((c) => String(c.id) !== String(courseId));
    setItem(KEYS.COURSES, filtered);
  },

  // ============================================================================
  // SUBJECTS
  // ============================================================================
  getSubjectsByCourse(courseId: string | number): Subject[] {
    this.init();
    const list = getItem<Subject[]>(KEYS.SUBJECTS, DEMO_SUBJECTS);
    const courseSubjects = list.filter((s) => String(s.courseId) === String(courseId));
    const schedules = getItem<Record<string, ScheduleSlot[]>>(KEYS.SCHEDULES, DEMO_SCHEDULE_SLOTS);

    return courseSubjects.map((sub) => {
      const slots = schedules[sub.id] || [];
      const totalPedagogicalHours = slots.reduce((sum, slot) => sum + (slot.pedagogicalHours || 0), 0);
      const req = sub.hoursPerWeek || 0;
      let scheduleStatus: 'no_schedule' | 'incomplete' | 'complete' | 'excess' = 'no_schedule';
      if (totalPedagogicalHours === 0) scheduleStatus = 'no_schedule';
      else if (totalPedagogicalHours === req) scheduleStatus = 'complete';
      else if (totalPedagogicalHours < req) scheduleStatus = 'incomplete';
      else scheduleStatus = 'excess';

      return {
        ...sub,
        activeSlots: slots,
        totalPedagogicalHours,
        scheduleStatus,
      };
    });
  },

  getAllSubjects(): Subject[] {
    this.init();
    return getItem<Subject[]>(KEYS.SUBJECTS, DEMO_SUBJECTS);
  },

  createSubject(
    courseId: string | number,
    data: {
      name: string;
      code?: string;
      hoursPerWeek?: number | null;
      teacherUserId?: number | null;
      scheduleSlots?: Array<{
        dayOfWeek: number;
        startTime: string;
        endTime: string;
        pedagogicalHours?: number;
        room?: string;
      }>;
    }
  ): Subject {
    this.init();
    const list = getItem<Subject[]>(KEYS.SUBJECTS, DEMO_SUBJECTS);
    const course = this.getCourseById(courseId);
    const newId = String(Date.now());
    const newSubject: Subject = {
      id: newId,
      name: data.name,
      code: data.code || `MAT-${Math.floor(100 + Math.random() * 900)}`,
      courseId: String(courseId),
      courseName: course?.name || 'Curso',
      teacherName: 'Lic. Carlos Andrade M.',
      hoursPerWeek: Number(data.hoursPerWeek) || 4,
    };
    list.push(newSubject);
    setItem(KEYS.SUBJECTS, list);

    if (data.scheduleSlots && data.scheduleSlots.length > 0) {
      const schedules = getItem<Record<string, ScheduleSlot[]>>(KEYS.SCHEDULES, DEMO_SCHEDULE_SLOTS);
      const createdSlots = data.scheduleSlots.map((slot, idx) => ({
        id: String(Date.now() + idx),
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        pedagogicalHours: slot.pedagogicalHours || 2,
        room: slot.room || course?.classroom,
        teacherName: 'Lic. Carlos Andrade M.',
      }));
      schedules[newId] = createdSlots;
      setItem(KEYS.SCHEDULES, schedules);
      newSubject.activeSlots = createdSlots;
      newSubject.totalPedagogicalHours = createdSlots.reduce((sum, s) => sum + (s.pedagogicalHours || 0), 0);
      newSubject.scheduleStatus =
        newSubject.totalPedagogicalHours === (newSubject.hoursPerWeek || 0)
          ? 'complete'
          : newSubject.totalPedagogicalHours < (newSubject.hoursPerWeek || 0)
          ? 'incomplete'
          : 'excess';
    } else {
      newSubject.activeSlots = [];
      newSubject.totalPedagogicalHours = 0;
      newSubject.scheduleStatus = 'no_schedule';
    }

    if (course) {
      const courses = getItem<Course[]>(KEYS.COURSES, DEMO_COURSES);
      const cIdx = courses.findIndex((c) => String(c.id) === String(courseId));
      if (cIdx !== -1) {
        courses[cIdx].subjectsCount += 1;
        setItem(KEYS.COURSES, courses);
      }
    }

    return newSubject;
  },

  updateSubject(
    subjectId: string | number,
    data: {
      name?: string;
      code?: string;
      hoursPerWeek?: number | null;
      scheduleSlots?: Array<{
        dayOfWeek: number;
        startTime: string;
        endTime: string;
        pedagogicalHours?: number;
        room?: string;
      }>;
    }
  ): Subject {
    this.init();
    const list = getItem<Subject[]>(KEYS.SUBJECTS, DEMO_SUBJECTS);
    const index = list.findIndex((s) => String(s.id) === String(subjectId));
    if (index === -1) throw new Error('Materia no encontrada.');

    const updated: Subject = {
      ...list[index],
      name: data.name ?? list[index].name,
      code: data.code ?? list[index].code,
      hoursPerWeek: data.hoursPerWeek !== undefined ? Number(data.hoursPerWeek) : list[index].hoursPerWeek,
    };

    if (data.scheduleSlots) {
      const schedules = getItem<Record<string, ScheduleSlot[]>>(KEYS.SCHEDULES, DEMO_SCHEDULE_SLOTS);
      const createdSlots = data.scheduleSlots.map((slot, idx) => ({
        id: String(Date.now() + idx),
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        pedagogicalHours: slot.pedagogicalHours || 2,
        room: slot.room,
        teacherName: 'Lic. Carlos Andrade M.',
      }));
      schedules[String(subjectId)] = createdSlots;
      setItem(KEYS.SCHEDULES, schedules);
      updated.activeSlots = createdSlots;
      updated.totalPedagogicalHours = createdSlots.reduce((sum, s) => sum + (s.pedagogicalHours || 0), 0);
      updated.scheduleStatus =
        updated.totalPedagogicalHours === (updated.hoursPerWeek || 0)
          ? 'complete'
          : updated.totalPedagogicalHours < (updated.hoursPerWeek || 0)
          ? 'incomplete'
          : 'excess';
    } else {
      const schedules = getItem<Record<string, ScheduleSlot[]>>(KEYS.SCHEDULES, DEMO_SCHEDULE_SLOTS);
      const existingSlots = schedules[String(subjectId)] || [];
      updated.activeSlots = existingSlots;
      updated.totalPedagogicalHours = existingSlots.reduce((sum, s) => sum + (s.pedagogicalHours || 0), 0);
      updated.scheduleStatus =
        existingSlots.length === 0
          ? 'no_schedule'
          : updated.totalPedagogicalHours === (updated.hoursPerWeek || 0)
          ? 'complete'
          : updated.totalPedagogicalHours < (updated.hoursPerWeek || 0)
          ? 'incomplete'
          : 'excess';
    }

    list[index] = updated;
    setItem(KEYS.SUBJECTS, list);

    return updated;
  },

  inactivateSubject(subjectId: string | number): void {
    this.init();
    const list = getItem<Subject[]>(KEYS.SUBJECTS, DEMO_SUBJECTS);
    const index = list.findIndex((s) => String(s.id) === String(subjectId));
    if (index !== -1) {
      list.splice(index, 1);
      setItem(KEYS.SUBJECTS, list);
    }
  },

  // ============================================================================
  // SCHEDULES
  // ============================================================================
  getSubjectSchedule(subjectId: string | number): SubjectScheduleDTO {
    this.init();
    const subjects = this.getAllSubjects();
    const sub = subjects.find((s) => String(s.id) === String(subjectId));
    if (!sub) throw new Error('Materia no encontrada.');

    const schedules = getItem<Record<string, ScheduleSlot[]>>(KEYS.SCHEDULES, DEMO_SCHEDULE_SLOTS);
    const activeSlots = schedules[String(subjectId)] || [];
    const totalPedagogicalHours = activeSlots.reduce((sum, s) => sum + (s.pedagogicalHours || 0), 0);
    const req = sub.hoursPerWeek || 0;

    let scheduleStatus: 'no_schedule' | 'incomplete' | 'complete' | 'excess' = 'no_schedule';
    if (totalPedagogicalHours === 0) scheduleStatus = 'no_schedule';
    else if (totalPedagogicalHours === req) scheduleStatus = 'complete';
    else if (totalPedagogicalHours < req) scheduleStatus = 'incomplete';
    else scheduleStatus = 'excess';

    return {
      subject: {
        id: String(sub.id),
        name: sub.name,
        code: sub.code || '',
        courseId: String(sub.courseId),
        courseName: sub.courseName,
        hoursPerWeek: req,
        teacherName: sub.teacherName,
      },
      activeSlots,
      scheduleStatus,
      totalPedagogicalHours,
      hoursPerWeek: req,
    };
  },

  saveSubjectSchedule(
    subjectId: string | number,
    data: {
      slots: Array<{
        dayOfWeek: number;
        startTime: string;
        endTime: string;
        pedagogicalHours?: number;
        room?: string | null;
      }>;
    }
  ): any {
    this.init();
    const schedules = getItem<Record<string, ScheduleSlot[]>>(KEYS.SCHEDULES, DEMO_SCHEDULE_SLOTS);
    schedules[String(subjectId)] = data.slots.map((s, idx) => ({
      id: String(Date.now() + idx),
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      pedagogicalHours: s.pedagogicalHours || 2,
      room: s.room || undefined,
      teacherName: 'Lic. Carlos Andrade M.',
    }));
    setItem(KEYS.SCHEDULES, schedules);
    return this.getSubjectSchedule(subjectId);
  },

  getCourseSchedule(courseId: string | number): any {
    this.init();
    const course = this.getCourseById(courseId);
    if (!course) throw new Error('Curso no encontrado.');

    const subjects = this.getSubjectsByCourse(courseId);
    const slots: any[] = [];
    for (const sub of subjects) {
      if (sub.activeSlots) {
        for (const slot of sub.activeSlots) {
          slots.push({
            ...slot,
            subjectId: sub.id,
            subjectName: sub.name,
          });
        }
      }
    }

    return {
      course: { id: Number(course.id), name: course.name, level: course.level },
      slots,
    };
  },

  // ============================================================================
  // STUDENTS
  // ============================================================================
  getStudents(filter?: { status?: string; courseId?: number | string; search?: string }): Student[] {
    this.init();
    let list = getItem<Student[]>(KEYS.STUDENTS, DEMO_STUDENTS);

    if (filter?.status) {
      list = list.filter((s) => s.status.toLowerCase() === filter.status?.toLowerCase());
    }
    if (filter?.courseId) {
      list = list.filter((s) => String(s.courseId) === String(filter.courseId));
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(
        (s) =>
          s.firstName.toLowerCase().includes(q) ||
          s.lastName.toLowerCase().includes(q) ||
          s.identification.includes(q) ||
          s.email.toLowerCase().includes(q)
      );
    }

    return list;
  },

  getStudentById(studentId: string | number): Student | null {
    const list = this.getStudents();
    return list.find((s) => String(s.id) === String(studentId)) || null;
  },

  createStudent(data: {
    firstName: string;
    lastName: string;
    identification?: string | null;
    email?: string | null;
    phone?: string | null;
  }): Student {
    this.init();
    const list = getItem<Student[]>(KEYS.STUDENTS, DEMO_STUDENTS);

    if (data.identification) {
      const existing = list.find((s) => s.identification === data.identification);
      if (existing) {
        throw new Error(`Ya existe un estudiante con la identificación ${data.identification}.`);
      }
    }

    const newStudent: Student = {
      id: String(Date.now()),
      firstName: data.firstName,
      lastName: data.lastName,
      identification: data.identification || `${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      email: data.email || `${data.firstName.toLowerCase().replace(/\s+/g, '')}@estudiante.uehorizonte.edu.ec`,
      phone: data.phone || '0990000000',
      courseId: '',
      courseName: 'Sin matrícula',
      status: 'active',
      attendancePercentage: 100,
      averageGrade: 0,
    };
    list.unshift(newStudent);
    setItem(KEYS.STUDENTS, list);
    return newStudent;
  },

  updateStudent(
    studentId: string | number,
    data: {
      firstName?: string;
      lastName?: string;
      identification?: string | null;
      email?: string | null;
      phone?: string | null;
    }
  ): Student {
    this.init();
    const list = getItem<Student[]>(KEYS.STUDENTS, DEMO_STUDENTS);
    const index = list.findIndex((s) => String(s.id) === String(studentId));
    if (index === -1) throw new Error('Estudiante no encontrado.');

    const updated = {
      ...list[index],
      firstName: data.firstName ?? list[index].firstName,
      lastName: data.lastName ?? list[index].lastName,
      identification: data.identification ?? list[index].identification,
      email: data.email ?? list[index].email,
      phone: data.phone ?? list[index].phone,
    };
    list[index] = updated;
    setItem(KEYS.STUDENTS, list);
    return updated;
  },

  inactivateStudent(studentId: string | number): void {
    this.init();
    const list = getItem<Student[]>(KEYS.STUDENTS, DEMO_STUDENTS);
    const index = list.findIndex((s) => String(s.id) === String(studentId));
    if (index !== -1) {
      list[index].status = 'inactive';
      setItem(KEYS.STUDENTS, list);
    }
  },

  // ============================================================================
  // ENROLLMENTS
  // ============================================================================
  getEnrollments(filter?: { courseId?: number | string; studentId?: number | string; status?: string }): Enrollment[] {
    this.init();
    let list = getItem<Enrollment[]>(KEYS.ENROLLMENTS, DEMO_ENROLLMENTS);
    if (filter?.courseId) {
      list = list.filter((e) => String(e.courseId) === String(filter.courseId));
    }
    if (filter?.studentId) {
      list = list.filter((e) => String(e.studentId) === String(filter.studentId));
    }
    if (filter?.status) {
      list = list.filter((e) => e.status.toLowerCase() === filter.status?.toLowerCase());
    }
    return list;
  },

  enrollStudent(
    studentId: number | string,
    courseId: number | string,
    _period?: string | null,
    academicYearId?: number | string | null
  ): Enrollment {
    this.init();
    const enrollments = getItem<Enrollment[]>(KEYS.ENROLLMENTS, DEMO_ENROLLMENTS);
    const students = getItem<Student[]>(KEYS.STUDENTS, DEMO_STUDENTS);
    const courses = getItem<Course[]>(KEYS.COURSES, DEMO_COURSES);
    const years = this.getAcademicYears();

    const course = courses.find((c) => String(c.id) === String(courseId));
    const sIndex = students.findIndex((s) => String(s.id) === String(studentId));
    const activeYear = academicYearId
      ? years.find((y) => String(y.id) === String(academicYearId))
      : years.find((y) => y.status === 'ACTIVE') || years[0];

    if (sIndex !== -1 && course) {
      students[sIndex].courseId = String(courseId);
      students[sIndex].courseName = course.name;
      setItem(KEYS.STUDENTS, students);
    }

    const activeYearIdStr = activeYear ? String(activeYear.id) : '1';

    const existingActiveIndex = enrollments.findIndex(
      (e) => String(e.studentId) === String(studentId) && e.academicYearId === activeYearIdStr && e.status === 'active'
    );

    if (existingActiveIndex !== -1) {
      const existing = enrollments[existingActiveIndex];
      if (String(existing.courseId) === String(courseId)) {
        return existing;
      }
      enrollments[existingActiveIndex].status = 'inactive';
    }

    const newEnrollment: Enrollment = {
      id: String(Date.now()),
      studentId: String(studentId),
      courseId: String(courseId),
      academicYearId: activeYearIdStr,
      academicYearName: activeYear ? activeYear.name : 'Año Lectivo 2025-2026',
      status: 'active',
      enrollmentDate: getLocalDateString(),
    };

    enrollments.unshift(newEnrollment);
    setItem(KEYS.ENROLLMENTS, enrollments);

    if (course) {
      const activeCourseEnrollments = enrollments.filter(
        (e) => String(e.courseId) === String(courseId) && e.status === 'active'
      );
      course.studentCount = activeCourseEnrollments.length;
      setItem(KEYS.COURSES, courses);
    }

    return newEnrollment;
  },

  enrollStudentsBatch(
    studentIds: (number | string)[],
    courseId: number | string,
    academicYearId?: number | string | null
  ): EnrollmentResult {
    this.init();
    const students = this.getStudents();
    const courses = this.getCourses();
    const course = courses.find((c) => String(c.id) === String(courseId));
    if (!course) {
      throw new Error(`Curso no encontrado (ID: ${courseId}).`);
    }

    const successfulEnrollments: Enrollment[] = [];
    const errors: { studentId: string; identification?: string; name?: string; error: string }[] = [];
    const failedStudentIds: string[] = [];

    for (const sId of studentIds) {
      const studentStr = String(sId);
      const studentObj = students.find((s) => String(s.id) === studentStr);
      if (!studentObj) {
        errors.push({
          studentId: studentStr,
          error: 'Estudiante no encontrado en el sistema.',
        });
        failedStudentIds.push(studentStr);
        continue;
      }

      try {
        const enr = this.enrollStudent(sId, courseId, null, academicYearId);
        successfulEnrollments.push(enr);
      } catch (err: any) {
        errors.push({
          studentId: studentStr,
          identification: studentObj.identification,
          name: `${studentObj.firstName} ${studentObj.lastName}`,
          error: err?.message || 'Error al procesar matrícula',
        });
        failedStudentIds.push(studentStr);
      }
    }

    return {
      success: errors.length === 0,
      totalRequested: studentIds.length,
      successCount: successfulEnrollments.length,
      failedCount: errors.length,
      failedStudentIds,
      errors,
      enrollments: successfulEnrollments,
    };
  },

  updateEnrollmentStatus(enrollmentId: number | string, status: string): Enrollment {
    this.init();
    const list = getItem<Enrollment[]>(KEYS.ENROLLMENTS, DEMO_ENROLLMENTS);
    const index = list.findIndex((e) => String(e.id) === String(enrollmentId));
    if (index === -1) throw new Error('Matrícula no encontrada.');

    list[index].status = status.toLowerCase() === 'active' ? 'active' : 'inactive';
    setItem(KEYS.ENROLLMENTS, list);
    return list[index];
  },

  // ============================================================================
  // SESSIONS
  // ============================================================================
  getSessions(filter?: {
    courseId?: number | string;
    subjectId?: number | string;
    status?: string;
    date?: string;
    search?: string;
  }): ClassSession[] {
    this.init();
    let list = getItem<ClassSession[]>(KEYS.SESSIONS, DEMO_CLASS_SESSIONS);

    if (filter?.courseId) {
      list = list.filter((s) => String(s.courseId) === String(filter.courseId));
    }
    if (filter?.subjectId) {
      list = list.filter((s) => String(s.subjectId) === String(filter.subjectId));
    }
    if (filter?.status) {
      list = list.filter((s) => s.status.toLowerCase() === filter.status?.toLowerCase());
    }
    if (filter?.date) {
      list = list.filter((s) => s.date === filter.date);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      list = list.filter((s) => s.subjectName.toLowerCase().includes(q) || s.topic?.toLowerCase().includes(q));
    }

    return list;
  },

  getSessionById(sessionId: number | string): (ClassSession & { attendanceRecords: AttendanceRecord[] }) | null {
    const list = this.getSessions();
    const session = list.find((s) => String(s.id) === String(sessionId));
    if (!session) return null;

    const allAttendance = this.getAttendanceHistory();
    const attendanceRecords = allAttendance.filter((a) => String(a.sessionId) === String(sessionId));

    return {
      ...session,
      attendanceRecords,
    };
  },

  createSession(
    courseId: number | string,
    data: {
      subjectId?: number | string | null;
      sessionDate: string;
      startTime?: string | null;
      endTime?: string | null;
      room?: string | null;
      topic?: string | null;
    }
  ): ClassSession {
    this.init();
    const list = getItem<ClassSession[]>(KEYS.SESSIONS, DEMO_CLASS_SESSIONS);
    const course = this.getCourseById(courseId);
    const subjects = this.getAllSubjects();
    const subject = subjects.find((s) => String(s.id) === String(data.subjectId));

    const timeStr = data.startTime && data.endTime
      ? `${data.startTime} - ${data.endTime}`
      : data.startTime || '08:00 - 09:30';

    const newSession: ClassSession = {
      id: String(Date.now()),
      courseId: String(courseId),
      courseName: course?.name || 'Curso',
      subjectId: data.subjectId ? String(data.subjectId) : '',
      subjectName: subject?.name || 'Materia General',
      date: data.sessionDate,
      time: timeStr,
      room: data.room || course?.classroom || 'Aula General',
      status: 'scheduled',
      topic: data.topic || '',
    };

    list.unshift(newSession);
    setItem(KEYS.SESSIONS, list);
    return newSession;
  },

  updateSession(
    sessionId: number | string,
    data: {
      subjectId?: number | string | null;
      sessionDate?: string;
      startTime?: string | null;
      endTime?: string | null;
      room?: string | null;
      topic?: string | null;
      status?: string;
    }
  ): ClassSession {
    this.init();
    const list = getItem<ClassSession[]>(KEYS.SESSIONS, DEMO_CLASS_SESSIONS);
    const index = list.findIndex((s) => String(s.id) === String(sessionId));
    if (index === -1) throw new Error('Sesión no encontrada.');

    const updated: ClassSession = {
      ...list[index],
      subjectId: data.subjectId !== undefined ? (data.subjectId ? String(data.subjectId) : '') : list[index].subjectId,
      date: data.sessionDate ?? list[index].date,
      room: data.room ?? list[index].room,
      topic: data.topic ?? list[index].topic,
      status: (data.status as any) ?? list[index].status,
    };
    list[index] = updated;
    setItem(KEYS.SESSIONS, list);
    return updated;
  },

  cancelSession(sessionId: number | string): void {
    this.init();
    const list = getItem<ClassSession[]>(KEYS.SESSIONS, DEMO_CLASS_SESSIONS);
    const index = list.findIndex((s) => String(s.id) === String(sessionId));
    if (index !== -1) {
      list[index].status = 'canceled';
      setItem(KEYS.SESSIONS, list);
    }
  },

  // ============================================================================
  // ATTENDANCE
  // ============================================================================
  saveAttendanceBatch(
    sessionId: number | string,
    records: { studentId: number | string; status: AttendanceStatus; observation?: string | null }[]
  ): AttendanceRecord[] {
    this.init();
    const attendanceList = getItem<AttendanceRecord[]>(KEYS.ATTENDANCE, DEMO_ATTENDANCE);
    const students = this.getStudents();
    const session = this.getSessions().find((s) => String(s.id) === String(sessionId));

    const updatedOrNew: AttendanceRecord[] = [];

    for (const record of records) {
      const student = students.find((s) => String(s.id) === String(record.studentId));
      const studentName = student ? `${student.firstName} ${student.lastName}` : 'Estudiante';

      const existingIndex = attendanceList.findIndex(
        (a) => String(a.sessionId) === String(sessionId) && String(a.studentId) === String(record.studentId)
      );

      if (existingIndex !== -1) {
        attendanceList[existingIndex].status = record.status;
        attendanceList[existingIndex].observation = record.observation || undefined;
        updatedOrNew.push(attendanceList[existingIndex]);
      } else {
        const newRecord: AttendanceRecord = {
          id: String(Date.now() + Math.random()),
          sessionId: String(sessionId),
          studentId: String(record.studentId),
          studentName,
          courseId: session?.courseId || student?.courseId || '1',
          subjectId: session?.subjectId || '',
          date: session?.date || getLocalDateString(),
          status: record.status,
          observation: record.observation || undefined,
        };
        attendanceList.push(newRecord);
        updatedOrNew.push(newRecord);
      }
    }

    setItem(KEYS.ATTENDANCE, attendanceList);
    return updatedOrNew;
  },

  getAttendanceHistory(filter?: {
    courseId?: number | string;
    subjectId?: number | string;
    studentId?: number | string;
    date?: string;
    status?: string;
  }): AttendanceRecord[] {
    this.init();
    let list = getItem<AttendanceRecord[]>(KEYS.ATTENDANCE, DEMO_ATTENDANCE);

    if (filter?.courseId) {
      list = list.filter((a) => String(a.courseId) === String(filter.courseId));
    }
    if (filter?.subjectId) {
      list = list.filter((a) => String(a.subjectId) === String(filter.subjectId));
    }
    if (filter?.studentId) {
      list = list.filter((a) => String(a.studentId) === String(filter.studentId));
    }
    if (filter?.date) {
      list = list.filter((a) => a.date === filter.date);
    }
    if (filter?.status) {
      list = list.filter((a) => a.status.toLowerCase() === filter.status?.toLowerCase());
    }

    return list;
  },

  updateAttendanceRecord(
    attendanceId: number | string,
    data: { status?: AttendanceStatus; observation?: string | null }
  ): AttendanceRecord {
    this.init();
    const list = getItem<AttendanceRecord[]>(KEYS.ATTENDANCE, DEMO_ATTENDANCE);
    const index = list.findIndex((a) => String(a.id) === String(attendanceId));
    if (index === -1) throw new Error('Registro de asistencia no encontrado.');

    if (data.status) list[index].status = data.status;
    if (data.observation !== undefined) list[index].observation = data.observation || undefined;

    setItem(KEYS.ATTENDANCE, list);
    return list[index];
  },

  // ============================================================================
  // ACTIVITIES
  // ============================================================================
  getActivities(filter?: {
    courseId?: number | string;
    subjectId?: number | string;
    type?: string;
    search?: string;
  }): Activity[] {
    this.init();
    let list = getItem<Activity[]>(KEYS.ACTIVITIES, DEMO_ACTIVITIES);

    if (filter?.courseId) {
      list = list.filter((a) => String(a.courseId) === String(filter.courseId));
    }
    if (filter?.subjectId) {
      list = list.filter((a) => String(a.subjectId) === String(filter.subjectId));
    }
    if (filter?.type) {
      list = list.filter((a) => a.type.toLowerCase() === filter.type?.toLowerCase());
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      list = list.filter((a) => a.name.toLowerCase().includes(q));
    }

    return list;
  },

  getActivityById(activityId: number | string): Activity | null {
    const list = this.getActivities();
    return list.find((a) => String(a.id) === String(activityId)) || null;
  },

  createActivity(
    courseId: number | string,
    data: {
      subjectId: number | string;
      name: string;
      type?: string;
      dueDate?: string | null;
      maxScore: number;
      academicPeriodId?: number | string | null;
      categoryId?: number | string | null;
      evaluationSchemeId?: number | string | null;
    }
  ): Activity {
    this.init();
    const periodId = data.academicPeriodId ? String(data.academicPeriodId) : '21';
    const period = this.getAcademicPeriodById(periodId);
    if (period && period.status === 'CLOSED') {
      throw new Error('No se pueden crear actividades en un período cerrado.');
    }

    const activityDate = data.dueDate || getLocalDateString();
    if (period?.startDate && activityDate < period.startDate) {
      throw new Error(`La fecha de la actividad no puede ser anterior al inicio del período (${period.startDate}).`);
    }
    if (period?.endDate && activityDate > period.endDate) {
      throw new Error(`La fecha de la actividad no puede ser posterior al fin del período (${period.endDate}).`);
    }

    const list = getItem<Activity[]>(KEYS.ACTIVITIES, DEMO_ACTIVITIES);
    const isExam = data.type === 'exam';
    if (isExam) {
      const existingExam = list.find(
        (a) =>
          String(a.courseId) === String(courseId) &&
          String(a.subjectId) === String(data.subjectId) &&
          String(a.academicPeriodId) === periodId &&
          a.type === 'exam'
      );
      if (existingExam) {
        throw new Error('Este período ya cuenta con una Evaluación Parcial única registrada.');
      }
    }

    const schemes = this.getEvaluationSchemes({
      courseId,
      subjectId: data.subjectId,
      academicPeriodId: periodId,
    });
    const scheme = schemes[0];
    if (scheme && scheme.status !== 'VALID') {
      throw new Error('La materia no cuenta con un esquema de evaluación válido para este período.');
    }

    const categories = getItem<AcademicEvaluationCategory[]>(KEYS.CATEGORIES, DEMO_EVALUATION_CATEGORIES);
    if (scheme?.categories && scheme.categories.length > 0 && !data.categoryId) {
      throw new Error('Debe seleccionar una categoría de evaluación ponderada obligatoria.');
    }

    const category = data.categoryId ? categories.find((c) => String(c.id) === String(data.categoryId)) : undefined;

    const newActivity: Activity = {
      id: String(Date.now()),
      courseId: String(courseId),
      subjectId: String(data.subjectId),
      name: data.name,
      type: (data.type as any) || 'homework',
      date: activityDate,
      maxScore: Number(data.maxScore) || 10,
      academicPeriodId: periodId,
      evaluationSchemeId: data.evaluationSchemeId ? String(data.evaluationSchemeId) : (scheme ? String(scheme.id) : undefined),
      categoryId: data.categoryId ? String(data.categoryId) : undefined,
      categoryName: category?.name,
    };
    list.unshift(newActivity);
    setItem(KEYS.ACTIVITIES, list);
    return newActivity;
  },

  reassignActivityCategory(
    activityId: number | string,
    categoryId: number | string
  ): Activity {
    this.init();
    const list = getItem<Activity[]>(KEYS.ACTIVITIES, DEMO_ACTIVITIES);
    const index = list.findIndex((a) => String(a.id) === String(activityId));
    if (index === -1) throw new Error('Actividad no encontrada.');

    const activity = list[index];
    const period = this.getAcademicPeriodById(activity.academicPeriodId || '21');
    if (period && period.status === 'CLOSED') {
      throw new Error('No se puede modificar una actividad en un período cerrado.');
    }

    const categories = getItem<AcademicEvaluationCategory[]>(KEYS.CATEGORIES, DEMO_EVALUATION_CATEGORIES);
    const category = categories.find((c) => String(c.id) === String(categoryId));
    if (!category) throw new Error('Categoría de evaluación no encontrada.');

    list[index] = {
      ...activity,
      categoryId: String(categoryId),
      categoryName: category.name,
    };
    setItem(KEYS.ACTIVITIES, list);
    return list[index];
  },

  updateActivity(
    activityId: number | string,
    data: {
      name?: string;
      type?: string;
      dueDate?: string | null;
      maxScore?: number;
      academicPeriodId?: number | string | null;
      categoryId?: number | string | null;
      evaluationSchemeId?: number | string | null;
    }
  ): Activity {
    this.init();
    const list = getItem<Activity[]>(KEYS.ACTIVITIES, DEMO_ACTIVITIES);
    const index = list.findIndex((a) => String(a.id) === String(activityId));
    if (index === -1) throw new Error('Actividad no encontrada.');

    const updated: Activity = {
      ...list[index],
      name: data.name ?? list[index].name,
      type: (data.type as any) ?? list[index].type,
      date: data.dueDate ?? list[index].date,
      maxScore: data.maxScore !== undefined ? Number(data.maxScore) : list[index].maxScore,
      academicPeriodId: data.academicPeriodId ? String(data.academicPeriodId) : list[index].academicPeriodId,
      categoryId: data.categoryId ? String(data.categoryId) : list[index].categoryId,
      evaluationSchemeId: data.evaluationSchemeId ? String(data.evaluationSchemeId) : list[index].evaluationSchemeId,
    };
    list[index] = updated;
    setItem(KEYS.ACTIVITIES, list);
    return updated;
  },

  // ============================================================================
  // GRADES
  // ============================================================================
  saveGradesBatch(
    activityId: number | string,
    grades: { studentId?: number | string; score?: number | null; comments?: string | null; status?: string }[]
  ): GradeItem[] {
    this.init();
    const gradesList = getItem<GradeItem[]>(KEYS.GRADES, DEMO_GRADES);
    const activity = this.getActivityById(activityId);
    const students = this.getStudents();
    const subjects = this.getAllSubjects();
    const subject = subjects.find((s) => String(s.id) === String(activity?.subjectId));

    const updatedOrNew: GradeItem[] = [];

    for (const g of grades) {
      if (!g.studentId) continue;
      const student = students.find((s) => String(s.id) === String(g.studentId));
      const studentName = student ? `${student.firstName} ${student.lastName}` : 'Estudiante';

      const existingIdx = gradesList.findIndex(
        (item) => String(item.evaluationId) === String(activityId) && String(item.studentId) === String(g.studentId)
      );

      const scoreVal = g.score !== undefined && g.score !== null ? Number(g.score) : 0;
      const gradeStatus = (g.status as AcademicGradeStatus) || (g.score !== null && g.score !== undefined ? 'GRADED' : 'PENDING');

      if (existingIdx !== -1) {
        gradesList[existingIdx].score = scoreVal;
        gradesList[existingIdx].comments = g.comments || undefined;
        gradesList[existingIdx].status = gradeStatus;
        updatedOrNew.push(gradesList[existingIdx]);
      } else {
        const newItem: GradeItem = {
          id: String(Date.now() + Math.random()),
          evaluationId: String(activityId),
          studentId: String(g.studentId),
          studentName,
          courseId: activity?.courseId || student?.courseId || '1',
          subjectId: activity?.subjectId || '',
          subjectName: subject?.name || 'Materia',
          evaluationName: activity?.name || 'Evaluación',
          evaluationType: activity?.type || 'homework',
          score: scoreVal,
          maxScore: activity?.maxScore || 10,
          date: activity?.date || getLocalDateString(),
          comments: g.comments || undefined,
          status: gradeStatus,
        };
        gradesList.push(newItem);
        updatedOrNew.push(newItem);
      }
    }

    setItem(KEYS.GRADES, gradesList);
    return updatedOrNew;
  },

  getGradesHistory(filter?: {
    courseId?: number | string;
    subjectId?: number | string;
    activityId?: number | string;
    studentId?: number | string;
  }): GradeItem[] {
    this.init();
    let list = getItem<GradeItem[]>(KEYS.GRADES, DEMO_GRADES);

    if (filter?.courseId) {
      list = list.filter((g) => String(g.courseId) === String(filter.courseId));
    }
    if (filter?.subjectId) {
      list = list.filter((g) => String(g.subjectId) === String(filter.subjectId));
    }
    if (filter?.activityId) {
      list = list.filter((g) => String(g.evaluationId) === String(filter.activityId));
    }
    if (filter?.studentId) {
      list = list.filter((g) => String(g.studentId) === String(filter.studentId));
    }

    return list;
  },

  getStudentGrades(studentId: number | string): GradeItem[] {
    return this.getGradesHistory({ studentId });
  },

  updateGradeRecord(gradeId: number | string, data: { score?: number; comments?: string | null }): GradeItem {
    this.init();
    const list = getItem<GradeItem[]>(KEYS.GRADES, DEMO_GRADES);
    const index = list.findIndex((g) => String(g.id) === String(gradeId));
    if (index === -1) throw new Error('Calificación no encontrada.');

    if (data.score !== undefined) list[index].score = Number(data.score);
    if (data.comments !== undefined) list[index].comments = data.comments || undefined;

    setItem(KEYS.GRADES, list);
    return list[index];
  },

  // ============================================================================
  // ACADEMIC YEARS
  // ============================================================================
  getAcademicYears(filter?: { status?: string; search?: string }): AcademicYear[] {
    this.init();
    let list = getItem<AcademicYear[]>(KEYS.YEARS, DEMO_ACADEMIC_YEARS);
    if (filter?.status) {
      list = list.filter((y) => y.status === filter.status);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      list = list.filter((y) => y.name.toLowerCase().includes(q));
    }
    return list;
  },

  getAcademicYearById(yearId: number | string): AcademicYear {
    this.init();
    const years = this.getAcademicYears();
    const year = years.find((y) => String(y.id) === String(yearId));
    if (!year) throw new Error('Año lectivo no encontrado.');
    return year;
  },

  createAcademicYear(data: { name: string; startDate: string; endDate: string; status?: AcademicYearStatus }): AcademicYear {
    this.init();
    const years = getItem<AcademicYear[]>(KEYS.YEARS, DEMO_ACADEMIC_YEARS);
    const newYear: AcademicYear = {
      id: Date.now(),
      organizationId: 1,
      name: data.name,
      startDate: data.startDate,
      endDate: data.endDate,
      status: data.status || 'PLANNED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    years.push(newYear);
    setItem(KEYS.YEARS, years);
    return newYear;
  },

  updateAcademicYear(
    yearId: number | string,
    data: { name?: string; startDate?: string; endDate?: string; status?: AcademicYearStatus }
  ): AcademicYear {
    this.init();
    const years = getItem<AcademicYear[]>(KEYS.YEARS, DEMO_ACADEMIC_YEARS);
    const index = years.findIndex((y) => String(y.id) === String(yearId));
    if (index === -1) throw new Error('Año lectivo no encontrado.');

    years[index] = {
      ...years[index],
      name: data.name ?? years[index].name,
      startDate: data.startDate ?? years[index].startDate,
      endDate: data.endDate ?? years[index].endDate,
      status: data.status ?? years[index].status,
      updatedAt: new Date().toISOString(),
    };
    setItem(KEYS.YEARS, years);
    return years[index];
  },

  changeAcademicYearStatus(yearId: number | string, status: AcademicYearStatus): AcademicYear {
    return this.updateAcademicYear(yearId, { status });
  },

  // ============================================================================
  // ACADEMIC PERIODS
  // ============================================================================
  getAcademicPeriods(filter?: { academicYearId?: number | string; status?: string; parentId?: number | string }): AcademicPeriod[] {
    this.init();
    let list = getItem<AcademicPeriod[]>(KEYS.PERIODS, DEMO_ACADEMIC_PERIODS);

    if (filter?.academicYearId) {
      list = list.filter((p) => String(p.academicYearId) === String(filter.academicYearId));
    }
    if (filter?.status) {
      list = list.filter((p) => p.status === filter.status);
    }
    if (filter?.parentId !== undefined) {
      if (filter.parentId === null || filter.parentId === '') {
        list = list.filter((p) => p.parentId === null || p.parentId === undefined);
      } else {
        list = list.filter((p) => String(p.parentId) === String(filter.parentId));
      }
    }
    return list;
  },

  getAcademicPeriodById(periodId: number | string): AcademicPeriod {
    this.init();
    const periods = this.getAcademicPeriods();
    const period = periods.find((p) => String(p.id) === String(periodId));
    if (!period) throw new Error('Periodo académico no encontrado.');
    return period;
  },

  createAcademicPeriod(data: {
    academicYearId: number | string;
    parentId?: number | string | null;
    name: string;
    type: AcademicPeriodType;
    order?: number;
    startDate: string;
    endDate: string;
    status?: AcademicPeriodStatus;
  }): AcademicPeriod {
    this.init();
    const periods = getItem<AcademicPeriod[]>(KEYS.PERIODS, DEMO_ACADEMIC_PERIODS);
    const newPeriod: AcademicPeriod = {
      id: Date.now(),
      organizationId: 1,
      academicYearId: Number(data.academicYearId),
      parentId: data.parentId ? Number(data.parentId) : null,
      name: data.name,
      type: data.type,
      order: data.order ?? periods.length + 1,
      startDate: data.startDate,
      endDate: data.endDate,
      status: data.status || 'ACTIVE',
    };
    periods.push(newPeriod);
    setItem(KEYS.PERIODS, periods);
    return newPeriod;
  },

  updateAcademicPeriod(
    periodId: number | string,
    data: {
      name?: string;
      type?: AcademicPeriodType;
      order?: number;
      startDate?: string;
      endDate?: string;
      parentId?: number | string | null;
      status?: AcademicPeriodStatus;
    }
  ): AcademicPeriod {
    this.init();
    const periods = getItem<AcademicPeriod[]>(KEYS.PERIODS, DEMO_ACADEMIC_PERIODS);
    const index = periods.findIndex((p) => String(p.id) === String(periodId));
    if (index === -1) throw new Error('Periodo académico no encontrado.');

    periods[index] = {
      ...periods[index],
      name: data.name ?? periods[index].name,
      type: data.type ?? periods[index].type,
      order: data.order ?? periods[index].order,
      startDate: data.startDate ?? periods[index].startDate,
      endDate: data.endDate ?? periods[index].endDate,
      parentId: data.parentId !== undefined ? (data.parentId ? Number(data.parentId) : null) : periods[index].parentId,
      status: data.status ?? periods[index].status,
    };
    setItem(KEYS.PERIODS, periods);
    return periods[index];
  },

  changeAcademicPeriodStatus(periodId: number | string, status: AcademicPeriodStatus): AcademicPeriod {
    return this.updateAcademicPeriod(periodId, { status });
  },

  closeAcademicPeriod(periodId: number | string): AcademicPeriod {
    return this.changeAcademicPeriodStatus(periodId, 'CLOSED');
  },

  getPeriodClosureReadiness(periodId: number | string): PeriodClosureReadinessDTO {
    this.init();
    const period = this.getAcademicPeriodById(periodId);
    const activities = this.getActivities().filter((a) => String(a.academicPeriodId) === String(periodId));
    const enrollments = this.getEnrollments({ status: 'active' });
    const grades = this.getGradesHistory().filter((g) => activities.some((a) => a.id === g.evaluationId));
    const schemes = getItem<AcademicEvaluationScheme[]>(KEYS.SCHEMES, []).filter(
      (s) => String(s.academicPeriodId) === String(periodId)
    );

    let graded = 0;
    let pending = 0;
    let absent = 0;
    let excused = 0;

    for (const g of grades) {
      if (g.status === 'GRADED') graded += 1;
      else if (g.status === 'PENDING') pending += 1;
      else if (g.status === 'ABSENT') absent += 1;
      else if (g.status === 'EXCUSED') excused += 1;
    }

    let validSchemes = 0;
    let draftSchemes = 0;
    let invalidWeightSchemes = 0;

    for (const s of schemes) {
      if (s.status === 'VALID') validSchemes += 1;
      else if (s.status === 'DRAFT') draftSchemes += 1;
      const cats = s.categories || [];
      const totalWeight = cats.reduce((sum, c) => sum + (c.weightPercentage || 0), 0);
      if (totalWeight !== 100) invalidWeightSchemes += 1;
    }

    const blockers: PeriodClosureBlocker[] = [];
    const warnings: PeriodClosureWarning[] = [];

    if (pending > 0) {
      blockers.push({
        type: 'PENDING_GRADES',
        message: `Existen ${pending} calificación(es) pendientes de registro.`,
        count: pending,
      });
    }

    if (invalidWeightSchemes > 0) {
      blockers.push({
        type: 'INCOMPLETE_WEIGHTS',
        message: `Hay ${invalidWeightSchemes} esquema(s) cuya suma de ponderaciones no es 100%.`,
        count: invalidWeightSchemes,
      });
    }

    if (draftSchemes > 0) {
      blockers.push({
        type: 'INVALID_SCHEMES',
        message: `Hay ${draftSchemes} esquema(s) en estado borrador.`,
        count: draftSchemes,
      });
    }

    if (excused > 0) {
      warnings.push({
        type: 'EXCUSED_GRADES_PRESENT',
        message: `Hay ${excused} nota(s) con ausencia justificada que no promedian.`,
        count: excused,
      });
    }

    if (activities.length === 0) {
      warnings.push({
        type: 'NO_ACTIVITIES',
        message: 'No se han registrado actividades en este periodo.',
        count: 0,
      });
    }

    const canClose = blockers.length === 0;

    return {
      periodId: Number(periodId),
      periodName: period.name,
      periodStatus: period.status,
      canClose,
      totalActivities: activities.length,
      totalEnrollments: enrollments.length,
      totalGrades: grades.length,
      gradeSummary: { graded, pending, absent, excused },
      schemes: {
        total: schemes.length,
        valid: validSchemes,
        draft: draftSchemes,
        locked: 0,
        closed: 0,
        invalidWeight: invalidWeightSchemes,
      },
      students: {
        total: enrollments.length,
        complete: enrollments.length,
        incomplete: 0,
      },
      blockers,
      warnings,
    };
  },

  // ============================================================================
  // EVALUATION SCHEMES & CATEGORIES
  // ============================================================================
  getEvaluationSchemes(filter?: { courseId?: number | string; subjectId?: number | string; academicPeriodId?: number | string }): AcademicEvaluationScheme[] {
    this.init();
    let schemes = getItem<AcademicEvaluationScheme[]>(KEYS.SCHEMES, DEMO_EVALUATION_SCHEMES);
    const categories = getItem<AcademicEvaluationCategory[]>(KEYS.CATEGORIES, DEMO_EVALUATION_CATEGORIES);

    if (filter?.courseId) {
      schemes = schemes.filter((s) => String(s.courseId) === String(filter.courseId));
    }
    if (filter?.subjectId) {
      schemes = schemes.filter((s) => String(s.subjectId) === String(filter.subjectId));
    }
    if (filter?.academicPeriodId) {
      schemes = schemes.filter((s) => String(s.academicPeriodId) === String(filter.academicPeriodId));
    }

    return schemes.map((s) => ({
      ...s,
      categories: categories.filter((c) => String(c.evaluationSchemeId) === String(s.id)),
    }));
  },

  getEvaluationSchemeById(schemeId: number | string): AcademicEvaluationScheme {
    const list = this.getEvaluationSchemes();
    const scheme = list.find((s) => String(s.id) === String(schemeId));
    if (!scheme) throw new Error('Esquema de evaluación no encontrado.');
    return scheme;
  },

  createEvaluationScheme(data: {
    courseId: number | string;
    subjectId: number | string;
    academicPeriodId: number | string;
    maxScale?: number;
    minPassingScore?: number;
  }): AcademicEvaluationScheme {
    this.init();
    const schemes = getItem<AcademicEvaluationScheme[]>(KEYS.SCHEMES, DEMO_EVALUATION_SCHEMES);
    const newScheme: AcademicEvaluationScheme = {
      id: Date.now(),
      organizationId: 1,
      courseId: Number(data.courseId),
      subjectId: Number(data.subjectId),
      academicPeriodId: Number(data.academicPeriodId),
      maxScale: data.maxScale ?? 10,
      minPassingScore: data.minPassingScore ?? 7,
      status: 'DRAFT',
      categories: [],
    };
    schemes.push(newScheme);
    setItem(KEYS.SCHEMES, schemes);
    return newScheme;
  },

  updateEvaluationScheme(
    schemeId: number | string,
    data: { maxScale?: number; minPassingScore?: number }
  ): AcademicEvaluationScheme {
    this.init();
    const schemes = getItem<AcademicEvaluationScheme[]>(KEYS.SCHEMES, DEMO_EVALUATION_SCHEMES);
    const index = schemes.findIndex((s) => String(s.id) === String(schemeId));
    if (index === -1) throw new Error('Esquema de evaluación no encontrado.');

    schemes[index] = {
      ...schemes[index],
      maxScale: data.maxScale ?? schemes[index].maxScale,
      minPassingScore: data.minPassingScore ?? schemes[index].minPassingScore,
    };
    setItem(KEYS.SCHEMES, schemes);
    return this.getEvaluationSchemeById(schemeId);
  },

  validateEvaluationScheme(schemeId: number | string): AcademicEvaluationScheme {
    this.init();
    const scheme = this.getEvaluationSchemeById(schemeId);
    const cats = scheme.categories || [];
    const totalWeight = cats.reduce((sum, c) => sum + (c.weightPercentage || 0), 0);
    if (totalWeight !== 100) {
      throw new Error(`La suma de ponderaciones de las categorías debe ser exactamente 100% (actual: ${totalWeight}%).`);
    }

    const schemes = getItem<AcademicEvaluationScheme[]>(KEYS.SCHEMES, DEMO_EVALUATION_SCHEMES);
    const index = schemes.findIndex((s) => String(s.id) === String(schemeId));
    if (index !== -1) {
      schemes[index].status = 'VALID';
      setItem(KEYS.SCHEMES, schemes);
    }
    return this.getEvaluationSchemeById(schemeId);
  },

  lockEvaluationScheme(schemeId: number | string): AcademicEvaluationScheme {
    this.init();
    const schemes = getItem<AcademicEvaluationScheme[]>(KEYS.SCHEMES, DEMO_EVALUATION_SCHEMES);
    const index = schemes.findIndex((s) => String(s.id) === String(schemeId));
    if (index !== -1) {
      schemes[index].status = 'LOCKED';
      setItem(KEYS.SCHEMES, schemes);
    }
    return this.getEvaluationSchemeById(schemeId);
  },

  closeEvaluationScheme(schemeId: number | string): AcademicEvaluationScheme {
    this.init();
    const schemes = getItem<AcademicEvaluationScheme[]>(KEYS.SCHEMES, DEMO_EVALUATION_SCHEMES);
    const index = schemes.findIndex((s) => String(s.id) === String(schemeId));
    if (index !== -1) {
      schemes[index].status = 'CLOSED';
      setItem(KEYS.SCHEMES, schemes);
    }
    return this.getEvaluationSchemeById(schemeId);
  },

  createEvaluationCategory(
    schemeId: number | string,
    data: { name: string; weightPercentage: number; order?: number }
  ): AcademicEvaluationCategory {
    this.init();
    const categories = getItem<AcademicEvaluationCategory[]>(KEYS.CATEGORIES, DEMO_EVALUATION_CATEGORIES);
    const newCat: AcademicEvaluationCategory = {
      id: Date.now(),
      evaluationSchemeId: Number(schemeId),
      name: data.name,
      weightPercentage: Number(data.weightPercentage),
      order: data.order ?? categories.length + 1,
    };
    categories.push(newCat);
    setItem(KEYS.CATEGORIES, categories);
    return newCat;
  },

  updateEvaluationCategory(
    categoryId: number | string,
    data: { name?: string; weightPercentage?: number; order?: number }
  ): AcademicEvaluationCategory {
    this.init();
    const categories = getItem<AcademicEvaluationCategory[]>(KEYS.CATEGORIES, DEMO_EVALUATION_CATEGORIES);
    const index = categories.findIndex((c) => String(c.id) === String(categoryId));
    if (index === -1) throw new Error('Categoría de evaluación no encontrada.');

    categories[index] = {
      ...categories[index],
      name: data.name ?? categories[index].name,
      weightPercentage: data.weightPercentage !== undefined ? Number(data.weightPercentage) : categories[index].weightPercentage,
      order: data.order ?? categories[index].order,
    };
    setItem(KEYS.CATEGORIES, categories);
    return categories[index];
  },

  deleteEvaluationCategory(categoryId: number | string): void {
    this.init();
    const categories = getItem<AcademicEvaluationCategory[]>(KEYS.CATEGORIES, DEMO_EVALUATION_CATEGORIES);
    const filtered = categories.filter((c) => String(c.id) !== String(categoryId));
    setItem(KEYS.CATEGORIES, filtered);
  },

  // ============================================================================
  // GRADES MATRIX
  // ============================================================================
  getPeriodGradesMatrix(
    courseId: number | string,
    subjectId: number | string,
    academicPeriodId: number | string,
    studentId?: number | string
  ): PeriodGradesMatrixDTO {
    this.init();
    const course = this.getCourseById(courseId);
    if (!course) throw new Error('Curso no encontrado.');

    const subjects = this.getAllSubjects();
    const subject = subjects.find((s) => String(s.id) === String(subjectId));
    if (!subject) throw new Error('Materia no encontrada.');

    const period = this.getAcademicPeriodById(academicPeriodId);

    const schemes = this.getEvaluationSchemes({
      courseId,
      subjectId,
      academicPeriodId,
    });
    const scheme = schemes[0] || null;
    const categories = scheme?.categories || [];

    const activities = this.getActivities({
      courseId,
      subjectId,
    }).filter((a) => String(a.academicPeriodId) === String(academicPeriodId));

    const enrollments = this.getEnrollments({ courseId, status: 'active' });
    let targetEnrollments = enrollments;
    if (studentId) {
      targetEnrollments = enrollments.filter((e) => String(e.studentId) === String(studentId));
    }

    const allGrades = this.getGradesHistory({ courseId, subjectId });
    const students = this.getStudents();

    const minPassing = scheme?.minPassingScore ?? 7.0;

    const matrixStudents: PeriodGradesMatrixStudent[] = targetEnrollments.map((enr) => {
      const student = students.find((s) => String(s.id) === String(enr.studentId));
      const sId = Number(enr.studentId);
      const studentName = student ? `${student.firstName} ${student.lastName}` : 'Estudiante';

      let totalWeightedContribution = 0;
      let evaluatedWeight = 0;
      let sumOfCategoryAverages = 0;
      let countOfEvaluatedCategories = 0;

      const matrixCategories: PeriodGradesMatrixCategory[] = categories.map((cat) => {
        const catActivities = activities.filter((a) => String(a.categoryId) === String(cat.id));
        const catScores: PeriodGradesMatrixActivityScore[] = catActivities.map((act) => {
          const g = allGrades.find(
            (grade) => String(grade.evaluationId) === String(act.id) && String(grade.studentId) === String(sId)
          );
          return {
            activityId: Number(act.id),
            activityName: act.name,
            activityType: act.type,
            maxScore: act.maxScore,
            score: g?.score ?? null,
            status: (g?.status as AcademicGradeStatus) || (g?.score !== null && g?.score !== undefined ? 'GRADED' : 'PENDING'),
          };
        });

        const gradedScores = catScores.filter((s) => s.score !== null);
        const isCatEvaluated = gradedScores.length > 0;
        const catAverage = isCatEvaluated
          ? gradedScores.reduce((sum, s) => sum + (s.score || 0), 0) / gradedScores.length
          : null;

        const weightedContribution = catAverage !== null ? (catAverage * cat.weightPercentage) / 100 : 0;

        if (catAverage !== null) {
          totalWeightedContribution += weightedContribution;
          evaluatedWeight += cat.weightPercentage;
          sumOfCategoryAverages += catAverage;
          countOfEvaluatedCategories += 1;
        }

        return {
          categoryId: Number(cat.id),
          categoryName: cat.name,
          weightPercentage: cat.weightPercentage,
          isEvaluated: isCatEvaluated,
          activitiesCount: catActivities.length,
          gradedCount: gradedScores.length,
          categoryAverage: catAverage !== null ? Number(catAverage.toFixed(2)) : null,
          weightedContribution: Number(weightedContribution.toFixed(2)),
          activities: catScores,
        };
      });

      const isComplete = evaluatedWeight === 100 && categories.length > 0;
      const isProvisional = !isComplete;
      const definitiveGrade = Number(totalWeightedContribution.toFixed(2));
      const provisionalAverage = countOfEvaluatedCategories > 0
        ? Number((sumOfCategoryAverages / countOfEvaluatedCategories).toFixed(2))
        : null;

      const isPassing = definitiveGrade >= minPassing;

      return {
        studentId: sId,
        enrollmentId: Number(enr.id),
        identification: student?.identification || '',
        lastName: student?.lastName || '',
        firstName: student?.firstName || '',
        fullName: studentName,
        evaluatedWeightPercentage: evaluatedWeight,
        isComplete,
        isProvisional,
        isPassing,
        definitiveGrade,
        provisionalAverage,
        categories: matrixCategories,
      };
    });

    return {
      course: { id: Number(course.id), name: course.name, level: course.level },
      subject: { id: Number(subject.id), name: subject.name, code: subject.code },
      period: { id: Number(period.id), name: period.name, type: period.type, status: period.status },
      scheme: scheme
        ? {
            id: Number(scheme.id),
            status: scheme.status,
            maxScale: scheme.maxScale,
            minPassingScore: scheme.minPassingScore,
            totalCategories: categories.length,
            categories: scheme.categories || [],
          }
        : null,
      categories: categories.map((cat) => ({
        categoryId: Number(cat.id),
        categoryName: cat.name,
        weightPercentage: cat.weightPercentage,
        isEvaluated: true,
        activitiesCount: activities.filter((a) => String(a.categoryId) === String(cat.id)).length,
        gradedCount: 0,
        categoryAverage: null,
        weightedContribution: 0,
        activities: [],
      })),
      activities: activities.map((a) => {
        const cat = categories.find((c) => String(c.id) === String(a.categoryId));
        return {
          id: Number(a.id),
          name: a.name,
          maxScore: a.maxScore,
          categoryName: cat?.name,
        };
      }),
      totalActivities: activities.length,
      totalStudents: targetEnrollments.length,
      isProvisional: matrixStudents.some((s) => s.isProvisional),
      students: matrixStudents,
      generatedAt: new Date().toISOString(),
    };
  },

  // ============================================================================
  // DASHBOARD
  // ============================================================================
  getDashboard(): AcademicDashboardDTO {
    this.init();
    const courses = this.getCourses();
    const students = this.getStudents();
    const sessions = this.getSessions();
    const activities = this.getActivities();
    const grades = this.getGradesHistory();
    const attendance = this.getAttendanceHistory();

    const activeCourses = courses.filter((c) => c.status === 'active');
    const activeStudents = students.filter((s) => s.status === 'active');
    const todayDate = getLocalDateString();
    const todaySessions = sessions.filter((s) => s.date === todayDate);

    const totalRecords = attendance.length;
    const presentCount = attendance.filter((a) => a.status === 'present').length;
    const absentCount = attendance.filter((a) => a.status === 'absent').length;
    const lateCount = attendance.filter((a) => a.status === 'late').length;
    const excusedCount = attendance.filter((a) => a.status === 'excused').length;
    const attendanceRate = totalRecords > 0 ? (presentCount / totalRecords) * 100 : null;

    const totalGradesCount = grades.length;
    const averageScore =
      totalGradesCount > 0 ? grades.reduce((sum, g) => sum + g.score, 0) / totalGradesCount : null;
    const normalizedPerformance = averageScore !== null ? (averageScore / 10) * 100 : null;

    const alerts: any[] = [];
    for (const st of students) {
      if (st.attendancePercentage > 0 && st.attendancePercentage < 85) {
        alerts.push({
          id: `att-${st.id}`,
          studentId: st.id,
          studentName: `${st.firstName} ${st.lastName}`,
          courseName: st.courseName,
          type: 'low_attendance',
          severity: st.attendancePercentage < 80 ? 'high' : 'medium',
          description: `Asistencia crítica acumulada del ${st.attendancePercentage}%`,
          date: todayDate,
        });
      }
    }

    return {
      teacherName: 'Lic. Carlos Andrade M.',
      activeCoursesCount: activeCourses.length,
      totalCoursesCount: courses.length,
      activeStudentsCount: activeStudents.length,
      totalStudentsCount: students.length,
      todaySessionsCount: todaySessions.length,
      todaySessions,
      upcomingActivities: activities.slice(0, 4),
      recentGrades: grades.slice(0, 4),
      attendanceSummary: {
        totalRecords,
        presentCount,
        absentCount,
        lateCount,
        excusedCount,
        attendanceRate: attendanceRate !== null ? Number(attendanceRate.toFixed(1)) : null,
      },
      performanceSummary: {
        totalGradesCount,
        averageScore: averageScore !== null ? Number(averageScore.toFixed(2)) : null,
        normalizedPerformance: normalizedPerformance !== null ? Number(normalizedPerformance.toFixed(1)) : null,
      },
      academicAlerts: alerts,
    };
  },

  // ============================================================================
  // REPORTS
  // ============================================================================
  getRosterReport(filter?: { courseId?: number | string; status?: string }): RosterReportDTO {
    this.init();
    const students = this.getStudents();
    const enrollments = this.getEnrollments(filter);
    const courses = this.getCourses();

    const course = filter?.courseId
      ? courses.find((c) => String(c.id) === String(filter.courseId))
      : null;

    const items = enrollments.map((e, idx) => {
      const student = students.find((s) => String(s.id) === String(e.studentId));
      const c = courses.find((crs) => String(crs.id) === String(e.courseId));
      return {
        id: idx + 1,
        studentId: Number(e.studentId),
        firstName: student?.firstName || '',
        lastName: student?.lastName || '',
        fullName: student ? `${student.firstName} ${student.lastName}` : 'Estudiante',
        identification: student?.identification || '',
        email: student?.email || null,
        phone: student?.phone || null,
        status: student?.status?.toUpperCase() || 'ACTIVE',
        enrollmentStatus: e.status?.toUpperCase() || 'ACTIVE',
        enrolledAt: e.enrollmentDate,
        courseId: Number(e.courseId),
        courseName: c?.name || 'Curso',
        courseLevel: c?.level || 'Nivel',
      };
    });

    return {
      course: course
        ? { id: Number(course.id), name: course.name, level: course.level, classroom: course.classroom, status: course.status }
        : null,
      totalStudents: items.length,
      uniqueStudentsCount: new Set(items.map((i) => i.studentId)).size,
      activeStudentsCount: items.filter((i) => i.enrollmentStatus === 'ACTIVE').length,
      students: items,
      generatedAt: new Date().toISOString(),
    };
  },

  getAttendanceReport(filter?: {
    courseId?: number | string;
    subjectId?: number | string;
    studentId?: number | string;
    from?: string;
    to?: string;
  }): AttendanceReportDTO {
    this.init();
    const records = this.getAttendanceHistory(filter);
    const students = this.getStudents();
    const courses = this.getCourses();
    const subjects = this.getAllSubjects();

    const course = filter?.courseId ? courses.find((c) => String(c.id) === String(filter.courseId)) : null;
    const subject = filter?.subjectId ? subjects.find((s) => String(s.id) === String(filter.subjectId)) : null;

    const presentCount = records.filter((r) => r.status === 'present').length;
    const absentCount = records.filter((r) => r.status === 'absent').length;
    const lateCount = records.filter((r) => r.status === 'late').length;
    const excusedCount = records.filter((r) => r.status === 'excused').length;
    const totalRecords = records.length;
    const attendanceRate = totalRecords > 0 ? Number(((presentCount / totalRecords) * 100).toFixed(1)) : null;

    // Student summaries
    const studentSummariesMap: Record<string, any> = {};
    for (const r of records) {
      if (!studentSummariesMap[r.studentId]) {
        const st = students.find((s) => String(s.id) === String(r.studentId));
        studentSummariesMap[r.studentId] = {
          studentId: Number(r.studentId),
          firstName: st?.firstName || '',
          lastName: st?.lastName || '',
          fullName: r.studentName,
          identification: st?.identification || '',
          totalRecords: 0,
          presentCount: 0,
          absentCount: 0,
          lateCount: 0,
          excusedCount: 0,
          attendanceRate: null,
        };
      }
      const sum = studentSummariesMap[r.studentId];
      sum.totalRecords += 1;
      if (r.status === 'present') sum.presentCount += 1;
      else if (r.status === 'absent') sum.absentCount += 1;
      else if (r.status === 'late') sum.lateCount += 1;
      else if (r.status === 'excused') sum.excusedCount += 1;
      sum.attendanceRate = sum.totalRecords > 0 ? Number(((sum.presentCount / sum.totalRecords) * 100).toFixed(1)) : null;
    }

    const studentSummaries = Object.values(studentSummariesMap);

    const recordDTOs = records.map((r, idx) => {
      const st = students.find((s) => String(s.id) === String(r.studentId));
      const c = courses.find((crs) => String(crs.id) === String(r.courseId));
      const s = subjects.find((sub) => String(sub.id) === String(r.subjectId));
      return {
        id: idx + 1,
        sessionId: Number(r.sessionId || 1),
        studentId: Number(r.studentId),
        studentName: r.studentName,
        identification: st?.identification || '',
        sessionDate: r.date,
        courseName: c?.name || 'Curso',
        subjectName: s?.name || 'Materia',
        status: r.status,
        observation: r.observation || null,
      };
    });

    return {
      course: course ? { id: Number(course.id), name: course.name, level: course.level } : null,
      subject: subject ? { id: Number(subject.id), name: subject.name, code: subject.code } : null,
      dateRange: { from: filter?.from || null, to: filter?.to || null },
      summary: {
        totalSessions: new Set(records.map((r) => r.sessionId)).size,
        totalRecords,
        presentCount,
        absentCount,
        lateCount,
        excusedCount,
        attendanceRate,
      },
      studentSummaries,
      records: recordDTOs,
      generatedAt: new Date().toISOString(),
    };
  },

  getGradeReport(filter?: { courseId?: number | string; subjectId?: number | string }): GradeReportDTO {
    this.init();
    const courses = this.getCourses();
    const subjects = this.getAllSubjects();
    const activities = this.getActivities(filter);
    const enrollments = this.getEnrollments(filter);
    const grades = this.getGradesHistory(filter);
    const students = this.getStudents();

    const course = filter?.courseId ? courses.find((c) => String(c.id) === String(filter.courseId)) : null;
    const subject = filter?.subjectId ? subjects.find((s) => String(s.id) === String(filter.subjectId)) : null;

    const activityItems = activities.map((a) => ({
      id: Number(a.id),
      name: a.name,
      type: a.type,
      maxScore: a.maxScore,
      dueDate: a.date,
    }));

    const periods = this.getAcademicPeriods();
    const periodIds = Array.from(new Set(activities.map((a) => a.academicPeriodId).filter(Boolean)));
    const relevantPeriods = periods.filter((p) => periodIds.includes(String(p.id)));

    const studentItems = enrollments.map((e) => {
      const st = students.find((s) => String(s.id) === String(e.studentId));
      const studentGrades = activities.map((act) => {
        const g = grades.find(
          (gr) => String(gr.evaluationId) === String(act.id) && String(gr.studentId) === String(e.studentId)
        );
        return {
          activityId: Number(act.id),
          activityName: act.name,
          activityType: act.type,
          maxScore: act.maxScore,
          score: g ? g.score : null,
          isGraded: Boolean(g),
          comments: g?.comments || null,
          gradedAt: g?.date || null,
        };
      });

      const gradedList = studentGrades.filter((g) => g.isGraded && g.score !== null);
      const simpleAverage = gradedList.length > 0
        ? Number((gradedList.reduce((sum, g) => sum + (g.score || 0), 0) / gradedList.length).toFixed(1))
        : null;
      const normalizedPerformance = simpleAverage !== null ? Number(((simpleAverage / 10) * 100).toFixed(1)) : null;

      let studentFinality: 'FINAL' | 'PROVISIONAL' | 'UNDETERMINED' = 'PROVISIONAL';
      if (relevantPeriods.length === 0 || activities.length === 0) {
        studentFinality = 'UNDETERMINED';
      } else if (relevantPeriods.some((p) => p.status !== 'CLOSED')) {
        studentFinality = 'PROVISIONAL';
      } else {
        const isFullyGraded = gradedList.length === activities.length && activities.length > 0;
        studentFinality = isFullyGraded ? 'FINAL' : 'UNDETERMINED';
      }

      return {
        studentId: Number(e.studentId),
        firstName: st?.firstName || '',
        lastName: st?.lastName || '',
        fullName: st ? `${st.firstName} ${st.lastName}` : 'Estudiante',
        identification: st?.identification || '',
        status: st?.status || 'active',
        gradedActivitiesCount: gradedList.length,
        simpleAverage,
        normalizedPerformance,
        finalityStatus: studentFinality,
        grades: studentGrades,
      };
    });

    const allScores = studentItems.flatMap((s) => s.grades).filter((g) => g.isGraded && g.score !== null);
    const overallAverage = allScores.length > 0
      ? Number((allScores.reduce((sum, g) => sum + (g.score || 0), 0) / allScores.length).toFixed(1))
      : null;
    const overallNormalizedPerformance = overallAverage !== null ? Number(((overallAverage / 10) * 100).toFixed(1)) : null;

    let summaryFinality: 'FINAL' | 'PROVISIONAL' | 'UNDETERMINED' = 'PROVISIONAL';
    if (relevantPeriods.length === 0 || activityItems.length === 0) {
      summaryFinality = 'UNDETERMINED';
    } else if (relevantPeriods.some((p) => p.status !== 'CLOSED')) {
      summaryFinality = 'PROVISIONAL';
    } else {
      const allFinal = studentItems.length > 0 && studentItems.every((s) => s.finalityStatus === 'FINAL');
      summaryFinality = allFinal ? 'FINAL' : 'UNDETERMINED';
    }

    return {
      course: course ? { id: Number(course.id), name: course.name, level: course.level } : null,
      subject: subject ? { id: Number(subject.id), name: subject.name, code: subject.code } : null,
      activities: activityItems,
      students: studentItems,
      summary: {
        totalActivities: activityItems.length,
        totalStudents: studentItems.length,
        totalGradesRecorded: allScores.length,
        overallAverage,
        overallNormalizedPerformance,
        isProvisional: summaryFinality !== 'FINAL',
        finalityStatus: summaryFinality,
      },
      generatedAt: new Date().toISOString(),
    };
  },

  getStudentReport(studentId: number | string): StudentReportDTO {
    this.init();
    const student = this.getStudentById(studentId);
    if (!student) throw new Error('Estudiante no encontrado.');

    const enrollments = this.getEnrollments({ studentId });
    const courses = this.getCourses();
    const subjects = this.getAllSubjects();
    const attendance = this.getAttendanceHistory({ studentId });
    const grades = this.getGradesHistory({ studentId });
    const activities = this.getActivities();
    const periods = this.getAcademicPeriods();

    const enrollmentDTOs = enrollments.map((e) => {
      const c = courses.find((crs) => String(crs.id) === String(e.courseId));
      return {
        id: Number(e.id),
        courseId: Number(e.courseId),
        courseName: c?.name || 'Curso',
        courseLevel: c?.level || 'Nivel',
        status: e.status?.toUpperCase() || 'ACTIVE',
        enrolledAt: e.enrollmentDate,
      };
    });

    const presentCount = attendance.filter((a) => a.status === 'present').length;
    const absentCount = attendance.filter((a) => a.status === 'absent').length;
    const lateCount = attendance.filter((a) => a.status === 'late').length;
    const excusedCount = attendance.filter((a) => a.status === 'excused').length;
    const totalAtt = attendance.length;
    const attendanceRate = totalAtt > 0 ? Number(((presentCount / totalAtt) * 100).toFixed(1)) : null;

    const attHistory = attendance.map((a, idx) => {
      const c = courses.find((crs) => String(crs.id) === String(a.courseId));
      const s = subjects.find((sub) => String(sub.id) === String(a.subjectId));
      return {
        id: idx + 1,
        sessionDate: a.date,
        courseName: c?.name || 'Curso',
        subjectName: s?.name || 'Materia',
        status: a.status,
        observation: a.observation || null,
      };
    });

    const simpleAverage = grades.length > 0
      ? Number((grades.reduce((sum, g) => sum + g.score, 0) / grades.length).toFixed(1))
      : null;
    const normalizedPerformance = simpleAverage !== null ? Number(((simpleAverage / 10) * 100).toFixed(1)) : null;

    const gradesHistory = grades.map((g, idx) => {
      const act = activities.find((a) => String(a.id) === String(g.evaluationId));
      const c = courses.find((crs) => String(crs.id) === String(g.courseId));
      const s = subjects.find((sub) => String(sub.id) === String(g.subjectId));
      const p = act?.academicPeriodId ? periods.find((per) => String(per.id) === String(act.academicPeriodId)) : null;

      let gradeFinality: 'FINAL' | 'PROVISIONAL' | 'UNDETERMINED' = 'PROVISIONAL';
      if (!p) {
        gradeFinality = 'UNDETERMINED';
      } else if (p.status !== 'CLOSED') {
        gradeFinality = 'PROVISIONAL';
      } else if (g.score !== null && g.score !== undefined) {
        gradeFinality = 'FINAL';
      } else {
        gradeFinality = 'UNDETERMINED';
      }

      return {
        id: idx + 1,
        activityId: Number(g.evaluationId || 1),
        activityName: g.evaluationName,
        activityType: g.evaluationType,
        subjectName: s?.name || g.subjectName,
        courseName: c?.name || 'Curso',
        score: g.score,
        maxScore: act?.maxScore || g.maxScore,
        gradedAt: g.date,
        comments: g.comments || null,
        status: g.status || 'GRADED',
        finalityStatus: gradeFinality,
      };
    });

    let studentGradesFinality: 'FINAL' | 'PROVISIONAL' | 'UNDETERMINED' = 'PROVISIONAL';
    if (gradesHistory.length === 0) {
      studentGradesFinality = 'UNDETERMINED';
    } else if (gradesHistory.some((g) => g.finalityStatus === 'PROVISIONAL')) {
      studentGradesFinality = 'PROVISIONAL';
    } else if (gradesHistory.every((g) => g.finalityStatus === 'FINAL')) {
      studentGradesFinality = 'FINAL';
    } else {
      studentGradesFinality = 'UNDETERMINED';
    }

    return {
      student: {
        id: Number(student.id),
        firstName: student.firstName,
        lastName: student.lastName,
        fullName: `${student.firstName} ${student.lastName}`,
        identification: student.identification,
        email: student.email || null,
        phone: student.phone || null,
        status: student.status?.toUpperCase() || 'ACTIVE',
        createdAt: new Date().toISOString(),
      },
      enrollments: enrollmentDTOs,
      attendance: {
        summary: {
          totalSessions: new Set(attendance.map((a) => a.sessionId)).size,
          totalRecords: totalAtt,
          presentCount,
          absentCount,
          lateCount,
          excusedCount,
          attendanceRate,
        },
        history: attHistory,
      },
      grades: {
        summary: {
          totalGradesCount: grades.length,
          simpleAverage,
          normalizedPerformance,
          finalityStatus: studentGradesFinality,
        },
        history: gradesHistory,
      },
      generatedAt: new Date().toISOString(),
    };
  },
};
