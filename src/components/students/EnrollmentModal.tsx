import React, { useEffect, useState } from 'react';
import { Save, UserRoundPlus, X, Calendar } from 'lucide-react';
import { AcademicYear, Course, Enrollment, Student } from '../../types/teacher';

export interface EnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  courses: Course[];
  enrollments: Enrollment[];
  academicYears?: AcademicYear[];
  onSave: (studentId: string, courseId: string, academicYearId?: string | null) => Promise<void>;
}

export const EnrollmentModal: React.FC<EnrollmentModalProps> = ({
  isOpen,
  onClose,
  students,
  courses,
  enrollments,
  academicYears = [],
  onSave,
}) => {
  const [studentId, setStudentId] = useState(students[0]?.id || '');
  const [courseId, setCourseId] = useState(courses[0]?.id || '');
  const [academicYearId, setAcademicYearId] = useState<string>('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStudentId(students[0]?.id || '');
      setCourseId(courses[0]?.id || '');
      const validYear = academicYears.find((y) => y.status === 'ACTIVE') || academicYears.find((y) => y.status === 'PLANNED') || null;
      setAcademicYearId(validYear ? String(validYear.id) : '');
      setError('');
      setIsSubmitting(false);
    }
  }, [isOpen, students, courses, academicYears]);

  if (!isOpen) return null;

  const currentActiveEnrollmentInYear = enrollments.find(
    (enrollment) =>
      enrollment.studentId === studentId &&
      enrollment.status === 'active' &&
      enrollment.academicYearId === academicYearId
  );
  const currentCourse = currentActiveEnrollmentInYear
    ? courses.find((c) => c.id === currentActiveEnrollmentInYear.courseId)
    : null;
  const isSameCourse = currentActiveEnrollmentInYear?.courseId === courseId;
  const isReassigning = Boolean(currentActiveEnrollmentInYear && !isSameCourse);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting || !studentId || !courseId) return;

    if (!academicYearId) {
      setError('Selecciona un año lectivo para registrar la matrícula.');
      return;
    }

    if (isSameCourse) {
      setError('El estudiante ya cuenta con una matrícula activa en este curso para el año lectivo seleccionado.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await onSave(studentId, courseId, academicYearId || null);
      onClose();
    } catch (saveError: unknown) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo procesar la matrícula.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="enrollment-title" className="bg-white rounded-3xl border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
              <UserRoundPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 id="enrollment-title" className="text-base font-bold text-slate-900">Matricular estudiante</h2>
              <p className="text-xs text-slate-500">Asigne un estudiante existente a un curso y año lectivo.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} disabled={isSubmitting} aria-label="Cerrar formulario" className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 disabled:opacity-50">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs" aria-busy={isSubmitting}>
          {(students.length === 0 || courses.length === 0) && (
            <p role="alert" className="text-xs font-semibold text-rose-700">
              Registra al menos un estudiante y un curso antes de matricular.
            </p>
          )}
          <div>
            <label htmlFor="enrollment-student" className="block font-bold text-slate-700 mb-1">Estudiante *</label>
            <select
              id="enrollment-student"
              required
              value={studentId}
              onChange={(event) => setStudentId(event.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900"
            >
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.firstName} {student.lastName} ({student.identification || 'Sin ID'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="enrollment-course" className="block font-bold text-slate-700 mb-1">Curso / Paralelo *</label>
            <select
              id="enrollment-course"
              required
              value={courseId}
              onChange={(event) => setCourseId(event.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900"
            >
              {courses
                .filter((course) => course.status !== 'archived')
                .map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name} - {course.level}
                  </option>
                ))}
            </select>
          </div>

          {isReassigning && (
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-900 text-[11px] leading-relaxed">
              <span className="font-bold block mb-0.5">ℹ️ Reasignación de curso</span>
              El estudiante actualmente pertenece a <strong>{currentCourse?.name || 'otro curso'}</strong> en este año lectivo. Al matricularlo, su curso activo se actualizará a <strong>{courses.find((c) => c.id === courseId)?.name}</strong>.
            </div>
          )}

          <div>
            <label htmlFor="enrollment-year" className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              Año Lectivo *
            </label>
            {academicYears.filter((y) => y.status === 'ACTIVE' || y.status === 'PLANNED').length === 0 ? (
              <p className="text-xs font-semibold text-rose-600 bg-rose-50 p-2 rounded-xl border border-rose-200">
                No hay años lectivos disponibles para matrícula (Activos o Planificados). Configure o active un año lectivo primero.
              </p>
            ) : (
              <select
                id="enrollment-year"
                required
                value={academicYearId}
                onChange={(event) => setAcademicYearId(event.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900"
              >
                <option value="">Selecciona un año lectivo *</option>
                {academicYears
                  .filter((year) => year.status === 'ACTIVE' || year.status === 'PLANNED')
                  .map((year) => (
                    <option key={year.id} value={year.id}>
                      {year.name} ({year.status})
                    </option>
                  ))}
              </select>
            )}
          </div>

          {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}

          <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold disabled:opacity-50">
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting || !studentId || !courseId || !academicYearId} className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-2 disabled:opacity-50">
              <Save className="w-4 h-4" />
              {isSubmitting ? 'Guardando...' : 'Matricular'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
