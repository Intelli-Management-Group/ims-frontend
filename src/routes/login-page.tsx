import type { AnyFieldApi } from '@tanstack/react-form';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLoginForm } from './useLoginForm';

interface LoginTextFieldProps {
  field: AnyFieldApi;
  label: string;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
}

/** Small presentational helper so email/password markup isn't duplicated. */
function LoginTextField({ field, label, type = 'text', placeholder, disabled }: LoginTextFieldProps) {
  const isInvalid = !!field.state.meta.errors.length;

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Input
        id={field.name}
        name={field.name}
        type={type}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={isInvalid}
      />
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}

export function LoginPage() {
  const { form, isLoading } = useLoginForm();

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">IMS Login</CardTitle>
          <CardDescription>
            Enter your email and password to access the admin panel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              void form.handleSubmit();
            }} 
            className="space-y-4">
            <form.Field
              name="email"
              children={(field) => (
                <LoginTextField
                  field={field}
                  label="Email"
                  placeholder="admin@example.com"
                  disabled={isLoading}
                />
              )}
            />
            <form.Field
              name="password"
              children={(field) => (
                <LoginTextField
                  field={field}
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
