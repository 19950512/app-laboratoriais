// @ts-nocheck
import jsonwebtoken from 'jsonwebtoken';
import { Account, Business, AccountPreference } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface JwtPayload {
  accountId: string;
  businessId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface SessionData {
  account: Omit<Account, 'hashPassword'>;
  business: Business;
  preferences: AccountPreference;
}

export class JwtService {
  /**
   * Gera um token JWT para o usuário
   */
  static generateToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    try {
      return jsonwebtoken.sign(
        payload,
        JWT_SECRET,
        {
          expiresIn: JWT_EXPIRES_IN,
          algorithm: 'HS256',
        }
      );
    } catch (error) {
      console.error('Error generating JWT token:', error);
      throw new Error('Failed to generate authentication token');
    }
  }

  /**
   * Verifica e decodifica um token JWT
   */
  static verifyToken(token: string): JwtPayload {
    try {
      const decoded = jsonwebtoken.verify(token, JWT_SECRET, {
        algorithms: ['HS256'],
      }) as JwtPayload;

      return decoded;
    } catch (error) {
      if (error instanceof jsonwebtoken.TokenExpiredError) {
        throw new Error('Token expired');
      }
      if (error instanceof jsonwebtoken.JsonWebTokenError) {
        throw new Error('Invalid token');
      }
      console.error('JWT verification error:', error);
      throw new Error('Token verification failed');
    }
  }

  /**
   * Decodifica um token sem verificar a assinatura (para debugging)
   */
  static decodeToken(token: string): JwtPayload | null {
    try {
      return jsonwebtoken.decode(token) as JwtPayload;
    } catch (error) {
      console.error('JWT decode error:', error);
      return null;
    }
  }

  /**
   * Verifica se um token está expirado
   */
  static isTokenExpired(token: string): boolean {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded?.exp) return true;

      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch {
      return true;
    }
  }

  /**
   * Extrai o tempo de expiração de um token
   */
  static getTokenExpiration(token: string): Date | null {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded?.exp) return null;

      return new Date(decoded.exp * 1000);
    } catch {
      return null;
    }
  }

  /**
   * Gera um hash do token para armazenamento seguro
   */
  static hashToken(token: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Refresh token logic (gera um novo token baseado em um válido)
   */
  static refreshToken(currentToken: string): string {
    const payload = this.verifyToken(currentToken);
    
    // Remove campos de tempo do payload original
    const { iat, exp, ...cleanPayload } = payload;
    
    return this.generateToken(cleanPayload);
  }

  /**
   * Calcula o tempo restante até a expiração em segundos
   */
  static getTimeUntilExpiration(token: string): number {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded?.exp) return 0;

      const currentTime = Math.floor(Date.now() / 1000);
      return Math.max(0, decoded.exp - currentTime);
    } catch {
      return 0;
    }
  }
}

// Utilities for cookie management
export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

export const AUTH_COOKIE_NAME = 'auth-token';
export const REFRESH_COOKIE_NAME = 'refresh-token';
