import { ButtonHTMLAttributes, ReactNode } from 'react';
import { buttonStyles } from '../../utils/styles';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'icon';
  children: ReactNode;
  isLoading?: boolean;
}

export default function Button({
  variant = 'primary',
  children,
  isLoading = false,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles = buttonStyles[variant];
  const combinedClassName = `${baseStyles} ${className}`.trim();

  return (
    <button
      className={combinedClassName}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <span className="animate-spin">⏳</span>
          <span>Loading...</span>
        </span>
      ) : (
        <span className="flex items-center gap-2">{children}</span>
      )}
    </button>
  );
}
