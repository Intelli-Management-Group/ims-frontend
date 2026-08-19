import { createFileRoute, useNavigate } from '@tanstack/react-router';
import Form from '@rjsf/shadcn';
import validator from '@rjsf/validator-ajv8';
import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { RjsfMultiSelectWidget } from '@/components/form-builder/rjsf-multi-select-widget';
import { getPriorityFieldKey } from '@/lib/priority-field';
// Priority is now a builder field; the priority picker was removed from this page

import { useSubmissionEditForm, type SubmissionWithTemplate } from './useSubmissionEditForm';
import { useSubmissionEditPage } from './useSubmissionEditPage';

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
    priority?: string | null;
  }) => void;
  isSubmitting: boolean;
}) {
  const navigate = useNavigate();

  const {
    formName,
    formNameError,
    handleFormNameChange,
    handleSubmit,
  } = useSubmissionEditForm({
    submission,
    onSave,
  });

  const template = submission.template;
  const schema = template.json_schema as RJSFSchema;
  const uiSchema = template.ui_schema as UiSchema;

 const content = Array.isArray(submission.current_version.content)
    ? {}
    : submission.current_version.content;

  const priorityFieldKey = getPriorityFieldKey(schema as Record<string, unknown>);

  const formData = {
    ...content,
    ...(priorityFieldKey && submission.priority
      ? {
          [priorityFieldKey]: submission.priority,
        }
      : {}),
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
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

          <h2 className="text-2xl font-bold tracking-tight">
            {template.name}
          </h2>
        </div>

        <p className="text-muted-foreground text-sm">
          Update the form below and save your changes.
        </p>
      </div>

      {/* Form Name + Priority */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Form Name */}
        <div className="space-y-2">
          <Label htmlFor="form-name">
            Form Name
          </Label>

          <Input
            id="form-name"
            value={formName}
            onChange={(event) =>
              handleFormNameChange(event.target.value)
            }
            disabled={isSubmitting}
            aria-invalid={formNameError}
            aria-describedby={
              formNameError ? 'form-name-error' : undefined
            }
          />

          {formNameError && (
            <p
              id="form-name-error"
              className="text-destructive text-sm"
            >
              Please enter a form name
            </p>
          )}
        </div>

        {/* priority picker removed — rendered via template schema when present */}
      </div>

      {/* Dynamic RJSF Form */}
      <div className="rjsf-container">
        <Form
          id="edit-submission-form"
          schema={schema}
          uiSchema={uiSchema}
          formData={formData}
          validator={validator}
          onSubmit={handleSubmit}
          disabled={isSubmitting}
          omitExtraData
          focusOnFirstError
          widgets={{
            multiSelect: RjsfMultiSelectWidget,
          }}
          // widgets={{ multiSelect: RjsfMultiSelectWidget }}
        >
          <div className="pt-2">
            <Button
              type="submit"
              disabled={isSubmitting}
            >
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

  const {
    submission,
    isLoading,
    isSubmitting,
    updateSubmission,
  } = useSubmissionEditPage(submissionId);

  if (isLoading) {
    return (
      <div className="max-w-2xl space-y-6">
        <Skeleton className="h-8 w-64" />

        <Skeleton className="h-4 w-96" />

        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="space-y-2"
            >
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>

        <Skeleton className="h-10 w-32" />
      </div>
    );
  }

  if (!submission?.template || !submission.current_version) {
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