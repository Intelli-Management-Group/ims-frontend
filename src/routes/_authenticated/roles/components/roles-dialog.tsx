import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import type { Role } from '@/types/api';
import { useRoleDialog, type RoleFormValues } from './useRoleDialog';

export type { RoleFormValues };

interface RoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: Role | null;
  isPending: boolean;
  onSubmit: (values: RoleFormValues) => void;
}

export function RoleDialog({ open, onOpenChange, role, isPending, onSubmit }: RoleDialogProps) {
  const { form, isEditing } = useRoleDialog({ role, onSubmit });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Role' : 'Add Role'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the role details below.'
              : 'Fill in the details to create a new role.'}
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
          <form.Field
            name="name"
            children={(field) => {
              const isInvalid = field.state.meta.isTouched && !!field.state.meta.errors.length;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Administrator"
                    aria-invalid={isInvalid}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          />

          <form.Field
            name="is_active"
            children={(field) => {
              const isInvalid = field.state.meta.isTouched && !!field.state.meta.errors.length;
              return (
                <Field
                  orientation="horizontal"
                  data-invalid={isInvalid}
                  className="items-center justify-between rounded-lg border p-3 shadow-sm"
                >
                  <FieldContent>
                    <FieldLabel htmlFor={field.name}>Active Status</FieldLabel>
                    <div className="text-sm text-muted-foreground">
                      Enable or disable this role
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
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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
