export type BadgeVariant = 'default' | 'secondary';

export interface StatusStyle {
  variant: BadgeVariant;
  classes: string;
  label: string;
}

/**
 * Resolves the badge variant, color classes, and display label for a given
 * active/inactive state.
 */
export function getStatusStyle(isActive: boolean): StatusStyle {
  return isActive
    ? {
        variant: 'default',
        classes: 'bg-green-100 text-green-800 hover:bg-green-200',
        label: 'Active',
      }
    : {
        variant: 'secondary',
        classes: 'bg-red-100 text-red-800 hover:bg-red-200',
        label: 'Inactive',
      };
}