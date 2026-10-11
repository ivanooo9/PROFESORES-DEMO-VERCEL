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
  PeriodClosureReadinessDTO,
  PeriodGradesMatrixDTO,
  CourseDependenciesDTO,
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

  async reactivateCourse(_orgId: number, courseId: number | string): Promise<Course> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return demoStorage.reactivateCourse(courseId);
  },

  async getCourseDependencies(_orgId: number, courseId: number | string): Promise<CourseDependenciesDTO> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return demoStorage.getCourseDependencies(courseId);
  },

  async deleteCourse(_orgId: number, courseId: number | string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    demoStorage.deleteCourse(courseId);
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
  ): Promise<Subject> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return demoStorage.createSubject(courseId, data);
  },

  async updateSubject(
    _orgId: number,
    subjectId: number | string,
    data: {
      name?: string;
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
  ): Promise<Subject> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return demoStorage.updateSubject(subjectId, data);
  },

  async inactivateSubject(_orgId: number, subjectId: number | string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    demoStorage.inactivateSubject(subjectId);
  },

  // SCHEDULES
  async getSubjectSchedule(
    _orgId: number,
    subjectId: number | string,
    _options?: { effectiveDate?: string; includeHistory?: boolean }
  ): Promise<any> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return demoStorage.getSubjectSchedule(subjectId);
  },

  async saveSubjectSchedule(
    _orgId: number,
    subjectId: number | string,
    data: {
      slots: Array<{
        dayOfWeek: number;
        startTime: string;
        endTime: string;
        pedagogicalHours?: number;
        room?: string | null;
      }>;
    }
  ): Promise<any> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return demoStorage.saveSubjectSchedule(subjectId, data);
  },

  async getCourseSchedule(
    _orgId: number,
    courseId: number | string,
    _options?: { academicYearId?: number | string; effectiveDate?: string }
  ): Promise<any> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return demoStorage.getCourseSchedule(courseId);
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
    studentId: (number | string)[] | number | string,
    courseId: number | string,
    period?: string | null,
    academicYearId?: number | string | null
  ): Promise<EnrollmentResult | Enrollment> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    if (Array.isArray(studentId)) {
      return demoStorage.enrollStudentsBatch(studentId, courseId, academicYearId);
    }
    return demoStorage.enrollStudent(studentId, courseId, period, academicYearId);
  },

  async reassignActivityCategory(
    _orgId: number,
    activityId: number | string,
    categoryId: number | string
  ): Promise<Activity> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return demoStorage.reassignActivityCategory(activityId, categoryId);
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
    const session = demoStorage.getSessionById(sessionId);
    if (!session) throw new Error('Sesión no encontrada.');
    return session;
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

  async rectifyAttendanceBatch(
    _orgId: number,
    sessionId: number | string,
    records: { studentId: number | string; status: AttendanceStatus; observation?: string | null }[],
    _reason: string
  ): Promise<any> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return demoStorage.saveAttendanceBatch(sessionId, records);
  },

  async getAttendanceBySession(
    _orgId: number,
    sessionId: number | string
  ): Promise<AttendanceRecord[]> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    const history = demoStorage.getAttendanceHistory();
    return history.filter((a) => String(a.sessionId) === String(sessionId));
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
      academicPeriodId?: number | string | null;
      evaluationSchemeId?: number | string | null;
      categoryId?: number | string | null;
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
      academicPeriodId?: number | string | null;
      evaluationSchemeId?: number | string | null;
      categoryId?: number | string | null;
    }
  ): Promise<Activity> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return demoStorage.updateActivity(activityId, data);
  },

  // GRADES
  async saveGradesBatch(
    _orgId: number,
    activityId: number | string,
    grades: {
      studentId?: number | string;
      enrollmentId?: number | string;
      score?: number | null;
      status?: string;
      comments?: string | null;
    }[],
    _reason?: string | null
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
    return demoStorage.getStudentGrades(studentId);
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

  // ACADEMIC YEARS
  async getAcademicYears(
    _orgId: number,
    filter?: { status?: string; search?: string }
  ): Promise<AcademicYear[]> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return demoStorage.getAcademicYears(filter);
  },

  async getAcademicYearById(_orgId: number, yearId: number | string): Promise<AcademicYear> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return demoStorage.getAcademicYearById(yearId);
  },

  async createAcademicYear(
    _orgId: number,
    data: { name: string; startDate: string; endDate: string; status?: AcademicYearStatus }
  ): Promise<AcademicYear> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return demoStorage.createAcademicYear(data);
  },

  async updateAcademicYear(
    _orgId: number,
    yearId: number | string,
    data: { name?: string; startDate?: string; endDate?: string; status?: AcademicYearStatus }
  ): Promise<AcademicYear> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return demoStorage.updateAcademicYear(yearId, data);
  },

  async changeAcademicYearStatus(
    _orgId: number,
    yearId: number | string,
    status: AcademicYearStatus
  ): Promise<AcademicYear> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return demoStorage.changeAcademicYearStatus(yearId, status);
  },

  // ACADEMIC PERIODS
  async getAcademicPeriods(
    _orgId: number,
    filter?: { academicYearId?: number | string; status?: string; parentId?: number | string }
  ): Promise<AcademicPeriod[]> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return demoStorage.getAcademicPeriods(filter);
  },

  async getAcademicPeriodById(_orgId: number, periodId: number | string): Promise<AcademicPeriod> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return demoStorage.getAcademicPeriodById(periodId);
  },

  async createAcademicPeriod(
    _orgId: number,
    data: {
      academicYearId: number | string;
      parentId?: number | string | null;
      name: string;
      type: AcademicPeriodType;
      order?: number;
      startDate: string;
      endDate: string;
      status?: AcademicPeriodStatus;
    }
  ): Promise<AcademicPeriod> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return demoStorage.createAcademicPeriod(data);
  },

  async updateAcademicPeriod(
    _orgId: number,
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
  ): Promise<AcademicPeriod> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return demoStorage.updateAcademicPeriod(periodId, data);
  },

  async changeAcademicPeriodStatus(
    _orgId: number,
    periodId: number | string,
    status: AcademicPeriodStatus
  ): Promise<AcademicPeriod> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return demoStorage.changeAcademicPeriodStatus(periodId, status);
  },

  async getPeriodClosureReadiness(
    _orgId: number,
    periodId: number | string
  ): Promise<PeriodClosureReadinessDTO> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return demoStorage.getPeriodClosureReadiness(periodId);
  },

  // EVALUATION SCHEMES
  async getEvaluationSchemes(
    _orgId: number,
    filter?: { courseId?: number | string; subjectId?: number | string; academicPeriodId?: number | string }
  ): Promise<AcademicEvaluationScheme[]> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return demoStorage.getEvaluationSchemes(filter);
  },

  async getEvaluationSchemeById(_orgId: number, schemeId: number | string): Promise<AcademicEvaluationScheme> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return demoStorage.getEvaluationSchemeById(schemeId);
  },

  async createEvaluationScheme(
    _orgId: number,
    data: {
      courseId: number | string;
      subjectId: number | string;
      academicPeriodId: number | string;
      maxScale?: number;
      minPassingScore?: number;
    }
  ): Promise<AcademicEvaluationScheme> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return demoStorage.createEvaluationScheme(data);
  },

  async updateEvaluationScheme(
    _orgId: number,
    schemeId: number | string,
    data: { maxScale?: number; minPassingScore?: number }
  ): Promise<AcademicEvaluationScheme> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return demoStorage.updateEvaluationScheme(schemeId, data);
  },

  async validateEvaluationScheme(_orgId: number, schemeId: number | string): Promise<AcademicEvaluationScheme> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return demoStorage.validateEvaluationScheme(schemeId);
  },

  async lockEvaluationScheme(_orgId: number, schemeId: number | string): Promise<AcademicEvaluationScheme> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return demoStorage.lockEvaluationScheme(schemeId);
  },

  async closeEvaluationScheme(_orgId: number, schemeId: number | string): Promise<AcademicEvaluationScheme> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return demoStorage.closeEvaluationScheme(schemeId);
  },

  // EVALUATION CATEGORIES
  async createEvaluationCategory(
    _orgId: number,
    schemeId: number | string,
    data: { name: string; weightPercentage: number; order?: number }
  ): Promise<AcademicEvaluationCategory> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return demoStorage.createEvaluationCategory(schemeId, data);
  },

  async updateEvaluationCategory(
    _orgId: number,
    categoryId: number | string,
    data: { name?: string; weightPercentage?: number; order?: number }
  ): Promise<AcademicEvaluationCategory> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return demoStorage.updateEvaluationCategory(categoryId, data);
  },

  async deleteEvaluationCategory(_orgId: number, categoryId: number | string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    demoStorage.deleteEvaluationCategory(categoryId);
  },

  // GRADES MATRIX
  async getPeriodGradesMatrix(
    _orgId: number,
    params: {
      courseId: number | string;
      subjectId: number | string;
      academicPeriodId: number | string;
      studentId?: number | string;
    }
  ): Promise<PeriodGradesMatrixDTO> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return demoStorage.getPeriodGradesMatrix(
      params.courseId,
      params.subjectId,
      params.academicPeriodId,
      params.studentId
    );
  },
};
