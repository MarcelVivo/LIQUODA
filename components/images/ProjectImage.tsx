import { Building2, Home, Sun, Gem } from 'lucide-react';
import type { AssetType } from '@/lib/projects/types';

const icons = { company: Building2, real_estate: Home, energy: Sun, collectible: Gem } as const;

/** Titelbild eines Projekts oder ein ruhiger Platzhalter mit Asset-Symbol, solange kein Bild vorliegt. */
export default function ProjectImage({
  url,
  alt,
  assetType,
  className = '',
  priority = false,
}: {
  url: string | null;
  alt: string;
  assetType: AssetType;
  className?: string;
  priority?: boolean;
}) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={alt} className={`h-full w-full object-cover ${className}`} loading={priority ? 'eager' : 'lazy'} />;
  }
  const Icon = icons[assetType] ?? Building2;
  return (
    <div className={`flex h-full w-full items-center justify-center bg-ink ${className}`} aria-hidden="true">
      <Icon size={40} className="text-onink-muted" strokeWidth={1.25} />
    </div>
  );
}
