import { useForm, useStore } from '@tanstack/react-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/api/users';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Field, FieldContent, FieldError, FieldLabel } from '@/components/ui/field';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import * as z from 'zod';
import type { Department, Role, Team, User } from '@/types/api';

// ---------------------------------------------------------------------------
// Schema & types
// ---------------------------------------------------------------------------

const userSchema = z.object({
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

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pass a user to switch the dialog into edit mode; undefined = create mode. */
  editingUser?: User | null;
  departments: Department[];
  teams: Team[];
  roles: Role[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function UserDialog({
  open,
  onOpenChange,
  editingUser,
  departments,
  teams,
  roles,
}: UserDialogProps) {
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

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  console.log(initialValues);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit User' : 'Add User'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the user details below.'
              : 'Fill in the details to create a new user account.'}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          {/* Name & Email */}
          <div className="grid grid-cols-2 gap-4">
            <form.Field name="name">
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !!field.state.meta.errors.length;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="John Doe"
                      aria-invalid={isInvalid}
                    />
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                );
              }}
            </form.Field>

            <form.Field name="email">
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !!field.state.meta.errors.length;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="john@example.com"
                      aria-invalid={isInvalid}
                    />
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                );
              }}
            </form.Field>
          </div>

          {/* Password */}
          <form.Field name="password">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !!field.state.meta.errors.length;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>
                    {isEditing ? 'New Password (optional)' : 'Password'}
                  </FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="password"
                    value={field.state.value ?? ''}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="••••••••"
                    aria-invalid={isInvalid}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>

          {/* Departments & Teams */}
          <div className="grid grid-cols-2 gap-4">
            <form.Field name="department_ids">
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !!field.state.meta.errors.length;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel>Departments</FieldLabel>
                    <div className="max-h-[150px] overflow-y-auto rounded-lg border p-3 space-y-2">
                      {departments.map((dept) => (
                        <div key={dept.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`dept-${dept.id}`}
                            checked={field.state.value.includes(dept.id)}
                            onCheckedChange={(checked) => {
                              field.handleChange(
                                checked
                                  ? [...field.state.value, dept.id]
                                  : field.state.value.filter((id) => id !== dept.id),
                              );
                            }}
                          />
                          <label
                            htmlFor={`dept-${dept.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {dept.name}
                          </label>
                        </div>
                      ))}
                    </div>
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                );
              }}
            </form.Field>

            <form.Field name="team_ids">
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !!field.state.meta.errors.length;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel>Teams</FieldLabel>
                    <div className="max-h-[150px] overflow-y-auto rounded-lg border p-3 space-y-2">
                      {filteredTeams.map((team) => (
                        <div key={team.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`team-${team.id}`}
                            checked={field.state.value.includes(team.id)}
                            onCheckedChange={(checked) => {
                              field.handleChange(
                                checked
                                  ? [...field.state.value, team.id]
                                  : field.state.value.filter((id) => id !== team.id),
                              );
                            }}
                          />
                          <label
                            htmlFor={`team-${team.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {team.name}
                          </label>
                        </div>
                      ))}
                    </div>
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                );
              }}
            </form.Field>
          </div>

          {/* Role */}
          <form.Field name="role_id">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !!field.state.meta.errors.length;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel>Role</FieldLabel>
                  <Select
                    value={field.state.value != null ? String(field.state.value) : ''}
                    onValueChange={(v) =>
                      field.handleChange(v === '' ? null : Number(v))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={String(role.id)}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>

          {/* Active status */}
          <form.Field name="is_active">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !!field.state.meta.errors.length;
              return (
                <Field
                  orientation="horizontal"
                  data-invalid={isInvalid}
                  className="items-center justify-between rounded-lg border p-3 shadow-sm"
                >
                  <FieldContent>
                    <FieldLabel htmlFor={field.name}>Active Status</FieldLabel>
                    <div className="text-sm text-muted-foreground">
                      Enable or disable this user account
                    </div>
                  </FieldContent>
                  <Switch
                    id={field.name}
                    checked={field.state.value}
                    onCheckedChange={field.handleChange}
                    aria-invalid={isInvalid}
                  />
                </Field>
              );
            }}
          </form.Field>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isEditing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
