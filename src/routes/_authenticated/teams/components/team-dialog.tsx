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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Department, Team } from '@/types/api';

const teamSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  department_id: z.string().min(1, 'Department is required'),
  is_active: z.boolean(),
});

export type TeamFormValues = z.infer<typeof teamSchema>;

interface TeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: Team | null;
  departments: Department[];
  isPending: boolean;
  onSubmit: (values: TeamFormValues) => void;
}

export function TeamDialog({
  open,
  onOpenChange,
  team,
  departments,
  isPending,
  onSubmit,
}: TeamDialogProps) {
  const isEditing = !!team;

  const form = useForm({
    defaultValues: {
      name: team?.name ?? '',
      department_id: team?.department_id?.toString() ?? '',
      is_active: team?.is_active ?? true,
    } as TeamFormValues,
    validators: {
      onSubmit: teamSchema,
    },
    onSubmit: async ({ value }) => {
      onSubmit(value);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Team' : 'Add Team'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the team details below.'
              : 'Fill in the details to create a new team.'}
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
                    placeholder="Frontend Team"
                    aria-invalid={isInvalid}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          />

          <form.Field
            name="department_id"
            children={(field) => {
              const isInvalid = field.state.meta.isTouched && !!field.state.meta.errors.length;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Department</FieldLabel>
                  <Select
                    name={field.name}
                    value={field.state.value}
                    onValueChange={field.handleChange}
                  >
                    <SelectTrigger id={field.name} aria-invalid={isInvalid}>
                      <SelectValue placeholder="Select a department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id.toString()}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      Enable or disable this team
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
