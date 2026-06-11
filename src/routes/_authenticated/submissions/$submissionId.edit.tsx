import { createFileRoute, useNavigate } from '@tanstack/react-router';
import Form from '@rjsf/shadcn';
import validator from '@rjsf/validator-ajv8';
import type { IChangeEvent } from '@rjsf/core';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { formSubmissionsApi } from '@/api/form-submissions';
import { useBreadcrumb } from '@/hooks/use-breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { FormSubmission, FormSubmissionVersion, FormTemplate } from '@/types/api';

export const Route = createFileRoute('/_authenticated/submissions/$submissionId/edit')({
  component: SubmissionEditPage,
});

type SubmissionWithTemplate = FormSubmission & {
  template: FormTemplate;
  current_version: FormSubmissionVersion;
};

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
  const current = submission.current_version;

  const [formName, setFormName] = useState(current.form_name);
  const [formData, setFormData] = useState<Record<string, unknown>>(() => ({
    ...current.content,
  }));
  const [versionNumber] = useState(current.version_number);

  const template = submission.template;
  const schema = template.json_schema as Record<string, unknown>;
  const uiSchema = template.ui_schema as Record<string, unknown>;

  const handleSubmit = ({ formData: nextData }: IChangeEvent) => {
    if (nextData !== undefined) {
      onSave({
        formName,
        content: nextData as Record<string, unknown>,
        versionNumber,
      });
    }
  };

  const handleChange = ({ formData: nextData }: IChangeEvent) => {
    if (nextData !== undefined) {
      setFormData(nextData as Record<string, unknown>);
    }
  };

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
          onChange={(e) => setFormName(e.target.value)}
          placeholder="Enter form name"
          disabled={isSubmitting}
          required
          form="edit-submission-form"
        />
      </div>

      <div className="rjsf-container">
        <Form
          id="edit-submission-form"
          schema={schema}
          uiSchema={uiSchema}
          formData={formData}
          validator={validator}
          onChange={handleChange}
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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setBreadcrumbs } = useBreadcrumb();

  const numericId = Number(submissionId);

  const {
    data: submission,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['form-submission', numericId],
    queryFn: () => formSubmissionsApi.getFormSubmission(numericId),
    enabled: !!numericId,
    retry: false,
  });

  useEffect(() => {
    if (!numericId) {
      toast.error('Invalid submission ID');
      navigate({ to: '/submissions' });
    }
  }, [numericId, navigate]);

  useEffect(() => {
    if (isError) {
      toast.error('Failed to load submission');
      navigate({ to: '/submissions' });
    }
  }, [isError, navigate]);

  useEffect(() => {
    if (submission?.current_version && submission.template) {
      setBreadcrumbs([
        { label: 'Submissions', path: '/submissions' },
        {
          label: `Edit: ${submission.current_version.form_name}`,
          path: `/submissions/${submission.id}/edit`,
        },
      ]);
    }
    return () => setBreadcrumbs(null);
  }, [submission, setBreadcrumbs]);

  const { mutate: updateSubmission, isPending: isSubmitting } = useMutation({
    mutationFn: ({
      formName,
      content,
      versionNumber,
    }: {
      formName: string;
      content: Record<string, unknown>;
      versionNumber: number;
    }) =>
      formSubmissionsApi.updateFormSubmission(numericId, {
        form_name: formName,
        content,
        version_number: versionNumber,
      }),
    onSuccess: () => {
      toast.success('Submission updated successfully');
      void queryClient.invalidateQueries({ queryKey: ['form-submissions'] });
      void queryClient.invalidateQueries({ queryKey: ['form-submission', numericId] });
      navigate({ to: '/submissions/$submissionId', params: { submissionId: String(numericId) } });
    },
    onError: (error) => {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        toast.error('This submission was updated elsewhere. Refresh the page and try again.');
        return;
      }
      toast.error('Failed to update submission');
    },
  });

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
