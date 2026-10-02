import React from 'react';

interface TerminalButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export function TerminalButton({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  disabled,
  ...props
}: TerminalButtonProps) {
  const baseStyles =
    'relative inline-flex items-center justify-center font-mono font-medium tracking-wide uppercase transition-all duration-200 border rounded-sm disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-6 py-3.5 gap-3 font-semibold shadow-lg',
  };

  const variantStyles = {
    primary:
      'bg-turing-amber text-archive-950 border-turing-amber hover:bg-amber-400 hover:border-amber-400 hover:shadow-[0_0_15px_rgba(245,158,11,0.3)]',
    secondary:
      'bg-archive-800 text-archive-paper border-archive-600 hover:border-archive-500 hover:bg-archive-700',
    danger:
      'bg-turing-red/20 text-turing-red border-turing-red/50 hover:bg-turing-red/30 hover:border-turing-red',
    ghost:
      'bg-transparent text-archive-muted border-transparent hover:text-archive-paper hover:bg-archive-800/50',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
