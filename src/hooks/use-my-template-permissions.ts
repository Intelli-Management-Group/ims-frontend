import { useQuery } from '@tanstack/react-query';
import { formTemplatesApi } from '@/api/form-templates';

export function useMyTemplatePermissions(
  templateId: number,
) {
  return useQuery({
    queryKey: ['my-template-permissions', templateId],

    queryFn: () =>
      formTemplatesApi.getMyTemplatePermissions(
        templateId,
      ),

    enabled: !!templateId,
  });
}