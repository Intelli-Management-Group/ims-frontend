import { useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { formSubmissionsApi } from '@/api/form-submissions';
import { useBreadcrumb } from '@/hooks/use-breadcrumb';

export function useSubmissionEditPage(submissionId: string) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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
    enabled: isValidId,
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
      priority,
    }: {
      formName: string;
      content: Record<string, unknown>;
      versionNumber: number;
      priority?: string | null;
    }) =>
      formSubmissionsApi.updateFormSubmission(numericId, {
        form_name: formName,
        content,
        version_number: versionNumber,
        // Presence matters, not truthiness: the resolved priority (string or
        // null) always reflects the submission's intended priority, so the
        // key must always be included. Omitting it when the value happens to
        // be null would be interpreted by the API as "leave unchanged"
        // instead of "clear the priority".
        priority,
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

  return { submission, isLoading, isSubmitting, updateSubmission };
}