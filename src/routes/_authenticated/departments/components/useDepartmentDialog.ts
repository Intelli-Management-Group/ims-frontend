import { useForm } from '@tanstack/react-form';
import * as z from 'zod';
import type { Department } from '@/types/api';

export const departmentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  is_active: z.boolean(),
});

export type DepartmentFormValues = z.infer<typeof departmentSchema>;

interface UseDepartmentDialogArgs {
  department: Department | null;
  onSubmit: (values: DepartmentFormValues) => void;
}

export function useDepartmentDialog({ department, onSubmit }: UseDepartmentDialogArgs) {
  const isEditing = !!department;

  const form = useForm({
    defaultValues: {
      name: department?.name ?? '',
      is_active: department?.is_active ?? true,
    } as DepartmentFormValues,
    validators: {
      onSubmit: departmentSchema,
    },
    onSubmit: async ({ value }) => {
      onSubmit(value);
    },
  });

  // Reset form when dialog opens with new department context
  // (caller should close+reopen the dialog to trigger a fresh mount)

  return { form, isEditing };
}