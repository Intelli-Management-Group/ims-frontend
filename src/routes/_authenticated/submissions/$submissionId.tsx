import { createFileRoute, Outlet, useNavigate, useRouterState } from '@tanstack/react-router';
import Form from '@rjsf/shadcn';
import validator from '@rjsf/validator-ajv8';
import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { formSubmissionsApi } from '@/api/form-submissions';
import { useBreadcrumb } from '@/hooks/use-breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export const Route = createFileRoute('/_authenticated/submissions/$submissionId')({
  component: SubmissionDetailPage,
});

function SubmissionDetailPage() {
  const isEditRoute = useRouterState({
    select: (state) => state.location.pathname.endsWith('/edit'),
  });

  const { submissionId } = Route.useParams();
  const navigate = useNavigate();
  const { setBreadcrumbs } = useBreadcrumb();

  const numericId = Number(submissionId);
  const isValidId = submissionId !== '' && Number.isFinite(numericId);

  const {
    data: submission,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['form-submission', numericId],
    queryFn: () => formSubmissionsApi.getFormSubmission(numericId),
    enabled: isValidId && !isEditRoute,
    retry: false,
  });

  useEffect(() => {
    if (!isValidId) {
      toast.error('Invalid submission ID');
      navigate({ to: '/submissions' });
    }
  }, [isValidId, navigate]);

  useEffect(() => {
    if (isError) {
      toast.error('Failed to load submission');
      navigate({ to: '/submissions' });
    }
  }, [isError, navigate]);

  useEffect(() => {
    if (!isEditRoute && submission) {
      setBreadcrumbs([
        { label: 'Submissions', path: '/submissions' },
        {
          label: submission.template?.name ?? `Submission #${submission.id}`,
          path: `/submissions/${submission.id}`,
        },
      ]);
    }
    return () => setBreadcrumbs(null);
  }, [submission, setBreadcrumbs, isEditRoute]);

  if (isEditRoute) {
    return <Outlet />;
  }

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
      </div>
    );
  }

  if (!submission || !submission.template || !submission.current_version) {
    return null;
  }

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
          <h2 className="text-2xl font-bold tracking-tight">
            {submission.current_version.form_name}
          </h2>
        </div>
        <p className="text-muted-foreground text-sm">
          Template: {submission.template.name} — Version {submission.current_version.version_number}
          {submission.current_version.user?.name &&
            ` — submitted by ${submission.current_version.user.name}`}
        </p>
      </div>

      <div className="rjsf-container">
        <Form
          schema={submission.template.json_schema as RJSFSchema}
          uiSchema={submission.template.ui_schema as UiSchema}
          formData={submission.current_version.content}
          validator={validator}
          disabled
          readonly
        >
          <div />
        </Form>
      </div>
    </div>
  );
}