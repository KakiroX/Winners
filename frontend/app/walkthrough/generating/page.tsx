import { AuthGuard } from '@/features/auth';
import { WalkthroughPage } from '@/views/walkthrough';

export default function Page() {
  return (
    <AuthGuard>
      <WalkthroughPage />
    </AuthGuard>
  );
}
