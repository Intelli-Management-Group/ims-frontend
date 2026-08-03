import { createFileRoute, useNavigate } from '@tanstack/react-router';
import Form from '@rjsf/shadcn';
import validator from '@rjsf/validator-ajv8';
import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSubmissionEditPage } from './useSubmissionEditPage';
import { useSubmissionEditForm, type SubmissionWithTemplate } from './useSubmissionEditForm';

export const Route = createFileRoute('/_authenticated/submissions/$submissionId/edit')({
  component: SubmissionEditPage,
});

function SubmissionEditForm({
  submission,
  onSave,
  isSubmitting,
}: {
  submission: SubmissionWithTemplate;
  onSave: (payload: {
    formName: string;
    content: Record<string, unknown>;
    versionNumber: number;
  }) => void;
  isSubmitting: boolean;
}) {
  const navigate = useNavigate();
  const { formName, formNameError, handleFormNameChange, handleSubmit } = useSubmissionEditForm({
    submission,
    onSave,
  });

  const template = submission.template;
  const schema = template.json_schema as RJSFSchema;
  const uiSchema = template.ui_schema as UiSchema;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: '/submissions' })}
            className="-ml-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl font-bold tracking-tight">{template.name}</h2>
        </div>
        <p className="text-muted-foreground text-sm">
          Update the form below and save your changes.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="editFormName" className="gap-0.5">
          Form Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="editFormName"
          value={formName}
          onChange={(e) => handleFormNameChange(e.target.value)}
          placeholder="Enter form name"
          disabled={isSubmitting}
          aria-invalid={formNameError}
          required
          form="edit-submission-form"
        />
        {formNameError && <p className="text-destructive text-sm">Form name is required.</p>}
      </div>

      <div className="rjsf-container">
        <Form
          id="edit-submission-form"
          schema={schema}
          uiSchema={uiSchema}
          formData={submission.current_version.content}
          validator={validator}
          onSubmit={handleSubmit}
          disabled={isSubmitting}
          omitExtraData
          focusOnFirstError
        >
          <div className="pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save changes'}
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}

function SubmissionEditPage() {
  const { submissionId } = Route.useParams();
  const { submission, isLoading, canEdit, isSubmitting, updateSubmission } =
    useSubmissionEditPage(submissionId);

  if (isLoading) {
    return (
      <div className="max-w-2xl space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
    );
  }

  if (!submission?.template || !submission.current_version || !canEdit) {
    return null;
  }

  const ready = submission as SubmissionWithTemplate;

  return (
    <SubmissionEditForm
      key={ready.current_version.id}
      submission={ready}
      isSubmitting={isSubmitting}
      onSave={(payload) => updateSubmission(payload)}
    />
  );
}
