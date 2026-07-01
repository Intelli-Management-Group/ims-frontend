import { useForm } from '@tanstack/react-form';
import * as z from 'zod';
import type { Role } from '@/types/api';

export const roleSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  is_active: z.boolean(),
});

export type RoleFormValues = z.infer<typeof roleSchema>;

interface UseRoleDialogArgs {
  role: Role | null;
  onSubmit: (values: RoleFormValues) => void;
}

export function useRoleDialog({ role, onSubmit }: UseRoleDialogArgs) {
  const isEditing = !!role;

  const form = useForm({
    defaultValues: {
      name: role?.name ?? '',
      is_active: role?.is_active ?? true,
    } as RoleFormValues,
    validators: {
      onSubmit: roleSchema,
    },
    onSubmit: async ({ value }) => {
      onSubmit(value);
    },
  });

  return { form, isEditing };
}
