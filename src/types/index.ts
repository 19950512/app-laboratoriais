export interface Business {
  id: string;
  name: string;
  document: string;
  logo?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Account {
  businessId: string;
  id: string;
  email: string;
  name: string;
  photoProfile?: string;
  hashPassword: string;
  active: boolean;
  isCompanyOwner: boolean;
  createdAt: Date;
  updatedAt: Date;
  business?: Business;
  accountPreference?: AccountPreference;
}

export interface AccountPreference {
  businessId: string;
  accountId: string;
  theme: ThemeEnum;
  createdAt: Date;
  updatedAt: Date;
  business?: Business;
  account?: Account;
}

export interface TokenJwt {
  businessId: string;
  id: string;
  accountId: string;
  expireIn: Date;
  token: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  business?: Business;
  account?: Account;
}

export interface Auditoria {
  businessId: string;
  id: string;
  accountId?: string;
  description: string;
  context: ContextEnum;
  moment: Date;
  ipAddress?: string;
  userAgent?: string;
  additionalData?: Record<string, unknown>;
  business?: Business;
  account?: Account;
}

export enum ThemeEnum {
  DARK = 'dark',
  LIGHT = 'light',
}

export enum Bank {
  INTER = 'inter',
  ASAAS = 'asaas'
}

export enum ContextEnum {
  AUTH_LOGIN = 'auth_login',
  AUTH_LOGOUT = 'auth_logout',
  AUTH_RECOVERY = 'auth_recovery',
  AUTH_DENY = 'auth_deny',
  AUTH_PASSWORD_CHANGE = 'auth_password_change',
  ACCOUNT_CREATE = 'account_create',
  ACCOUNT_UPDATE = 'account_update',
  ACCOUNT_DEACTIVATE = 'account_deactivate',
  ACCOUNT_ROLE_ADD = 'account_role_add',
  ACCOUNT_ROLE_REMOVE = 'account_role_remove',
  BUSINESS_CREATE = 'business_create',
  BUSINESS_UPDATE = 'business_update',
  PROFILE_UPDATE = 'profile_update',
  PREFERENCES_UPDATE = 'preferences_update',
  THEME_CHANGE = 'theme_change',
  SESSION_CREATE = 'session_create',
  SESSION_REVOKE = 'session_revoke',
  ROLE_CREATE = 'role_create',
  ROLE_UPDATE = 'role_update',
  ROLE_DELETE = 'role_delete',
  BANK_ACCOUNT_CREATE = 'bank_account_create',
  BANK_ACCOUNT_UPDATE = 'bank_account_update',
  BANK_ACCOUNT_DELETE = 'bank_account_delete',
}

// DTOs para requests/responses
export interface CreateBusinessDto {
  name: string;
  document: string;
}

export interface CreateAccountDto {
  businessId: string;
  email: string;
  name: string;
  password: string;
  photoProfile?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface UpdateAccountDto {
  name?: string;
  email?: string;
  photoProfile?: string;
  currentPassword?: string;
  newPassword?: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface RecoveryPasswordDto {
  email: string;
}

export interface UpdatePreferencesDto {
  theme: ThemeEnum;
}

// Response types
export interface AuthResponse {
  token: string;
  account: Omit<Account, 'hashPassword'>;
  business: Business;
  preferences: AccountPreference;
}

export interface SessionInfo {
  id: string;
  accountId: string;
  accountName: string;
  accountEmail: string;
  businessId: string;
  businessName: string;
  expireIn: Date;
  createdAt: Date;
  active: boolean;
}

export interface AuditoriaFilters {
  context?: ContextEnum[];
  accountId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

// Error types
export interface ApiError {
  message: string;
  code: string;
  field?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// Context types
export interface AccountContextType {
  account: Omit<Account, 'hashPassword'> | null;
  preferences: AccountPreference | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginDto) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: UpdateAccountDto) => Promise<void>;
  changePassword: (data: ChangePasswordDto) => Promise<void>;
  updatePreferences: (data: UpdatePreferencesDto) => Promise<void>;
}

export interface BusinessContextType {
  business: Business | null;
  accounts: Omit<Account, 'hashPassword'>[];
  sessions: SessionInfo[];
  isLoading: boolean;
  loadBusinessData: () => Promise<void>;
  loadAccounts: () => Promise<void>;
  loadSessions: () => Promise<void>;
  revokeSession: (sessionId: string) => Promise<void>;
  updateBusiness: (data: Partial<Business>) => Promise<void>;
}

// Utility types
export type WithoutPassword<T> = Omit<T, 'hashPassword'>;
export type CreateEntity<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateEntity<T> = Partial<Omit<T, 'id' | 'businessId' | 'createdAt' | 'updatedAt'>>;

// API Response wrapper
export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'select' | 'textarea' | 'file';
  placeholder?: string;
  required?: boolean;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    custom?: (value: string) => string | null;
  };
  options?: Array<{ value: string; label: string }>;
}

export interface FormState {
  values: Record<string, string>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
}

export interface BankAccount {
  id: string;
  nameAccountBank: string;
  bankName: string;
  bankLogo: string;
  certificatePublic: string;
  certificatePrivate: string;
  clientId: string;
  secretId: string;
  active: boolean;
}
