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

type LoginFieldErrors = Partial<Record<keyof LoginFormValues, string>>;

function getLoginFieldErrors(value: LoginFormValues): LoginFieldErrors | null {
  const result = loginSchema.safeParse(value);

  if (result.success) {
    return null;
  }

  return result.error.issues.reduce<LoginFieldErrors>((errors, issue) => {
    const fieldName = issue.path[0];

    if (typeof fieldName === 'string' && !errors[fieldName as keyof LoginFormValues]) {
      errors[fieldName as keyof LoginFormValues] = issue.message;
    }

    return errors;
  }, {});
}

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
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    } satisfies LoginFormValues,

    onSubmit: async ({ value }) => {
      const validationErrors = getLoginFieldErrors(value);

      if (validationErrors) {
        setFieldErrors(validationErrors);
        return;
      }

      setFieldErrors({});
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

  return { form, isLoading, fieldErrors, handleSubmit: form.handleSubmit, };
}
