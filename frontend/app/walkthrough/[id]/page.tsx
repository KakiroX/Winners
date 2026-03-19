import { AuthGuard } from '@/features/auth';
import { WalkthroughPage } from '@/views/walkthrough';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <AuthGuard>
      <WalkthroughPage walkthroughId={id} />
    </AuthGuard>
  );
}
