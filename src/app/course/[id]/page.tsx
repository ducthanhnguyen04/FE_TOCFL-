import ClientPage from '../../ClientPage';

export default function CoursePage({ params }: { params: { id: string } }) {
  return <ClientPage courseId={params.id} />;
}
