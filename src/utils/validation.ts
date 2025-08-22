import Joi from 'joi';
import { LoginDto, CreateAccountDto, CreateBusinessDto, UpdateAccountDto, ChangePasswordDto, RecoveryPasswordDto, UpdatePreferencesDto } from '@/types';

// Schemas de validação

export const loginSchema = Joi.object<LoginDto>({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .max(255)
    .required()
    .messages({
      'string.email': 'Email deve ter um formato válido',
      'string.max': 'Email deve ter no máximo 255 caracteres',
      'any.required': 'Email é obrigatório',
    }),
  password: Joi.string()
    .min(6)
    .max(128)
    .required()
    .messages({
      'string.min': 'Senha deve ter pelo menos 6 caracteres',
      'string.max': 'Senha deve ter no máximo 128 caracteres',
      'any.required': 'Senha é obrigatória',
    }),
});

export const createAccountSchema = Joi.object<CreateAccountDto>({
  businessId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.uuid': 'ID do negócio deve ser um UUID válido',
      'any.required': 'ID do negócio é obrigatório',
    }),
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .max(255)
    .required()
    .messages({
      'string.email': 'Email deve ter um formato válido',
      'string.max': 'Email deve ter no máximo 255 caracteres',
      'any.required': 'Email é obrigatório',
    }),
  name: Joi.string()
    .min(2)
    .max(255)
    .trim()
    .required()
    .messages({
      'string.min': 'Nome deve ter pelo menos 2 caracteres',
      'string.max': 'Nome deve ter no máximo 255 caracteres',
      'any.required': 'Nome é obrigatório',
    }),
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.min': 'Senha deve ter pelo menos 8 caracteres',
      'string.max': 'Senha deve ter no máximo 128 caracteres',
      'string.pattern.base': 'Senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial',
      'any.required': 'Senha é obrigatória',
    }),
  photoProfile: Joi.string()
    .uri()
    .max(500)
    .optional()
    .messages({
      'string.uri': 'URL da foto deve ser válida',
      'string.max': 'URL da foto deve ter no máximo 500 caracteres',
    }),
});

export const createBusinessSchema = Joi.object<CreateBusinessDto>({
  name: Joi.string()
    .min(2)
    .max(255)
    .trim()
    .required()
    .messages({
      'string.min': 'Nome da empresa deve ter pelo menos 2 caracteres',
      'string.max': 'Nome da empresa deve ter no máximo 255 caracteres',
      'any.required': 'Nome da empresa é obrigatório',
    }),
  document: Joi.string()
    .pattern(/^(\d{11}|\d{14})$/)
    .required()
    .messages({
      'string.pattern.base': 'Documento deve ser um CPF (11 dígitos) ou CNPJ (14 dígitos) válido',
      'any.required': 'Documento é obrigatório',
    }),
});

export const updateAccountSchema = Joi.object<UpdateAccountDto>({
  name: Joi.string()
    .min(2)
    .max(255)
    .trim()
    .optional()
    .messages({
      'string.min': 'Nome deve ter pelo menos 2 caracteres',
      'string.max': 'Nome deve ter no máximo 255 caracteres',
    }),
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .max(255)
    .optional()
    .messages({
      'string.email': 'Email deve ter um formato válido',
      'string.max': 'Email deve ter no máximo 255 caracteres',
    }),
  photoProfile: Joi.string()
    .max(500)
    .optional()
    .allow('', null)
    .messages({
      'string.max': 'Caminho da foto deve ter no máximo 500 caracteres',
    }),
  currentPassword: Joi.string()
    .optional()
    .messages({
      'string.base': 'Senha atual deve ser uma string',
    }),
  newPassword: Joi.string()
    .min(6)
    .max(128)
    .optional()
    .messages({
      'string.min': 'Nova senha deve ter pelo menos 6 caracteres',
      'string.max': 'Nova senha deve ter no máximo 128 caracteres',
    }),
});

export const changePasswordSchema = Joi.object<ChangePasswordDto>({
  currentPassword: Joi.string()
    .required()
    .messages({
      'any.required': 'Senha atual é obrigatória',
    }),
  newPassword: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.min': 'Nova senha deve ter pelo menos 8 caracteres',
      'string.max': 'Nova senha deve ter no máximo 128 caracteres',
      'string.pattern.base': 'Nova senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial',
      'any.required': 'Nova senha é obrigatória',
    }),
});

export const recoveryPasswordSchema = Joi.object<RecoveryPasswordDto>({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .max(255)
    .required()
    .messages({
      'string.email': 'Email deve ter um formato válido',
      'string.max': 'Email deve ter no máximo 255 caracteres',
      'any.required': 'Email é obrigatório',
    }),
});

export const updatePreferencesSchema = Joi.object<UpdatePreferencesDto>({
  theme: Joi.string()
    .valid('light', 'dark')
    .required()
    .messages({
      'any.only': 'Tema deve ser "light" ou "dark"',
      'any.required': 'Tema é obrigatório',
    }),
});

// Schema para paginação
export const paginationSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.base': 'Página deve ser um número',
      'number.integer': 'Página deve ser um número inteiro',
      'number.min': 'Página deve ser pelo menos 1',
    }),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10)
    .messages({
      'number.base': 'Limite deve ser um número',
      'number.integer': 'Limite deve ser um número inteiro',
      'number.min': 'Limite deve ser pelo menos 1',
      'number.max': 'Limite deve ser no máximo 100',
    }),
});

// Utilidades de validação

export interface ValidationResult<T> {
  data: T;
  error: null;
}

export interface ValidationError {
  data: null;
  error: {
    message: string;
    details: Array<{
      field: string;
      message: string;
    }>;
  };
}

export function validate<T>(
  schema: Joi.ObjectSchema<T>,
  data: unknown
): ValidationResult<T> | ValidationError {
  const result = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });

  if (result.error) {
    const details = result.error.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));

    return {
      data: null,
      error: {
        message: 'Dados inválidos',
        details,
      },
    };
  }

  return {
    data: result.value,
    error: null,
  };
}

// Validadores específicos

export function validateCPF(cpf: string): boolean {
  const cleanCPF = cpf.replace(/\D/g, '');
  
  if (cleanCPF.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  
  let digit = 11 - (sum % 11);
  if (digit === 10 || digit === 11) digit = 0;
  if (digit !== parseInt(cleanCPF.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  
  digit = 11 - (sum % 11);
  if (digit === 10 || digit === 11) digit = 0;
  
  return digit === parseInt(cleanCPF.charAt(10));
}

export function validateCNPJ(cnpj: string): boolean {
  const cleanCNPJ = cnpj.replace(/\D/g, '');
  
  if (cleanCNPJ.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false;

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * (weights1[i] || 0);
  }
  
  let digit = sum % 11;
  digit = digit < 2 ? 0 : 11 - digit;
  if (digit !== parseInt(cleanCNPJ.charAt(12))) return false;

  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * (weights2[i] || 0);
  }
  
  digit = sum % 11;
  digit = digit < 2 ? 0 : 11 - digit;
  
  return digit === parseInt(cleanCNPJ.charAt(13));
}

export function validateDocument(document: string): boolean {
  const cleanDocument = document.replace(/\D/g, '');
  
  if (cleanDocument.length === 11) {
    return validateCPF(cleanDocument);
  }
  
  if (cleanDocument.length === 14) {
    return validateCNPJ(cleanDocument);
  }
  
  return false;
}

// Sanitização de strings
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[<>]/g, '');
}

// Validação de URL de imagem
export function validateImageUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const validProtocols = ['http:', 'https:'];
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    
    if (!validProtocols.includes(urlObj.protocol)) {
      return false;
    }
    
    const pathname = urlObj.pathname.toLowerCase();
    return validExtensions.some(ext => pathname.endsWith(ext));
  } catch {
    return false;
  }
}
