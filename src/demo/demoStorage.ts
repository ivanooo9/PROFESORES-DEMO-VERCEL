import {
  Activity,
  AttendanceRecord,
  AttendanceStatus,
  ClassSession,
  Course,
  Enrollment,
  GradeItem,
  Student,
  Subject,
  AcademicDashboardDTO,
  RosterReportDTO,
  AttendanceReportDTO,
  GradeReportDTO,
  StudentReportDTO,
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
} from './mockData';
import { getLocalDateString } from '../utils/date';

const STORAGE_PREFIX = 'profesores_demo_';
const VERSION_KEY = `${STORAGE_PREFIX}version`;
const CURRENT_VERSION = '1.0';

const KEYS = {
  USER: `${STORAGE_PREFIX}user`,
  ORGS: `${STORAGE_PREFIX}organizations`,
  MODULES: `${STORAGE_PREFIX}modules`,
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
    return JSON.parse(raw) as T;
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

    if (version !== CURRENT_VERSION || !hasData) {
      this.resetDemoData();
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

  // COURSES
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

  archiveCourse(courseId: string | number): void {
    this.init();
    const list = getItem<Course[]>(KEYS.COURSES, DEMO_COURSES);
    const index = list.findIndex((c) => String(c.id) === String(courseId));
    if (index !== -1) {
      list[index].status = 'archived';
      setItem(KEYS.COURSES, list);
    }
  },

  // SUBJECTS
  getSubjectsByCourse(courseId: string | number): Subject[] {
    this.init();
    const list = getItem<Subject[]>(KEYS.SUBJECTS, DEMO_SUBJECTS);
    return list.filter((s) => String(s.courseId) === String(courseId));
  },

  getAllSubjects(): Subject[] {
    this.init();
    return getItem<Subject[]>(KEYS.SUBJECTS, DEMO_SUBJECTS);
  },

  createSubject(
    courseId: string | number,
    data: { name: string; code?: string; hoursPerWeek?: number | null }
  ): Subject {
    this.init();
    const list = getItem<Subject[]>(KEYS.SUBJECTS, DEMO_SUBJECTS);
    const course = this.getCourseById(courseId);
    const newSubject: Subject = {
      id: String(Date.now()),
      name: data.name,
      code: data.code || `MAT-${Math.floor(100 + Math.random() * 900)}`,
      courseId: String(courseId),
      courseName: course?.name || 'Curso',
      teacherName: 'Lic. Carlos Andrade M.',
      hoursPerWeek: Number(data.hoursPerWeek) || 4,
    };
    list.push(newSubject);
    setItem(KEYS.SUBJECTS, list);

    // Update subjects count in course
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
    data: { name?: string; code?: string; hoursPerWeek?: number | null }
  ): Subject {
    this.init();
    const list = getItem<Subject[]>(KEYS.SUBJECTS, DEMO_SUBJECTS);
    const index = list.findIndex((s) => String(s.id) === String(subjectId));
    if (index === -1) throw new Error('Materia no encontrada.');

    const updated = {
      ...list[index],
      name: data.name ?? list[index].name,
      code: data.code ?? list[index].code,
      hoursPerWeek: data.hoursPerWeek !== undefined ? Number(data.hoursPerWeek) : list[index].hoursPerWeek,
    };
    list[index] = updated;
    setItem(KEYS.SUBJECTS, list);
    return updated;
  },

  // STUDENTS
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

  // ENROLLMENTS
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

  enrollStudent(studentId: number | string, courseId: number | string): Enrollment {
    this.init();
    const enrollments = getItem<Enrollment[]>(KEYS.ENROLLMENTS, DEMO_ENROLLMENTS);
    const students = getItem<Student[]>(KEYS.STUDENTS, DEMO_STUDENTS);
    const courses = getItem<Course[]>(KEYS.COURSES, DEMO_COURSES);

    const course = courses.find((c) => String(c.id) === String(courseId));
    const sIndex = students.findIndex((s) => String(s.id) === String(studentId));

    if (sIndex !== -1 && course) {
      students[sIndex].courseId = String(courseId);
      students[sIndex].courseName = course.name;
      setItem(KEYS.STUDENTS, students);
    }

    const newEnrollment: Enrollment = {
      id: String(Date.now()),
      studentId: String(studentId),
      courseId: String(courseId),
      status: 'active',
      enrollmentDate: getLocalDateString(),
    };

    enrollments.unshift(newEnrollment);
    setItem(KEYS.ENROLLMENTS, enrollments);

    // Update course studentCount
    if (course) {
      const activeCourseEnrollments = enrollments.filter(
        (e) => String(e.courseId) === String(courseId) && e.status === 'active'
      );
      course.studentCount = activeCourseEnrollments.length;
      setItem(KEYS.COURSES, courses);
    }

    return newEnrollment;
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

  // SESSIONS
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

  // ATTENDANCE
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

  // ACTIVITIES
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
    }
  ): Activity {
    this.init();
    const list = getItem<Activity[]>(KEYS.ACTIVITIES, DEMO_ACTIVITIES);
    const newActivity: Activity = {
      id: String(Date.now()),
      courseId: String(courseId),
      subjectId: String(data.subjectId),
      name: data.name,
      type: (data.type as any) || 'homework',
      date: data.dueDate || getLocalDateString(),
      maxScore: Number(data.maxScore) || 10,
    };
    list.unshift(newActivity);
    setItem(KEYS.ACTIVITIES, list);
    return newActivity;
  },

  updateActivity(
    activityId: number | string,
    data: {
      name?: string;
      type?: string;
      dueDate?: string | null;
      maxScore?: number;
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
    };
    list[index] = updated;
    setItem(KEYS.ACTIVITIES, list);
    return updated;
  },

  // GRADES
  saveGradesBatch(
    activityId: number | string,
    grades: { studentId: number | string; score: number; comments?: string | null }[]
  ): GradeItem[] {
    this.init();
    const gradesList = getItem<GradeItem[]>(KEYS.GRADES, DEMO_GRADES);
    const activity = this.getActivityById(activityId);
    const students = this.getStudents();
    const subjects = this.getAllSubjects();
    const subject = subjects.find((s) => String(s.id) === String(activity?.subjectId));

    const updatedOrNew: GradeItem[] = [];

    for (const g of grades) {
      const student = students.find((s) => String(s.id) === String(g.studentId));
      const studentName = student ? `${student.firstName} ${student.lastName}` : 'Estudiante';

      const existingIdx = gradesList.findIndex(
        (item) => String(item.evaluationId) === String(activityId) && String(item.studentId) === String(g.studentId)
      );

      if (existingIdx !== -1) {
        gradesList[existingIdx].score = Number(g.score);
        gradesList[existingIdx].comments = g.comments || undefined;
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
          score: Number(g.score),
          maxScore: activity?.maxScore || 10,
          date: activity?.date || getLocalDateString(),
          comments: g.comments || undefined,
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

  // DASHBOARD DTO DYNAMIC CALCULATION
  getDashboard(): AcademicDashboardDTO {
    this.init();
    const user = this.getUser();
    const courses = this.getCourses();
    const students = this.getStudents();
    const sessions = this.getSessions();
    const activities = this.getActivities();
    const grades = this.getGradesHistory();
    const attendance = this.getAttendanceHistory();

    const todayStr = getLocalDateString();
    const todaySessions = sessions.filter((s) => s.date === todayStr);

    const presentCount = attendance.filter((a) => a.status === 'present').length;
    const absentCount = attendance.filter((a) => a.status === 'absent').length;
    const lateCount = attendance.filter((a) => a.status === 'late').length;
    const excusedCount = attendance.filter((a) => a.status === 'excused').length;
    const totalAttendance = attendance.length;
    const attendanceRate = totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 96.5;

    const totalGrades = grades.length;
    const averageScore = totalGrades > 0
      ? grades.reduce((acc, curr) => acc + curr.score, 0) / totalGrades
      : 8.9;

    const normalizedPerformance = totalGrades > 0
      ? grades.reduce((acc, curr) => acc + (curr.score / (curr.maxScore || 10)) * 100, 0) / totalGrades
      : 89.0;

    // Build realistic alerts based on data
    const alerts: AcademicDashboardDTO['academicAlerts'] = [];
    const lowGrades = grades.filter((g) => g.score < 7.5);
    for (const lg of lowGrades.slice(0, 3)) {
      alerts.push({
        id: `alert-grade-${lg.id}`,
        studentId: lg.studentId,
        studentName: lg.studentName,
        courseId: lg.courseId,
        type: 'low_grade',
        severity: 'medium',
        description: `Rendimiento bajo en ${lg.subjectName} (${lg.score}/${lg.maxScore})`,
        date: lg.date,
      });
    }

    const absentRecords = attendance.filter((a) => a.status === 'absent');
    for (const ab of absentRecords.slice(0, 2)) {
      alerts.push({
        id: `alert-att-${ab.id}`,
        studentId: ab.studentId,
        studentName: ab.studentName,
        courseId: ab.courseId,
        type: 'low_attendance',
        severity: 'high',
        description: `Inasistencia registrada el ${ab.date}${ab.observation ? `: ${ab.observation}` : ''}`,
        date: ab.date,
      });
    }

    return {
      teacherName: user.name,
      activeCoursesCount: courses.filter((c) => c.status === 'active').length,
      totalCoursesCount: courses.length,
      activeStudentsCount: students.filter((s) => s.status === 'active').length,
      totalStudentsCount: students.length,
      todaySessionsCount: todaySessions.length,
      todaySessions: todaySessions.length > 0 ? todaySessions : sessions.slice(0, 3),
      upcomingActivities: activities.slice(0, 4),
      recentGrades: grades.slice(0, 4),
      attendanceSummary: {
        totalRecords: totalAttendance,
        presentCount,
        absentCount,
        lateCount,
        excusedCount,
        attendanceRate,
      },
      performanceSummary: {
        totalGradesCount: totalGrades,
        averageScore,
        normalizedPerformance,
      },
      academicAlerts: alerts,
    };
  },

  // REPORTS
  getRosterReport(filter?: { courseId?: number | string; status?: string }): RosterReportDTO {
    this.init();
    const courses = this.getCourses();
    const students = this.getStudents();
    const enrollments = this.getEnrollments();

    const targetCourse = filter?.courseId
      ? courses.find((c) => String(c.id) === String(filter.courseId))
      : courses[0];

    const courseStudents = students.filter((s) =>
      targetCourse ? String(s.courseId) === String(targetCourse.id) : true
    );

    const items = courseStudents.map((s, idx) => {
      const enrollment = enrollments.find((e) => String(e.studentId) === String(s.id));
      return {
        id: Number(s.id) || idx + 1,
        studentId: Number(s.id) || idx + 1,
        firstName: s.firstName,
        lastName: s.lastName,
        fullName: `${s.firstName} ${s.lastName}`,
        identification: s.identification,
        email: s.email,
        phone: s.phone,
        status: s.status,
        enrollmentStatus: enrollment?.status || 'active',
        enrolledAt: enrollment?.enrollmentDate || '2026-09-01',
        courseId: targetCourse ? Number(targetCourse.id) : 1,
        courseName: targetCourse?.name || s.courseName,
        courseLevel: targetCourse?.level || 'Educación General Básica',
      };
    });

    return {
      course: targetCourse
        ? {
            id: Number(targetCourse.id),
            name: targetCourse.name,
            level: targetCourse.level,
            classroom: targetCourse.classroom,
            status: targetCourse.status,
          }
        : null,
      totalStudents: items.length,
      uniqueStudentsCount: items.length,
      activeStudentsCount: items.filter((i) => i.status === 'active').length,
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
    const courses = this.getCourses();
    const subjects = this.getAllSubjects();
    const students = this.getStudents();
    const attendance = this.getAttendanceHistory();

    const targetCourse = filter?.courseId ? courses.find((c) => String(c.id) === String(filter.courseId)) : courses[0];
    const targetSubject = filter?.subjectId ? subjects.find((s) => String(s.id) === String(filter.subjectId)) : null;

    let filteredRecords = attendance;
    if (targetCourse) {
      filteredRecords = filteredRecords.filter((a) => String(a.courseId) === String(targetCourse.id));
    }
    if (targetSubject) {
      filteredRecords = filteredRecords.filter((a) => String(a.subjectId) === String(targetSubject.id));
    }

    const presentCount = filteredRecords.filter((r) => r.status === 'present').length;
    const absentCount = filteredRecords.filter((r) => r.status === 'absent').length;
    const lateCount = filteredRecords.filter((r) => r.status === 'late').length;
    const excusedCount = filteredRecords.filter((r) => r.status === 'excused').length;
    const totalRecords = filteredRecords.length;

    const studentSummaries = students
      .filter((s) => (targetCourse ? String(s.courseId) === String(targetCourse.id) : true))
      .map((s) => {
        const studentRecords = filteredRecords.filter((r) => String(r.studentId) === String(s.id));
        const sPresent = studentRecords.filter((r) => r.status === 'present').length;
        const sAbsent = studentRecords.filter((r) => r.status === 'absent').length;
        const sLate = studentRecords.filter((r) => r.status === 'late').length;
        const sExcused = studentRecords.filter((r) => r.status === 'excused').length;
        const sTotal = studentRecords.length;

        return {
          studentId: Number(s.id) || 1,
          firstName: s.firstName,
          lastName: s.lastName,
          fullName: `${s.firstName} ${s.lastName}`,
          identification: s.identification,
          totalRecords: sTotal,
          presentCount: sPresent,
          absentCount: sAbsent,
          lateCount: sLate,
          excusedCount: sExcused,
          attendanceRate: sTotal > 0 ? (sPresent / sTotal) * 100 : 100,
        };
      });

    const recordDTOs = filteredRecords.map((r, idx) => ({
      id: Number(r.id) || idx + 1,
      sessionId: Number(r.sessionId) || 1,
      studentId: Number(r.studentId) || 1,
      studentName: r.studentName,
      identification: students.find((s) => String(s.id) === String(r.studentId))?.identification || '1723498101',
      sessionDate: r.date,
      courseName: targetCourse?.name || 'Curso',
      subjectName: subjects.find((s) => String(s.id) === String(r.subjectId))?.name || 'Matemáticas',
      status: r.status,
      observation: r.observation || null,
    }));

    return {
      course: targetCourse ? { id: Number(targetCourse.id), name: targetCourse.name, level: targetCourse.level } : null,
      subject: targetSubject ? { id: Number(targetSubject.id), name: targetSubject.name, code: targetSubject.code } : null,
      dateRange: { from: filter?.from || null, to: filter?.to || null },
      summary: {
        totalSessions: 4,
        totalRecords,
        presentCount,
        absentCount,
        lateCount,
        excusedCount,
        attendanceRate: totalRecords > 0 ? (presentCount / totalRecords) * 100 : 95.0,
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
    const students = this.getStudents();
    const activities = this.getActivities();
    const grades = this.getGradesHistory();

    const targetCourse = filter?.courseId ? courses.find((c) => String(c.id) === String(filter.courseId)) : courses[0];
    const targetSubject = filter?.subjectId ? subjects.find((s) => String(s.id) === String(filter.subjectId)) : subjects[0];

    const courseActivities = activities.filter((a) =>
      (targetCourse ? String(a.courseId) === String(targetCourse.id) : true) &&
      (targetSubject ? String(a.subjectId) === String(targetSubject.id) : true)
    );

    const courseStudents = students.filter((s) =>
      targetCourse ? String(s.courseId) === String(targetCourse.id) : true
    );

    const studentItems = courseStudents.map((s) => {
      const studentGrades = courseActivities.map((act) => {
        const gradeItem = grades.find(
          (g) => String(g.evaluationId) === String(act.id) && String(g.studentId) === String(s.id)
        );
        return {
          activityId: Number(act.id),
          activityName: act.name,
          activityType: act.type,
          maxScore: act.maxScore,
          score: gradeItem ? gradeItem.score : null,
          isGraded: !!gradeItem,
          comments: gradeItem?.comments || null,
          gradedAt: gradeItem?.date || null,
        };
      });

      const graded = studentGrades.filter((g) => g.score !== null);
      const simpleAverage = graded.length > 0
        ? graded.reduce((acc, curr) => acc + (curr.score || 0), 0) / graded.length
        : null;

      return {
        studentId: Number(s.id),
        firstName: s.firstName,
        lastName: s.lastName,
        fullName: `${s.firstName} ${s.lastName}`,
        identification: s.identification,
        status: s.status,
        gradedActivitiesCount: graded.length,
        simpleAverage,
        normalizedPerformance: simpleAverage !== null ? simpleAverage * 10 : null,
        grades: studentGrades,
      };
    });

    const totalGradesRecorded = grades.filter((g) =>
      (targetCourse ? String(g.courseId) === String(targetCourse.id) : true) &&
      (targetSubject ? String(g.subjectId) === String(targetSubject.id) : true)
    ).length;

    return {
      course: targetCourse ? { id: Number(targetCourse.id), name: targetCourse.name, level: targetCourse.level } : null,
      subject: targetSubject ? { id: Number(targetSubject.id), name: targetSubject.name, code: targetSubject.code } : null,
      activities: courseActivities.map((a) => ({
        id: Number(a.id),
        name: a.name,
        type: a.type,
        maxScore: a.maxScore,
        dueDate: a.date,
        subjectName: targetSubject?.name || 'Materia',
      })),
      students: studentItems,
      summary: {
        totalActivities: courseActivities.length,
        totalStudents: courseStudents.length,
        totalGradesRecorded,
        overallAverage: 9.1,
        overallNormalizedPerformance: 91.0,
      },
      generatedAt: new Date().toISOString(),
    };
  },

  getStudentReport(studentId: number | string): StudentReportDTO {
    this.init();
    const students = this.getStudents();
    const courses = this.getCourses();
    const subjects = this.getAllSubjects();
    const activities = this.getActivities();
    const grades = this.getGradesHistory({ studentId });
    const attendance = this.getAttendanceHistory({ studentId });

    const student = students.find((s) => String(s.id) === String(studentId)) || students[0];
    const course = courses.find((c) => String(c.id) === String(student.courseId));

    const presentCount = attendance.filter((a) => a.status === 'present').length;
    const absentCount = attendance.filter((a) => a.status === 'absent').length;
    const lateCount = attendance.filter((a) => a.status === 'late').length;
    const excusedCount = attendance.filter((a) => a.status === 'excused').length;
    const totalAtt = attendance.length;

    const totalGrades = grades.length;
    const averageScore = totalGrades > 0
      ? grades.reduce((acc, curr) => acc + curr.score, 0) / totalGrades
      : null;

    return {
      student: {
        id: Number(student.id),
        firstName: student.firstName,
        lastName: student.lastName,
        fullName: `${student.firstName} ${student.lastName}`,
        identification: student.identification,
        email: student.email,
        phone: student.phone,
        status: student.status,
        createdAt: '2026-09-01T08:00:00.000Z',
      },
      enrollments: [
        {
          id: 1,
          courseId: course ? Number(course.id) : 1,
          courseName: course?.name || student.courseName,
          courseLevel: course?.level || 'Educación General Básica',
          status: 'active',
          enrolledAt: '2026-09-01',
        },
      ],
      attendance: {
        summary: {
          totalSessions: totalAtt || 1,
          totalRecords: totalAtt,
          presentCount,
          absentCount,
          lateCount,
          excusedCount,
          attendanceRate: totalAtt > 0 ? (presentCount / totalAtt) * 100 : 100,
        },
        history: attendance.map((a, idx) => ({
          id: Number(a.id) || idx + 1,
          sessionDate: a.date,
          courseName: course?.name || 'Curso',
          subjectName: subjects.find((s) => String(s.id) === String(a.subjectId))?.name || 'Materia',
          status: a.status,
          observation: a.observation || null,
        })),
      },
      grades: {
        summary: {
          totalGradesCount: totalGrades,
          simpleAverage: averageScore,
          normalizedPerformance: averageScore !== null ? averageScore * 10 : null,
        },
        history: grades.map((g, idx) => {
          const act = activities.find((a) => String(a.id) === String(g.evaluationId));
          return {
            id: Number(g.id) || idx + 1,
            activityId: act ? Number(act.id) : 1,
            activityName: g.evaluationName,
            activityType: g.evaluationType,
            subjectName: g.subjectName,
            courseName: course?.name || 'Curso',
            score: g.score,
            maxScore: g.maxScore,
            gradedAt: g.date,
            comments: g.comments || null,
          };
        }),
      },
      generatedAt: new Date().toISOString(),
    };
  },
};
