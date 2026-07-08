import { createFileRoute, Outlet } from '@tanstack/react-router';
import Form from '@rjsf/shadcn';
import validator from '@rjsf/validator-ajv8';
import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useSubmissionDetailPage } from './useSubmissionDetailPage';

export const Route = createFileRoute('/_authenticated/submissions/$submissionId')({
  component: SubmissionDetailPage,
});

function SubmissionDetailPage() {
  const { submissionId } = Route.useParams();
  const { isEditRoute, submission, isLoading, goBack } = useSubmissionDetailPage(submissionId);

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
          <Button variant="ghost" size="sm" onClick={goBack} className="-ml-2">
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
