import { useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { formSubmissionsApi } from '@/api/form-submissions';
import { useBreadcrumb } from '@/hooks/use-breadcrumb';
import { useMyTemplatePermissions } from '@/hooks/use-my-template-permissions';

export function useSubmissionEditPage(submissionId: string) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setBreadcrumbs } = useBreadcrumb();

  const numericId = Number(submissionId);
  const isValidId = submissionId !== '' && Number.isFinite(numericId);

  const {
    data: submission,
    isLoading: isLoadingSubmission,
    isError,
  } = useQuery({
    queryKey: ['form-submission', numericId],
    queryFn: () => formSubmissionsApi.getFormSubmission(numericId),
    enabled: isValidId,
    retry: false,
  });

  const templateId = submission?.template?.id ?? 0;

  const {
    data: myPermissions,
    isLoading: isLoadingPermissions,
    isError: isPermissionsError,
  } = useMyTemplatePermissions(templateId);

  const canEdit = myPermissions?.data.permissions.edit ?? false;
  const isLoading = isLoadingSubmission || (!!templateId && isLoadingPermissions);

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
    if (!templateId || isLoadingPermissions) {
      return;
    }

    if (isPermissionsError) {
      toast.error("Unable to verify your permissions");
      navigate({
        to: "/submissions/$submissionId",
        params: { submissionId: String(numericId) },
      });
      return;
    }

    if (!canEdit) {
      toast.error("You don't have permission to edit this submission");
      navigate({
        to: "/submissions/$submissionId",
        params: { submissionId: String(numericId) },
      });
    }
  }, [templateId, isLoadingPermissions, isPermissionsError, canEdit, navigate, numericId]);

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

  return { submission, isLoading, canEdit, isSubmitting, updateSubmission };
}