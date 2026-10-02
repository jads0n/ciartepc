import React from 'react';

interface ClassifiedCardProps {
  children: React.ReactNode;
  title?: string;
  badge?: string;
  badgeVariant?: 'classified' | 'complete' | 'amber' | 'neutral';
  className?: string;
  showGridLines?: boolean;
}

export function ClassifiedCard({
  children,
  title,
  badge,
  badgeVariant = 'classified',
  className = '',
  showGridLines = true,
}: ClassifiedCardProps) {
  const badgeStyles = {
    classified: 'bg-turing-red/20 text-turing-red border-turing-red/60',
    complete: 'bg-turing-green/20 text-turing-green border-turing-green/60',
    amber: 'bg-turing-amber/20 text-turing-amber border-turing-amber/60',
    neutral: 'bg-archive-700 text-archive-paper border-archive-600',
  };

  return (
    <div
      className={`relative bg-archive-850 border border-archive-700 rounded-sm p-4 sm:p-5 shadow-md overflow-hidden ${className}`}
    >
      {/* Marcador de grade militar nos cantos */}
      {showGridLines && (
        <>
          <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-archive-500" />
          <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-archive-500" />
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-archive-500" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-archive-500" />
        </>
      )}

      {/* Cabeçalho do Cartão Confidencial */}
      {(title || badge) && (
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-archive-800 gap-2">
          {title && (
            <h3 className="font-mono text-xs uppercase tracking-wider text-archive-muted truncate">
              {title}
            </h3>
          )}
          {badge && (
            <span
              className={`font-mono text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 border rounded-xs shrink-0 select-none ${badgeStyles[badgeVariant]}`}
            >
              {badge}
            </span>
          )}
        </div>
      )}

      {children}
    </div>
  );
}
