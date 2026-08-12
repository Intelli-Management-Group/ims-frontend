import { useForm, useStore } from '@tanstack/react-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/api/users';
import { toast } from 'sonner';
import * as z from 'zod';
import type { Team, User } from '@/types/api';

// ---------------------------------------------------------------------------
// Schema & types
// ---------------------------------------------------------------------------

export const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .optional()
    .or(z.literal('')),
  department_ids: z.array(z.number()),
  team_ids: z.array(z.number()),
  is_active: z.boolean(),
  role_id: z.number().nullable(),
});

export type UserFormValues = z.infer<typeof userSchema>;

const DEFAULT_VALUES: UserFormValues = {
  name: '',
  email: '',
  password: '',
  department_ids: [],
  team_ids: [],
  is_active: true,
  role_id: null,
};

interface UseUserDialogArgs {
  editingUser?: User | null;
  teams: Team[];
  onOpenChange: (open: boolean) => void;
}

export function useUserDialog({ editingUser, teams, onOpenChange }: UseUserDialogArgs) {
  const queryClient = useQueryClient();
  const isEditing = !!editingUser;

  // Build initial values from the user being edited (or defaults for create).
  const initialValues: UserFormValues = editingUser
    ? {
        name: editingUser.name,
        email: editingUser.email,
        password: '',
        department_ids: editingUser.departments?.map((d) => d.id) ?? [],
        team_ids: editingUser.teams?.map((t) => t.id) ?? [],
        is_active: !!editingUser.is_active,
        role_id: editingUser.role?.id ?? null,
      }
    : DEFAULT_VALUES;

  // -------------------------------------------------------------------------
  // Mutations
  // -------------------------------------------------------------------------

  const createMutation = useMutation({
    mutationFn: (values: UserFormValues) => usersApi.createUser(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User created successfully');
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create user');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UserFormValues }) =>
      usersApi.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User updated successfully');
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update user');
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  // -------------------------------------------------------------------------
  // Form
  // -------------------------------------------------------------------------

  const form = useForm({
    defaultValues: initialValues,
    validators: { onSubmit: userSchema },
    onSubmit: async ({ value }) => {
      const payload: UserFormValues = { ...value };

      // Omit password when editing and the field was left blank so the
      // backend's `sometimes` rule ignores it.
      if (isEditing && !payload.password) {
        delete payload.password;
      }

      if (isEditing && editingUser) {
        updateMutation.mutate({ id: editingUser.id, data: payload });
      } else {
        createMutation.mutate(payload);
      }
    },
  });

  // Reactive department selection — used to filter the teams list.
  const selectedDepartmentIds = useStore(
    form.store,
    (state) => state.values.department_ids,
  );

  const filteredTeams = selectedDepartmentIds.length
    ? teams.filter((t) => selectedDepartmentIds.includes(t.department_id))
    : teams;

  return { form, isEditing, isPending, filteredTeams };
}
