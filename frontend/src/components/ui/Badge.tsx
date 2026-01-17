import { badgeStyles } from '../../utils/styles';

interface BadgeProps {
  children: React.ReactNode;
  variant?: keyof typeof badgeStyles;
  className?: string;
}

export default function Badge({ children, variant = 'draft', className = '' }: BadgeProps) {
  const baseStyles = badgeStyles[variant];
  const combinedClassName = `px-2 py-1 rounded-full text-xs font-medium ${baseStyles} ${className}`.trim();

  return (
    <span className={combinedClassName}>
      {children}
    </span>
  );
}
