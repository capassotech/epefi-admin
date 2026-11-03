// src/pages/admin/Dashboard.tsx
import { useEffect, useMemo, useState } from 'react';
import { BookOpen, ClipboardCheck, ClipboardPen, Users } from 'lucide-react';
import { DashboardStatsComponent, type StatCardData } from '@/components/admin/DashboardStats';
import {
  CourseSchedulePanel,
  HardestExamsPanel,
  PendingCorrectionsPanel,
  PerformancePanel,
  RecentActivityPanel,
} from '@/components/admin/DashboardPanels';
import { CoursesAPI } from '@/service/courses';
import { ExamsAPI } from '@/service/exams';
import { CompletedExamsAPI } from '@/service/completedExams';
import type { Course, Examen, ExamenRealizado } from '@/types/types';
import {
  countStudents,
  fetchAllStudentsFromApi,
} from '@/utils/studentsListClient';
import { normalizePaginatedResponse } from '@/utils/pagination';
import {
  computeExamPerformance,
  getCourseSchedules,
  lowestApprovalExams,
  sortByMostRecent,
} from '@/utils/dashboardMetrics';
import { parseTimestampSeconds } from '@/utils/formatTimestamp';
import { InteractiveLoader } from '@/components/ui/InteractiveLoader';
import { usePageHeader } from '@/context/PageHeaderContext';
import { dashboardTourSteps } from '@/config/tourSteps';

const PAGE_SIZE = 100;
/** Tope de páginas de exámenes corregidos para calcular métricas (hasta 1000 registros) */
const MAX_COMPLETED_PAGES = 10;
const PENDING_PREVIEW = 5;
const RECENT_PREVIEW = 6;

type ExamData = {
  exams: Examen[];
  examsTotal: number;
  pending: ExamenRealizado[];
  pendingTotal: number;
  completed: ExamenRealizado[];
};

async function fetchExamData(): Promise<ExamData> {
  const [examsRes, pendingPage, firstCompleted] = await Promise.all([
    ExamsAPI.getAll({ page: 1, limit: PAGE_SIZE }),
    CompletedExamsAPI.getAll({ estado: 'pendiente_correccion', page: 1, limit: PAGE_SIZE }),
    CompletedExamsAPI.getAll({ estado: 'completado', page: 1, limit: PAGE_SIZE }),
  ]);

  const extraPages = Math.min(firstCompleted.pagination.totalPages, MAX_COMPLETED_PAGES);
  const rest = await Promise.all(
    Array.from({ length: Math.max(extraPages - 1, 0) }, (_, i) =>
      CompletedExamsAPI.getAll({ estado: 'completado', page: i + 2, limit: PAGE_SIZE })
    )
  );

  const exams = normalizePaginatedResponse<Examen>(examsRes, 1, PAGE_SIZE);
  return {
    exams: exams.data,
    examsTotal: exams.pagination.total,
    pending: pendingPage.data,
    pendingTotal: pendingPage.pagination.total,
    completed: [...firstCompleted.data, ...rest.flatMap((page) => page.data)],
  };
}

export default function Dashboard() {
  const [students, setStudents] = useState({ total: 0, active: 0 });
  const [courses, setCourses] = useState<Course[]>([]);
  const [examData, setExamData] = useState<ExamData | null>(null);
  const [loading, setLoading] = useState(true);
  usePageHeader({ title: 'Panel general', tourSteps: dashboardTourSteps });

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);

      // Los exámenes no deben bloquear el resto del panel si su API falla
      const [studentsResult, coursesResult, examsResult] = await Promise.allSettled([
        fetchAllStudentsFromApi(),
        CoursesAPI.getAllList(),
        fetchExamData(),
      ]);

      if (studentsResult.status === 'fulfilled') {
        setStudents(countStudents(studentsResult.value));
      } else {
        console.error('Error loading students:', studentsResult.reason);
      }
      if (coursesResult.status === 'fulfilled') {
        setCourses(coursesResult.value);
      } else {
        console.error('Error loading courses:', coursesResult.reason);
      }
      if (examsResult.status === 'fulfilled') {
        setExamData(examsResult.value);
      } else {
        console.error('Error loading exams:', examsResult.reason);
      }

      setLoading(false);
    };

    loadDashboardData();
  }, []);

  const schedules = useMemo(() => getCourseSchedules(courses), [courses]);
  const performance = useMemo(
    () => (examData ? computeExamPerformance([...examData.completed, ...examData.pending]) : null),
    [examData]
  );
  const hardestExams = useMemo(
    () => (examData ? lowestApprovalExams(examData.completed) : []),
    [examData]
  );
  const recentActivity = useMemo(
    () =>
      examData
        ? sortByMostRecent([...examData.completed, ...examData.pending]).slice(0, RECENT_PREVIEW)
        : [],
    [examData]
  );
  // Primero los que llevan más tiempo esperando
  const pendingPreview = useMemo(
    () =>
      examData
        ? [...examData.pending]
            .sort(
              (a, b) =>
                parseTimestampSeconds(a.fechaRealizacion) - parseTimestampSeconds(b.fechaRealizacion)
            )
            .slice(0, PENDING_PREVIEW)
        : [],
    [examData]
  );

  if (loading) {
    return (
      <InteractiveLoader
        initialMessage="Cargando panel general"
        delayedMessage="Conectándose con el servidor, esto puede tomar unos minutos"
      />
    );
  }

  const inProgress = schedules.filter((s) => s.status === 'en_dictado').length;
  const enabledExams = examData?.exams.filter((e) => e.habilitado !== false).length ?? 0;
  const pendingTotal = examData?.pendingTotal ?? 0;

  const cards: StatCardData[] = [
    {
      label: 'Estudiantes',
      value: students.total.toLocaleString('es-AR'),
      hint: `${students.active.toLocaleString('es-AR')} activos`,
      icon: Users,
      tone: 'blue',
      href: '/students',
    },
    {
      label: 'Cursos',
      value: courses.length.toString(),
      hint: inProgress > 0 ? `${inProgress} en dictado` : 'Ninguno en dictado',
      icon: BookOpen,
      tone: 'violet',
      href: '/products',
    },
    {
      label: 'Exámenes',
      value: examData ? examData.examsTotal.toString() : '—',
      hint: examData ? `${enabledExams} habilitados` : 'No disponible',
      icon: ClipboardCheck,
      tone: 'orange',
      href: '/exams',
    },
    {
      label: 'Por corregir',
      value: examData ? pendingTotal.toString() : '—',
      hint: !examData
        ? 'No disponible'
        : pendingTotal > 0
          ? 'Esperan tu corrección'
          : 'Todo al día',
      icon: ClipboardPen,
      tone: 'amber',
      href: '/exams/completed',
      highlight: pendingTotal > 0,
    },
  ];

  return (
    <div className="space-y-6">
      <div data-tour="dashboard-stats">
        <DashboardStatsComponent cards={cards} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <PendingCorrectionsPanel
          rows={pendingPreview}
          total={pendingTotal}
          unavailable={!examData}
          className="lg:col-span-2"
        />
        <PerformancePanel performance={performance} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <RecentActivityPanel rows={recentActivity} />
        <HardestExamsPanel exams={hardestExams} />
        <CourseSchedulePanel schedules={schedules} />
      </div>
    </div>
  );
}
