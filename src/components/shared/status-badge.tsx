import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getStatusStyle } from './status-badge.utils';

interface StatusBadgeProps {
  isActive: boolean;
  className?: string;
}

export function StatusBadge({ isActive, className }: StatusBadgeProps) {
  const { variant, classes, label } = getStatusStyle(isActive);

  return (
    <Badge variant={variant} className={cn('font-medium', classes, className)}>
      {label}
    </Badge>
  );
}