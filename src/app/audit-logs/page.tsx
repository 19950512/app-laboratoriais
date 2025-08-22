import { AuthWrapper } from '@/components/AuthWrapper';
import AuditLogsPage from './client';

export default async function AuditLogsPageWrapper() {
  return (
    <AuthWrapper requiredRoute="/audit-logs">
      <AuditLogsPage />
    </AuthWrapper>
  );
}