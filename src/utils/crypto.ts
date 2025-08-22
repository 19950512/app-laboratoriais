import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

export class PasswordService {
  /**
   * Cria um hash da senha usando bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    try {
      const salt = await bcrypt.genSalt(SALT_ROUNDS);
      return await bcrypt.hash(password, salt);
    } catch (error) {
      console.error('Error hashing password:', error);
      throw new Error('Failed to hash password');
    }
  }

  /**
   * Verifica se uma senha corresponde ao hash
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      console.error('Error verifying password:', error);
      return false;
    }
  }

  /**
   * Valida a força da senha
   */
  static validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
    score: number;
  } {
    const errors: string[] = [];
    let score = 0;

    // Comprimento mínimo
    if (password.length < 8) {
      errors.push('A senha deve ter pelo menos 8 caracteres');
    } else {
      score += 1;
    }

    // Letra minúscula
    if (!/[a-z]/.test(password)) {
      errors.push('A senha deve conter pelo menos uma letra minúscula');
    } else {
      score += 1;
    }

    // Letra maiúscula
    if (!/[A-Z]/.test(password)) {
      errors.push('A senha deve conter pelo menos uma letra maiúscula');
    } else {
      score += 1;
    }

    // Número
    if (!/\d/.test(password)) {
      errors.push('A senha deve conter pelo menos um número');
    } else {
      score += 1;
    }

    // Caractere especial
    if (!/[@$!%*?&]/.test(password)) {
      errors.push('A senha deve conter pelo menos um caractere especial (@$!%*?&)');
    } else {
      score += 1;
    }

    // Comprimento adicional
    if (password.length >= 12) {
      score += 1;
    }

    // Variedade de caracteres
    if (password.length >= 16) {
      score += 1;
    }

    return {
      isValid: errors.length === 0,
      errors,
      score: Math.min(score, 5), // Score máximo de 5
    };
  }

  /**
   * Gera uma senha temporária segura
   */
  static generateTemporaryPassword(length: number = 12): string {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const specials = '@$!%*?&';
    
    const allChars = lowercase + uppercase + numbers + specials;
    
    let password = '';
    
    // Garantir pelo menos um caractere de cada tipo
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += specials[Math.floor(Math.random() * specials.length)];
    
    // Preencher o restante aleatoriamente
    for (let i = 4; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Embaralhar a senha
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }
}

export class CryptoService {
  /**
   * Gera um token aleatório seguro
   */
  static generateSecureToken(length: number = 32): string {
    const crypto = require('crypto');
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Cria um hash SHA256 de uma string
   */
  static createHash(data: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Cria um hash HMAC
   */
  static createHMAC(data: string, secret: string): string {
    const crypto = require('crypto');
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
  }

  /**
   * Gera um UUID v4
   */
  static generateUUID(): string {
    const crypto = require('crypto');
    return crypto.randomUUID();
  }

  /**
   * Criptografia simétrica (AES)
   */
  static encrypt(text: string, key: string): { encrypted: string; iv: string } {
    const crypto = require('crypto');
    const algorithm = 'aes-256-cbc';
    const keyHash = crypto.createHash('sha256').update(key).digest();
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipher(algorithm, keyHash);
    cipher.setIV(iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      encrypted,
      iv: iv.toString('hex'),
    };
  }

  /**
   * Descriptografia simétrica (AES)
   */
  static decrypt(encryptedData: { encrypted: string; iv: string }, key: string): string {
    const crypto = require('crypto');
    const algorithm = 'aes-256-cbc';
    const keyHash = crypto.createHash('sha256').update(key).digest();
    const iv = Buffer.from(encryptedData.iv, 'hex');
    
    const decipher = crypto.createDecipher(algorithm, keyHash);
    decipher.setIV(iv);
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}

// Utility functions para sanitização
export class SanitizationService {
  /**
   * Remove caracteres perigosos de uma string
   */
  static sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove < e >
      .replace(/javascript:/gi, '') // Remove javascript:
      .replace(/on\w+=/gi, '') // Remove eventos on*=
      .trim();
  }

  /**
   * Sanitiza email
   */
  static sanitizeEmail(email: string): string {
    return email.toLowerCase().trim().replace(/\s/g, '');
  }

  /**
   * Sanitiza números de documento (CPF/CNPJ)
   */
  static sanitizeDocument(document: string): string {
    return document.replace(/\D/g, '');
  }

  /**
   * Limita o tamanho de uma string
   */
  static truncateString(str: string, maxLength: number): string {
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength - 3) + '...';
  }

  /**
   * Remove espaços extras
   */
  static normalizeSpaces(str: string): string {
    return str.replace(/\s+/g, ' ').trim();
  }
}
