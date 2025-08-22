import { AuthWrapper } from '@/components/AuthWrapper';
import BankAccountsPage from './client';

export default async function BankAccountsPageWrapper() {
  return (
    <AuthWrapper requiredRoute="/bank-accounts">
      <BankAccountsPage />
    </AuthWrapper>
  );
}
