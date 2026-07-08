import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useForm } from '@tanstack/react-form';
import * as z from 'zod';
import { toast } from 'sonner';
import { useAuth } from '../lib/auth';
import { authApi } from '../api/auth';

export const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

/**
 * Encapsulates all login logic: form state/validation, submit handling,
 * auth side-effects, navigation, and toasts. The component that consumes
 * this hook only needs to render markup and wire up field props.
 */
export function useLoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    } as LoginFormValues,
    validators: {
      onSubmit: loginSchema,
    },
    onSubmit: async ({ value }) => {
      setIsLoading(true);
      try {
        const response = await authApi.login(value);
        login(response.access_token);
        toast.success('Logged in successfully');
        navigate({ to: '/' });
      } catch (error: any) {
        const message =
          error.response?.data?.error || error.response?.data?.message || 'Invalid credentials';
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    form.handleSubmit();
  };

  return { form, isLoading, handleSubmit };
}
