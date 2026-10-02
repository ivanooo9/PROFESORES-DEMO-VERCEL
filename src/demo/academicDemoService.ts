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
import { demoStorage } from './demoStorage';

export const academicDemoService = {
  // COURSES
  async getCourses(
    _orgId: number,
    filter?: { status?: string; search?: string }
  ): Promise<Course[]> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return demoStorage.getCourses(filter);
  },

  async getCourseById(_orgId: number, courseId: number | string): Promise<Course> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    const course = demoStorage.getCourseById(courseId);
    if (!course) throw new Error('Curso no encontrado.');
    return course;
  },

  async createCourse(
    _orgId: number,
    data: { name: string; level: string; classroom?: string; tutorUserId?: number | null }
  ): Promise<Course> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return demoStorage.createCourse(data);
  },

  async updateCourse(
    _orgId: number,
    courseId: number | string,
    data: { name?: string; level?: string; classroom?: string; tutorUserId?: number | null }
  ): Promise<Course> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return demoStorage.updateCourse(courseId, data);
  },

  async archiveCourse(_orgId: number, courseId: number | string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    demoStorage.archiveCourse(courseId);
  },

  // SUBJECTS
  async getSubjectsByCourse(
    _orgId: number,
    courseId: number | string
  ): Promise<Subject[]> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return demoStorage.getSubjectsByCourse(courseId);
  },

  async createSubject(
    _orgId: number,
    courseId: number | string,
    data: { name: string; code?: string; hoursPerWeek?: number | null; teacherUserId?: number | null }
  ): Promise<Subject> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return demoStorage.createSubject(courseId, data);
  },

  async updateSubject(
    _orgId: number,
    subjectId: number | string,
    data: { name?: string; code?: string; hoursPerWeek?: number | null; teacherUserId?: number | null }
  ): Promise<Subject> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return demoStorage.updateSubject(subjectId, data);
  },

  async inactivateSubject(_orgId: number, _subjectId: number | string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 50));
  },

  // STUDENTS
  async getStudents(
    _orgId: number,
    filter?: { status?: string; courseId?: number | string; search?: string }
  ): Promise<Student[]> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return demoStorage.getStudents(filter);
  },

  async getStudentById(_orgId: number, studentId: number | string): Promise<Student> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    const s = demoStorage.getStudentById(studentId);
    if (!s) throw new Error('Estudiante no encontrado.');
    return s;
  },

  async createStudent(
    _orgId: number,
    data: {
      firstName: string;
      lastName: string;
      identification?: string | null;
      email?: string | null;
      phone?: string | null;
    }
  ): Promise<Student> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return demoStorage.createStudent(data);
  },

  async updateStudent(
    _orgId: number,
    studentId: number | string,
    data: {
      firstName?: string;
      lastName?: string;
      identification?: string | null;
      email?: string | null;
      phone?: string | null;
    }
  ): Promise<Student> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return demoStorage.updateStudent(studentId, data);
  },

  async inactivateStudent(_orgId: number, studentId: number | string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    demoStorage.inactivateStudent(studentId);
  },

  // ENROLLMENTS
  async getEnrollments(
    _orgId: number,
    filter?: { courseId?: number | string; studentId?: number | string; status?: string }
  ): Promise<Enrollment[]> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return demoStorage.getEnrollments(filter);
  },

  async enrollStudent(
    _orgId: number,
    studentId: number | string,
    courseId: number | string,
    _period?: string | null
  ): Promise<Enrollment> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return demoStorage.enrollStudent(studentId, courseId);
  },

  async updateEnrollmentStatus(
    _orgId: number,
    enrollmentId: number | string,
    status: string
  ): Promise<Enrollment> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return demoStorage.updateEnrollmentStatus(enrollmentId, status);
  },

  // SESSIONS
  async getSessions(
    _orgId: number,
    filter?: { courseId?: number | string; subjectId?: number | string; status?: string; date?: string; search?: string }
  ): Promise<ClassSession[]> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return demoStorage.getSessions(filter);
  },

  async getSessionById(
    _orgId: number,
    sessionId: number | string
  ): Promise<ClassSession & { attendanceRecords: AttendanceRecord[] }> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    const s = demoStorage.getSessionById(sessionId);
    if (!s) throw new Error('Sesión de clase no encontrada.');
    return s;
  },

  async createSession(
    _orgId: number,
    courseId: number | string,
    data: {
      subjectId?: number | string | null;
      teacherUserId?: number | string | null;
      sessionDate: string;
      startTime?: string | null;
      endTime?: string | null;
      room?: string | null;
      topic?: string | null;
    }
  ): Promise<ClassSession> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return demoStorage.createSession(courseId, data);
  },

  async updateSession(
    _orgId: number,
    sessionId: number | string,
    data: {
      subjectId?: number | string | null;
      teacherUserId?: number | string | null;
      sessionDate?: string;
      startTime?: string | null;
      endTime?: string | null;
      room?: string | null;
      topic?: string | null;
      status?: string;
    }
  ): Promise<ClassSession> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return demoStorage.updateSession(sessionId, data);
  },

  async cancelSession(_orgId: number, sessionId: number | string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    demoStorage.cancelSession(sessionId);
  },

  // ATTENDANCE
  async saveAttendanceBatch(
    _orgId: number,
    sessionId: number | string,
    records: { studentId: number | string; status: AttendanceStatus; observation?: string | null }[]
  ): Promise<AttendanceRecord[]> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return demoStorage.saveAttendanceBatch(sessionId, records);
  },

  async getAttendanceBySession(
    _orgId: number,
    sessionId: number | string
  ): Promise<AttendanceRecord[]> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    const session = demoStorage.getSessionById(sessionId);
    return session?.attendanceRecords || [];
  },

  async getAttendanceHistory(
    _orgId: number,
    filter?: {
      courseId?: number | string;
      subjectId?: number | string;
      studentId?: number | string;
      date?: string;
      status?: string;
    }
  ): Promise<AttendanceRecord[]> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return demoStorage.getAttendanceHistory(filter);
  },

  async updateAttendanceRecord(
    _orgId: number,
    attendanceId: number | string,
    data: { status?: AttendanceStatus; observation?: string | null }
  ): Promise<AttendanceRecord> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return demoStorage.updateAttendanceRecord(attendanceId, data);
  },

  // ACTIVITIES
  async getActivities(
    _orgId: number,
    filter?: {
      courseId?: number | string;
      subjectId?: number | string;
      type?: string;
      search?: string;
    }
  ): Promise<Activity[]> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return demoStorage.getActivities(filter);
  },

  async getActivityById(
    _orgId: number,
    activityId: number | string
  ): Promise<Activity> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    const act = demoStorage.getActivityById(activityId);
    if (!act) throw new Error('Actividad no encontrada.');
    return act;
  },

  async createActivity(
    _orgId: number,
    courseId: number | string,
    data: {
      subjectId: number | string;
      name: string;
      description?: string | null;
      type?: string;
      dueDate?: string | null;
      maxScore: number;
      teacherUserId?: number | string | null;
    }
  ): Promise<Activity> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return demoStorage.createActivity(courseId, data);
  },

  async updateActivity(
    _orgId: number,
    activityId: number | string,
    data: {
      name?: string;
      description?: string | null;
      type?: string;
      dueDate?: string | null;
      maxScore?: number;
      teacherUserId?: number | string | null;
    }
  ): Promise<Activity> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return demoStorage.updateActivity(activityId, data);
  },

  // GRADES
  async saveGradesBatch(
    _orgId: number,
    activityId: number | string,
    grades: { studentId: number | string; score: number; comments?: string | null }[]
  ): Promise<GradeItem[]> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return demoStorage.saveGradesBatch(activityId, grades);
  },

  async getGradesByActivity(
    _orgId: number,
    activityId: number | string
  ): Promise<GradeItem[]> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return demoStorage.getGradesHistory({ activityId });
  },

  async getGradesHistory(
    _orgId: number,
    filter?: {
      courseId?: number | string;
      subjectId?: number | string;
      activityId?: number | string;
      studentId?: number | string;
    }
  ): Promise<GradeItem[]> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return demoStorage.getGradesHistory(filter);
  },

  async getStudentGrades(
    _orgId: number,
    studentId: number | string
  ): Promise<GradeItem[]> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return demoStorage.getGradesHistory({ studentId });
  },

  async updateGradeRecord(
    _orgId: number,
    gradeId: number | string,
    data: { score?: number; comments?: string | null }
  ): Promise<GradeItem> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return demoStorage.updateGradeRecord(gradeId, data);
  },

  // DASHBOARD
  async getDashboard(_orgId: number): Promise<AcademicDashboardDTO> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return demoStorage.getDashboard();
  },

  // REPORTS
  async getRosterReport(
    _orgId: number,
    filter?: { courseId?: number | string; status?: string }
  ): Promise<RosterReportDTO> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return demoStorage.getRosterReport(filter);
  },

  async getAttendanceReport(
    _orgId: number,
    filter?: {
      courseId?: number | string;
      subjectId?: number | string;
      studentId?: number | string;
      from?: string;
      to?: string;
    }
  ): Promise<AttendanceReportDTO> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return demoStorage.getAttendanceReport(filter);
  },

  async getGradeReport(
    _orgId: number,
    filter?: { courseId?: number | string; subjectId?: number | string }
  ): Promise<GradeReportDTO> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return demoStorage.getGradeReport(filter);
  },

  async getStudentReport(
    _orgId: number,
    studentId: number | string
  ): Promise<StudentReportDTO> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return demoStorage.getStudentReport(studentId);
  },
};
