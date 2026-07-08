import { useNavigate, redirect } from '@tanstack/react-router';
import { useForm } from '@tanstack/react-form';
import { useState } from 'react';
import * as z from 'zod';
import { useAuth } from '../lib/auth';
import { authApi } from '../api/auth';
import { toast } from 'sonner';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export function loginBeforeLoad() {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');

    if (token) {
      throw redirect({ to: '/' });
    }
  }
}

export function useLoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    } satisfies LoginFormValues,

    validators: {
      onSubmit: loginSchema,
    },

    onSubmit: async ({ value }) => {
      setIsLoading(true);

      try {
        const response = await authApi.login(value);
        await Promise.resolve(login(response.access_token));
        toast.success('Logged in successfully');
        await navigate({
          to: '/',
          replace: true,
        });
      } catch (error: any) {
        const message =
          error?.response?.data?.error ??
          error?.response?.data?.message ??
          error?.message ??
          'Invalid credentials';

        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    },
  });

  return { form, isLoading };
}