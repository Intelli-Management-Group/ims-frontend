import type { AnyFieldApi } from '@tanstack/react-form';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

interface PasswordFieldProps {
  field: AnyFieldApi;
  label: string;
}

export function PasswordField({ field, label }: PasswordFieldProps) {
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
