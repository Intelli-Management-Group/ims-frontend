import apiClient from './client';
import type {
  FormTemplate,
  PaginatedResponse,
  FormTemplatePermission,
  MyTemplatePermissions,
  TemplatePermissionAction,
  TemplatePermissionSubject,
} from '../types/api';

export const formTemplatesApi = {
  getFormTemplates: async (params?: {
      page?: number;
      per_page?: number;
      search?: string;
      }) => {
      const { data } = await apiClient.get<PaginatedResponse<FormTemplate>>(
          '/form-templates',
          {
            params,
          },
        );
        return data;
      },

  getFormTemplate: async (id: number) => {
    const { data } = await apiClient.get<{ data: FormTemplate }>(
        `/form-templates/${id}`,
  );

    return data.data;
  },

  createFormTemplate: async (payload: {
    name: string;
    json_schema: Record<string, unknown>;
    ui_schema: Record<string, unknown>;
    is_active?: boolean;
  }) => {
    const { data } = await apiClient.post<{ data: FormTemplate }>(
      '/form-templates',
      payload,
    );

    return data.data;
  },

  updateFormTemplate: async (
    id: number,
    payload: {
      name?: string;
      json_schema?: Record<string, unknown>;
      ui_schema?: Record<string, unknown>;
      is_active?: boolean;
      version_number: number;
    },
  ) => {
    const { data } = await apiClient.put<{ data: FormTemplate }>(
      `/form-templates/${id}`,
      payload,
    );

    return data.data;
  },

  getTemplatePermissions: async (templateId: number) => {
    const { data } = await apiClient.get<{
      data: FormTemplatePermission[];
    }>(`/form-templates/${templateId}/permissions`);

    return data;
  },

  createTemplatePermission: async (
    templateId: number,
    payload: {
      action: TemplatePermissionAction;
      permissible_type: TemplatePermissionSubject;
      permissible_id: number;
    },
  ) => {
    const { data } = await apiClient.post<{
      data: FormTemplatePermission;
    }>(
      `/form-templates/${templateId}/permissions`,
      payload,
    );

    return data;
  },

  deleteTemplatePermission: async (
    templateId: number,
    permissionId: number,
  ) => {
    await apiClient.delete(
      `/form-templates/${templateId}/permissions/${permissionId}`,
    );
  },

  getMyTemplatePermissions: async (templateId: number) => {
    const { data } = await apiClient.get<MyTemplatePermissions>(
      `/form-templates/${templateId}/my-permissions`,
    );

    return data;
  },
};