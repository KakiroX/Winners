import { AuthGuard } from '@/features/auth';
import { GeneratePage } from '@/views/generate';

export default function Page() {
  return (
    <AuthGuard>
      <GeneratePage />
    </AuthGuard>
  );
}
