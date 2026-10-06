import ClientPage from '@/app/ClientPage';

export default function LessonPage({ params }: { params: { id: string; lessonId: string } }) {
  return <ClientPage courseId={params.id} lessonId={params.lessonId} />;
}
