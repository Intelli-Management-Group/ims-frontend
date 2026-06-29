import { createFileRoute } from '@tanstack/react-router';
import { useForm, type AnyFieldApi } from '@tanstack/react-form';
import * as z from 'zod';
import { authApi } from '@/api/auth';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';

const passwordSchema = z
  .object({
    current_password: z.string().min(1, 'Current password is required'),
    password: z.string().min(6, 'New password must be at least 6 characters'),
    password_confirmation: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Passwords don't match",
    path: ['password_confirmation'],
  });

type PasswordFormValues = z.infer<typeof passwordSchema>;

export const Route = createFileRoute('/_authenticated/settings/')({
  component: SettingsPage,
});

// ─── Reusable password field ────────────────────────────────────────────────

interface PasswordFieldProps {
  field: AnyFieldApi;
  label: string;
}

function PasswordField({ field, label }: PasswordFieldProps) {
  const isInvalid = field.state.meta.isTouched && !!field.state.meta.errors.length;
  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Input
        id={field.name}
        name={field.name}
        type="password"
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        placeholder="••••••••"
        aria-invalid={isInvalid}
      />
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

function SettingsPage() {
  const mutation = useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: () => {
      toast.success('Password changed successfully');
      form.reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to change password');
    },
  });

  const form = useForm({
    defaultValues: {
      current_password: '',
      password: '',
      password_confirmation: '',
    } as PasswordFormValues,
    validators: {
      onSubmit: passwordSchema,
    },
    onSubmit: async ({ value }) => {
      mutation.mutate(value);
    },
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Manage your account settings and preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your password to keep your account secure.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="space-y-4"
          >
            <form.Field
              name="current_password"
              children={(field) => <PasswordField field={field} label="Current Password" />}
            />
            <form.Field
              name="password"
              children={(field) => <PasswordField field={field} label="New Password" />}
            />
            <form.Field
              name="password_confirmation"
              children={(field) => <PasswordField field={field} label="Confirm New Password" />}
            />

            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Updating...' : 'Change Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
