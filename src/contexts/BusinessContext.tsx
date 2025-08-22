'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { BusinessContextType, Business, Account, SessionInfo } from '@/types';
import { getCookie } from 'cookies-next';

interface BusinessState {
  business: Business | null;
  accounts: Omit<Account, 'hashPassword'>[];
  sessions: SessionInfo[];
  isLoading: boolean;
}

type BusinessAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_BUSINESS'; payload: Business }
  | { type: 'SET_ACCOUNTS'; payload: Omit<Account, 'hashPassword'>[] }
  | { type: 'SET_SESSIONS'; payload: SessionInfo[] }
  | { type: 'UPDATE_BUSINESS'; payload: Business }
  | { type: 'REVOKE_SESSION'; payload: string };

const initialState: BusinessState = {
  business: null,
  accounts: [],
  sessions: [],
  isLoading: true,
};

function businessReducer(state: BusinessState, action: BusinessAction): BusinessState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_BUSINESS':
      return { ...state, business: action.payload, isLoading: false };
    
    case 'SET_ACCOUNTS':
      return { ...state, accounts: action.payload };
    
    case 'SET_SESSIONS':
      return { ...state, sessions: action.payload };
    
    case 'UPDATE_BUSINESS':
      return { ...state, business: action.payload };
    
    case 'REVOKE_SESSION':
      return {
        ...state,
        sessions: state.sessions.filter(session => session.id !== action.payload),
      };
    
    default:
      return state;
  }
}

const BusinessContext = createContext<BusinessContextType | null>(null);

interface BusinessProviderProps {
  children: ReactNode;
}

export function BusinessProvider({ children }: BusinessProviderProps): JSX.Element {
  const [state, dispatch] = useReducer(businessReducer, initialState);

  useEffect(() => {
    loadBusinessData();
  }, []);

  const loadBusinessData = async (): Promise<void> => {
    try {
      const token = getCookie('auth-token') as string;
      
      if (!token) {
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }

      const response = await fetch('/api/business', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error('Failed to fetch business data');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch business data');
      }
      
      dispatch({ type: 'SET_BUSINESS', payload: result.data.business });
      
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const loadAccounts = async (): Promise<void> => {
    try {
      const token = getCookie('auth-token') as string;
      
      const response = await fetch('/api/business/accounts', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch accounts');
      }

      const accounts = await response.json();
      
      dispatch({ type: 'SET_ACCOUNTS', payload: accounts });
      
    } catch (error) {
      throw error;
    }
  };

  const loadSessions = async (): Promise<void> => {
    try {
      const token = getCookie('auth-token') as string;
      
      const response = await fetch('/api/business/sessions', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }

      const sessions = await response.json();
      
      dispatch({ type: 'SET_SESSIONS', payload: sessions });
      
    } catch (error) {
      throw error;
    }
  };

  const revokeSession = async (sessionId: string): Promise<void> => {
    try {
      const token = getCookie('auth-token') as string;
      
      const response = await fetch(`/api/business/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to revoke session');
      }

      dispatch({ type: 'REVOKE_SESSION', payload: sessionId });
      
    } catch (error) {
      throw error;
    }
  };

  const updateBusiness = async (data: Partial<Business>): Promise<void> => {
    try {
      const token = getCookie('auth-token') as string;
      
      const response = await fetch('/api/business', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update business');
      }

      const updatedBusiness = await response.json();
      
      dispatch({ type: 'UPDATE_BUSINESS', payload: updatedBusiness });
      
    } catch (error) {
      throw error;
    }
  };

  const contextValue: BusinessContextType = {
    business: state.business,
    accounts: state.accounts,
    sessions: state.sessions,
    isLoading: state.isLoading,
    loadBusinessData,
    loadAccounts,
    loadSessions,
    revokeSession,
    updateBusiness,
  };

  return (
    <BusinessContext.Provider value={contextValue}>
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness(): BusinessContextType {
  const context = useContext(BusinessContext);
  
  if (!context) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  
  return context;
}
