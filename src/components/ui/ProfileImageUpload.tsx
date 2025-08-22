'use client';

import { useState, useRef } from 'react';
import { Camera, Upload, X, Loader2 } from 'lucide-react';

interface ProfileImageUploadProps {
  currentImage?: string;
  onImageChange: (imageUrl: string) => void;
  disabled?: boolean;
}

export function ProfileImageUpload({ currentImage, onImageChange, disabled = false }: ProfileImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Tipo de arquivo não permitido. Aceitos: JPEG, PNG, WebP');
      return;
    }

    // Validar tamanho (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert('Arquivo muito grande. Máximo: 5MB');
      return;
    }

    // Mostrar preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Fazer upload
    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    try {
      setIsUploading(true);

      const formData = new FormData();
      formData.append('file', file);

      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth-token='))
        ?.split('=')[1];

      const response = await fetch('/api/upload/profile', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao fazer upload');
      }

      const result = await response.json();
      
      if (result.success) {
        onImageChange(result.data.url);
        setPreviewImage(null);
      } else {
        throw new Error(result.error || 'Erro ao fazer upload');
      }

    } catch (error: any) {
      console.error('Upload error:', error);
      alert(`Erro ao fazer upload: ${error.message}`);
      setPreviewImage(null);
    } finally {
      setIsUploading(false);
      // Limpar o input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = () => {
    onImageChange('');
    setPreviewImage(null);
  };

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const displayImage = previewImage || currentImage;

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Área de preview/upload */}
      <div className="relative">
        <div
          onClick={handleClick}
          className={`relative w-32 h-32 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors overflow-hidden ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {displayImage ? (
            <>
              <img
                src={displayImage}
                alt="Preview"
                className="w-full h-full object-cover rounded-full"
              />
              {isUploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-full">
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                </div>
              )}
            </>
          ) : (
            <div className="text-center">
              {isUploading ? (
                <Loader2 className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-2" />
              ) : (
                <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              )}
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isUploading ? 'Enviando...' : 'Clique para enviar'}
              </p>
            </div>
          )}
        </div>

        {/* Botão de remover */}
        {displayImage && !isUploading && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRemoveImage();
            }}
            className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
            title="Remover imagem"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Input file oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {/* Informações */}
      <div className="text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Formatos aceitos: JPEG, PNG, WebP
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500">
          Tamanho máximo: 5MB
        </p>
      </div>

      {/* Botão alternativo */}
      {!displayImage && (
        <button
          onClick={handleClick}
          disabled={disabled || isUploading}
          className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
        >
          <Upload className="h-4 w-4 mr-2" />
          {isUploading ? 'Enviando...' : 'Escolher Arquivo'}
        </button>
      )}
    </div>
  );
}
