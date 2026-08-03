// import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
// import { formTemplatesApi } from '@/api/form-templates';
// import type {
//   TemplatePermissionAction,
//   TemplatePermissionSubject,
// } from '@/types/api';

// export function useTemplatePermissions(templateId: number) {
//   const queryClient = useQueryClient();

//   const permissionsQuery = useQuery({
//     queryKey: ['template-permissions', templateId],
//     queryFn: () =>
//       formTemplatesApi.getTemplatePermissions(templateId),
//     enabled: !!templateId,
//   });

//   const createPermission = useMutation({
//     mutationFn: (payload: {
//       action: TemplatePermissionAction;
//       permissible_type: TemplatePermissionSubject;
//       permissible_id: number;
//     }) =>
//       formTemplatesApi.createTemplatePermission(
//         templateId,
//         payload,
//       ),

//     onSuccess: () => {
//       queryClient.invalidateQueries({
//         queryKey: ['template-permissions', templateId],
//       });
//     },
//   });

//   const deletePermission = useMutation({
//     mutationFn: (permissionId: number) =>
//       formTemplatesApi.deleteTemplatePermission(
//         templateId,
//         permissionId,
//       ),

//     onSuccess: () => {
//       queryClient.invalidateQueries({
//         queryKey: ['template-permissions', templateId],
//       });
//     },
//   });

//   return {
//     permissions: permissionsQuery.data ?? [],
//     isLoading: permissionsQuery.isLoading,

//     createPermission,

//     deletePermission,

//     refetch: permissionsQuery.refetch,
//   };
// }

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formTemplatesApi } from '@/api/form-templates';
import type {
  FormTemplatePermission,
  TemplatePermissionAction,
  TemplatePermissionSubject,
} from '@/types/api';

export function useTemplatePermissions(templateId: number) {
  const queryClient = useQueryClient();

  const permissionsQuery = useQuery({
    queryKey: ['template-permissions', templateId],
    queryFn: () => formTemplatesApi.getTemplatePermissions(templateId),
    enabled: !!templateId,
  });

  const createPermission = useMutation({
    mutationFn: (payload: {
      action: TemplatePermissionAction;
      permissible_type: TemplatePermissionSubject;
      permissible_id: number;
    }) =>
      formTemplatesApi.createTemplatePermission(templateId, payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['template-permissions', templateId],
      });
    },
  });

  const deletePermission = useMutation({
    mutationFn: (permissionId: number) =>
      formTemplatesApi.deleteTemplatePermission(
        templateId,
        permissionId,
      ),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['template-permissions', templateId],
      });
    },
  });

  return {
    // 👇 unwrap the response
    permissions:
      (permissionsQuery.data?.data as FormTemplatePermission[]) ?? [],

    isLoading: permissionsQuery.isLoading,

    createPermission,
    deletePermission,

    refetch: permissionsQuery.refetch,
  };
}