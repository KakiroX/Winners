import { AuthGuard } from '@/features/auth';
import { PlanDetailPage } from '@/views/plan-detail';

export default function Page() {
  return (
    <AuthGuard>
      <PlanDetailPage />
    </AuthGuard>
  );
}
