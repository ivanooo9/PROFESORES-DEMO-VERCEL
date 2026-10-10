import React, { useEffect, useState } from 'react';
import { BookOpen, Save, X, Calendar, GraduationCap, Layers } from 'lucide-react';
import {
  Activity,
  Course,
  EvaluationType,
  Subject,
  AcademicPeriod,
  AcademicEvaluationCategory,
} from '../../types/teacher';
import { getLocalDateString } from '../../utils/date';

export interface ActivityFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  courses: Course[];
  subjects: Subject[];
  periods?: AcademicPeriod[];
  categories?: AcademicEvaluationCategory[];
  initialCourseId?: string;
  initialSubjectId?: string;
  initialPeriodId?: string;
  initialCategoryId?: string;
  courseName?: string;
  subjectName?: string;
  periodName?: string;
  hasExamActivity?: boolean;
  onSave: (activity: Omit<Activity, 'id'>) => boolean | Promise<boolean>;
}

const baseActivityTypeOptions: { value: EvaluationType; label: string; description?: string }[] = [
  { value: 'activity', label: 'Actividad / Tarea' },
  { value: 'practice', label: 'Práctica' },
  { value: 'lesson', label: 'Lección' },
  { value: 'exam', label: 'Evaluación Parcial (30%)' },
];

export const ActivityFormModal: React.FC<ActivityFormModalProps> = ({
  isOpen,
  onClose,
  courses,
  subjects,
  periods = [],
  categories = [],
  initialCourseId,
  initialSubjectId,
  initialPeriodId,
  initialCategoryId,
  courseName,
  subjectName,
  periodName,
  hasExamActivity = false,
  onSave,
}) => {
  const [courseId, setCourseId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [periodId, setPeriodId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<EvaluationType>('activity');
  const [date, setDate] = useState(getLocalDateString);
  const [maxScore, setMaxScore] = useState('10');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const selectedCourse = initialCourseId || courses[0]?.id || '';
    const selectedSubject =
      initialSubjectId ||
      subjects.find((subject) => subject.courseId === selectedCourse)?.id ||
      '';
    const selectedPeriod = initialPeriodId || (periods[0] ? String(periods[0].id) : '');
    const selectedCategory = initialCategoryId || (categories[0] ? String(categories[0].id) : '');

    setCourseId(selectedCourse);
    setSubjectId(selectedSubject);
    setPeriodId(selectedPeriod);
    setCategoryId(selectedCategory);
    setName('');
    setType('activity');
    setDate(getLocalDateString());
    setMaxScore('10');
    setError('');
    setIsSubmitting(false);
  }, [
    isOpen,
    courses,
    subjects,
    periods,
    categories,
    initialCourseId,
    initialSubjectId,
    initialPeriodId,
    initialCategoryId,
  ]);

  if (!isOpen) return null;

  const displayCourseName =
    courseName || courses.find((c) => c.id === courseId)?.name || courseId || 'Curso no seleccionado';
  const displaySubjectName =
    subjectName || subjects.find((s) => s.id === subjectId)?.name || subjectId || 'Materia no seleccionada';
  const displayPeriodName =
    periodName ||
    (periodId
      ? periods.find((p) => String(p.id) === String(periodId))?.name.replace(/\s*\([^)]*\)$/, '') || periodId
      : 'Periodo activo');

  const resolveCategoryId = (selectedType: EvaluationType, activityName: string): string => {
    if (!categories || categories.length === 0) return categoryId || initialCategoryId || '';
    const isExam = selectedType === 'exam' || /evalua|examen|parcial/i.test(activityName);
    const isLesson = selectedType === 'lesson' || /lecci/i.test(activityName);

    if (isExam) {
      const examCat = categories.find((c) => /evalua|examen|parcial/i.test(c.name));
      if (examCat) return String(examCat.id);
    }
    if (isLesson) {
      const lessonCat = categories.find((c) => /lecci/i.test(c.name));
      if (lessonCat) return String(lessonCat.id);
    }
    const hwCat = categories.find((c) => /tarea|activ|pr[aá]ct|trabaj/i.test(c.name));
    if (hwCat) return String(hwCat.id);

    return categoryId || initialCategoryId || (categories[0] ? String(categories[0].id) : '');
  };

  const isExamSelection = type === 'exam' || /evalua|examen|parcial/i.test(name.trim());
  const isDuplicateExam = isExamSelection && hasExamActivity;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting || !courseId || !subjectId || !name.trim()) return;
    if (date < getLocalDateString()) {
      setError('La fecha de la actividad no puede ser anterior a hoy.');
      return;
    }
    const parsedMaxScore = Number(maxScore);
    if (!Number.isFinite(parsedMaxScore) || parsedMaxScore <= 0) {
      setError('El puntaje máximo debe ser mayor que cero.');
      return;
    }

    const trimmedName = name.trim();
    const isExam = type === 'exam' || /evalua|examen|parcial/i.test(trimmedName);
    const isLesson = !isExam && (type === 'lesson' || /lecci/i.test(trimmedName));
    const effectiveType: EvaluationType = isExam ? 'exam' : isLesson ? 'lesson' : type;

    if (isExam && hasExamActivity) {
      setError('Ya existe una Evaluación Parcial registrada para este periodo. Solo se permite 1 por parcial.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      const targetCategory = resolveCategoryId(effectiveType, trimmedName);
      const saved = await onSave({
        courseId,
        subjectId,
        name: trimmedName,
        type: effectiveType,
        date,
        maxScore: parsedMaxScore,
        academicPeriodId: periodId || undefined,
        categoryId: targetCategory || undefined,
      });
      if (!saved) {
        setError('No se pudo guardar la actividad. Verifica los datos e inténtalo nuevamente.');
        return;
      }
      onClose();
    } catch (saveError: unknown) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo guardar la actividad.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="activity-title"
        className="bg-white rounded-3xl border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden"
      >
        {/* Cabecera del Modal */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 id="activity-title" className="text-base font-bold text-slate-900">
                Crear actividad
              </h2>
              <p className="text-xs text-slate-500">
                Defina la actividad y asígnela a un componente ponderado.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Cerrar formulario"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 disabled:opacity-50 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resumen de Contexto de Sólo Lectura (Heredado de la vista principal) */}
        <div className="px-6 pt-4 pb-1">
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 shadow-2xs">
              <GraduationCap className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="text-slate-400 font-medium">Curso:</span>
              <span className="text-slate-900 font-bold">{displayCourseName}</span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 shadow-2xs">
              <Layers className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="text-slate-400 font-medium">Materia:</span>
              <span className="text-slate-900 font-bold">{displaySubjectName}</span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="text-slate-400 font-medium">Periodo:</span>
              <span className="text-slate-900 font-bold">{displayPeriodName}</span>
            </div>
          </div>
        </div>

        {/* Formulario con Campos Editables Exclusivos */}
        <form onSubmit={handleSubmit} className="p-6 pt-3 space-y-4 text-xs">
          <label className="block font-bold text-slate-700">
            Nombre de la actividad *
            <input
              required
              autoFocus
              value={name}
              onChange={(event) => {
                const val = event.target.value;
                setName(val);
                if (/evalua|examen|parcial/i.test(val) && type !== 'exam' && !hasExamActivity) {
                  setType('exam');
                } else if (/lecci/i.test(val) && type !== 'lesson' && !/evalua|examen|parcial/i.test(val)) {
                  setType('lesson');
                }
              }}
              placeholder={type === 'exam' ? 'Ej. Evaluación Parcial 1' : 'Ej. Taller en Grupo N° 1'}
              className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="font-bold text-slate-700">
              Tipo *
              <select
                value={type}
                onChange={(event) => {
                  const newType = event.target.value as EvaluationType;
                  setType(newType);
                  if (newType === 'exam' && !name.trim()) {
                    setName('Evaluación Parcial');
                  }
                }}
                className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition cursor-pointer"
              >
                {baseActivityTypeOptions.map((opt) => (
                  <option
                    key={opt.value}
                    value={opt.value}
                    disabled={opt.value === 'exam' && hasExamActivity}
                  >
                    {opt.value === 'exam' && hasExamActivity
                      ? `${opt.label} — (Ya registrada)`
                      : opt.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="font-bold text-slate-700">
              Fecha *
              <input
                required
                type="date"
                min={getLocalDateString()}
                value={date}
                onChange={(event) => {
                  setError('');
                  setDate(event.target.value);
                }}
                className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
              />
            </label>

            <label className="font-bold text-slate-700">
              Puntaje máximo *
              <input
                required
                type="number"
                min="0.1"
                step="0.1"
                value={maxScore}
                onChange={(event) => setMaxScore(event.target.value)}
                className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 font-bold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
              />
            </label>
          </div>

          {isDuplicateExam && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px] leading-relaxed">
              <span className="font-bold block mb-0.5">⚠️ Evaluación Parcial ya registrada</span>
              Este periodo ya cuenta con una Evaluación Parcial. El modelo de calificación permite un máximo de 1 evaluación única por parcial (30%).
            </div>
          )}

          {error && (
            <p role="alert" className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-xl">
              {error}
            </p>
          )}

          <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold disabled:opacity-50 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !courseId || !subjectId || !name.trim() || isDuplicateExam}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-2 disabled:opacity-50 transition shadow-xs cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? 'Guardando...' : 'Guardar actividad'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
