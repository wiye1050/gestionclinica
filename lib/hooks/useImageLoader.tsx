/* eslint-disable @next/next/no-img-element */
import { useState, useEffect } from 'react';

/**
 * Hook para lazy loading de imágenes con placeholder
 */
export function useImageLoader(src: string, placeholder?: string) {
  const [imageSrc, setImageSrc] = useState(placeholder || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const img = new Image();
    
    img.onload = () => {
      setImageSrc(src);
      setLoading(false);
    };

    img.onerror = () => {
      setError(true);
      setLoading(false);
    };

    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  return { imageSrc, loading, error };
}

/**
 * Componente de imagen optimizada con lazy loading
 */
interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
}

export function OptimizedImage({ 
  src, 
  alt, 
  className = '', 
  placeholder 
}: OptimizedImageProps) {
  const { imageSrc, loading, error } = useImageLoader(src, placeholder);

  if (error) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
        <span className="text-gray-400 text-sm">Error al cargar</span>
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={`${className} ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
      loading="lazy"
    />
  );
}
