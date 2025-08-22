'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AccountContextType, Account, AccountPreference, LoginDto, UpdateAccountDto, ChangePasswordDto, UpdatePreferencesDto, ThemeEnum } from '@/types';
import { JwtService } from '@/lib/jwt';
import { getCookie, setCookie, deleteCookie } from 'cookies-next';

interface AccountState {
  account: Omit<Account, 'hashPassword'> | null;
  preferences: AccountPreference | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

type AccountAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_AUTHENTICATED'; payload: { account: Omit<Account, 'hashPassword'>; preferences: AccountPreference } }
  | { type: 'SET_LOGOUT' }
  | { type: 'UPDATE_ACCOUNT'; payload: Omit<Account, 'hashPassword'> }
  | { type: 'UPDATE_PREFERENCES'; payload: AccountPreference };

const initialState: AccountState = {
  account: null,
  preferences: null,
  isAuthenticated: false,
  isLoading: true,
};

function accountReducer(state: AccountState, action: AccountAction): AccountState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_AUTHENTICATED':
      return {
        ...state,
        account: action.payload.account,
        preferences: action.payload.preferences,
        isAuthenticated: true,
        isLoading: false,
      };
    
    case 'SET_LOGOUT':
      return {
        ...state,
        account: null,
        preferences: null,
        isAuthenticated: false,
        isLoading: false,
      };
    
    case 'UPDATE_ACCOUNT':
      return {
        ...state,
        account: action.payload,
      };
    
    case 'UPDATE_PREFERENCES':
      return {
        ...state,
        preferences: action.payload,
      };
    
    default:
      return state;
  }
}

const AccountContext = createContext<AccountContextType | null>(null);

interface AccountProviderProps {
  children: ReactNode;
}

export function AccountProvider({ children }: AccountProviderProps): JSX.Element {
  const [state, dispatch] = useReducer(accountReducer, initialState);

  // Verifica se há token válido no cookie ao inicializar
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Aplica tema das preferências quando carregadas
  useEffect(() => {
    if (state.preferences?.theme) {
      if (state.preferences.theme === ThemeEnum.DARK) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [state.preferences?.theme]);

  const checkAuthStatus = async (): Promise<void> => {
    try {
      const token = getCookie('auth-token') as string;
      
      if (!token) {
        dispatch({ type: 'SET_LOGOUT' });
        return;
      }

      // Verifica se o token está válido
      if (JwtService.isTokenExpired(token)) {
        deleteCookie('auth-token');
        dispatch({ type: 'SET_LOGOUT' });
        return;
      }

      // Busca dados do usuário no servidor
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }

      const userData = await response.json();
      
      if (!userData.success) {
        throw new Error(userData.error || 'Failed to fetch user data');
      }
      
      dispatch({
        type: 'SET_AUTHENTICATED',
        payload: {
          account: userData.data.account,
          preferences: userData.data.preferences,
        },
      });
      
    } catch (error) {
      deleteCookie('auth-token');
      dispatch({ type: 'SET_LOGOUT' });
    }
  };

  const login = async (credentials: LoginDto): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Login failed');
      }
      
      // Armazenar token no cookie
      setCookie('auth-token', result.data.token, {
        maxAge: 7 * 24 * 60 * 60, // 7 dias
        httpOnly: false, // Para poder acessar no client
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });

      dispatch({
        type: 'SET_AUTHENTICATED',
        payload: {
          account: result.data.account,
          preferences: result.data.preferences,
        },
      });

    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      const token = getCookie('auth-token') as string;
      
      if (token) {
        // Notificar o servidor sobre o logout
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }

      deleteCookie('auth-token');
      dispatch({ type: 'SET_LOGOUT' });
      
    } catch (error) {
      // Mesmo se der erro no servidor, remove o token local
      deleteCookie('auth-token');
      dispatch({ type: 'SET_LOGOUT' });
    }
  };

  const updateProfile = async (data: UpdateAccountDto): Promise<void> => {
    try {
      const token = getCookie('auth-token') as string;
      
      const response = await fetch('/api/account/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update profile');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update profile');
      }
      
      dispatch({
        type: 'UPDATE_ACCOUNT',
        payload: result.data.account,
      });

    } catch (error) {
      throw error;
    }
  };

  const changePassword = async (data: ChangePasswordDto): Promise<void> => {
    try {
      const token = getCookie('auth-token') as string;
      
      const response = await fetch('/api/account/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to change password');
      }

    } catch (error) {
      throw error;
    }
  };

  const updatePreferences = async (data: UpdatePreferencesDto): Promise<void> => {
    try {
      const token = getCookie('auth-token') as string;
      
      const response = await fetch('/api/account/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update preferences');
      }

      const result = await response.json();
      
      if (result.success) {
        dispatch({
          type: 'UPDATE_PREFERENCES',
          payload: {
            ...state.preferences!,
            ...result.data.preferences,
          },
        });

        // Aplicar tema imediatamente
        if (data.theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }

    } catch (error) {
      throw error;
    }
  };

  const contextValue: AccountContextType = {
    account: state.account,
    preferences: state.preferences,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    login,
    logout,
    updateProfile,
    changePassword,
    updatePreferences,
  };

  return (
    <AccountContext.Provider value={contextValue}>
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount(): AccountContextType {
  const context = useContext(AccountContext);
  
  if (!context) {
    throw new Error('useAccount must be used within an AccountProvider');
  }
  
  return context;
}
