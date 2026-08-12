import { useNavigate, useRouterState } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { formSubmissionsApi } from '@/api/form-submissions';
import { useBreadcrumb } from '@/hooks/use-breadcrumb';

export function useSubmissionDetailPage(submissionId: string) {
  const isEditRoute = useRouterState({
    select: (state) => state.location.pathname.endsWith('/edit'),
  });

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

  const goBack = () => navigate({ to: '/submissions' });

  return { isEditRoute, submission, isLoading, goBack };
}
