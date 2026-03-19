import { AuthGuard } from '@/features/auth';
import { DesignsPage } from '@/views/designs';

export default function Page() {
  return (
    <AuthGuard>
      <DesignsPage />
    </AuthGuard>
  );
}
