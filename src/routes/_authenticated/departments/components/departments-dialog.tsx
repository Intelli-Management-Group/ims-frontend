import { useForm } from '@tanstack/react-form';
import * as z from 'zod';
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
import type { Department } from '@/types/api';

const departmentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  is_active: z.boolean(),
});

export type DepartmentFormValues = z.infer<typeof departmentSchema>;

interface DepartmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department: Department | null;
  isPending: boolean;
  onSubmit: (values: DepartmentFormValues) => void;
}

export function DepartmentDialog({
  open,
  onOpenChange,
  department,
  isPending,
  onSubmit,
}: DepartmentDialogProps) {
  const isEditing = !!department;

  const form = useForm({
    defaultValues: {
      name: department?.name ?? '',
      is_active: department?.is_active ?? true,
    } as DepartmentFormValues,
    validators: {
      onSubmit: departmentSchema,
    },
    onSubmit: async ({ value }) => {
      onSubmit(value);
    },
  });

  // Reset form when dialog opens with new department context
  // (caller should close+reopen the dialog to trigger a fresh mount)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Department' : 'Add Department'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the department details below.'
              : 'Fill in the details to create a new department.'}
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
                    placeholder="Engineering"
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
                      Enable or disable this department
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
