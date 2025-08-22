import { AuthWrapper } from '@/components/AuthWrapper';
import BusinessAdminPage from './client';

export default async function BusinessAdminPageWrapper() {
  return (
    <AuthWrapper requiredRoute="/business-admin">
      <BusinessAdminPage />
    </AuthWrapper>
  );
}