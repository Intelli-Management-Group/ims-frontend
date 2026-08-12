import { useForm } from '@tanstack/react-form';
import * as z from 'zod';
import { authApi } from '@/api/auth';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';

export const passwordSchema = z
  .object({
    current_password: z.string().min(1, 'Current password is required'),
    password: z.string().min(6, 'New password must be at least 6 characters'),
    password_confirmation: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Passwords don't match",
    path: ['password_confirmation'],
  });

export type PasswordFormValues = z.infer<typeof passwordSchema>;

export function useSettingsPage() {
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

  return { form, isPending: mutation.isPending };
}
