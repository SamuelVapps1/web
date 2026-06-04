import Image from 'next/image';
import { Image as ImageIcon } from 'lucide-react';

interface PhotoProps {
  src?: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  placeholder?: string;
}

export default function Photo({ 
  src, 
  alt, 
  width, 
  height, 
  className = '', 
  priority = false,
  placeholder = 'Fotka pribudne'
}: PhotoProps) {
  if (!src) {
    return (
      <div
        className={`photo-placeholder ${className}`}
        style={width && height ? { aspectRatio: `${width} / ${height}` } : undefined}
      >
        <ImageIcon aria-hidden="true" />
        {placeholder ? <span>{placeholder}</span> : null}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width || 800}
      height={height || 600}
      className={className}
      priority={priority}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    />
  );
}
