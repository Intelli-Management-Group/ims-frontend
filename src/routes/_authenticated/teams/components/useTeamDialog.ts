import { useForm } from '@tanstack/react-form';
import * as z from 'zod';
import type { Team } from '@/types/api';

export const teamSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  department_id: z.string().min(1, 'Department is required'),
  is_active: z.boolean(),
});

export type TeamFormValues = z.infer<typeof teamSchema>;

interface UseTeamDialogArgs {
  team: Team | null;
  onSubmit: (values: TeamFormValues) => void;
}

export function useTeamDialog({ team, onSubmit }: UseTeamDialogArgs) {
  const isEditing = !!team;

  const form = useForm({
    defaultValues: {
      name: team?.name ?? '',
      department_id: team?.department_id?.toString() ?? '',
      is_active: team?.is_active ?? true,
    } as TeamFormValues,
    validators: {
      onSubmit: teamSchema,
    },
    onSubmit: async ({ value }) => {
      onSubmit(value);
    },
  });

  return { form, isEditing };
}
