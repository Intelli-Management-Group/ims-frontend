import apiClient from './client';
import type { FormTemplate, PaginatedResponse } from '../types/api';

export const formTemplatesApi = {
  getFormTemplates: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
  }) => {
    const { data } = await apiClient.get<PaginatedResponse<FormTemplate>>('/form-templates', {
      params,
    });
    return data;
  },

  getFormTemplate: async (id: number) => {
    const { data } = await apiClient.get<{ data: FormTemplate }>(`/form-templates/${id}`);
    return data.data;
  },

  createFormTemplate: async (payload: {
    name: string;
    json_schema: Record<string, unknown>;
    ui_schema: Record<string, unknown>;
    is_active?: boolean;
  }) => {
    const { data } = await apiClient.post<FormTemplate>('/form-templates', payload);
    return data;
  },

  updateFormTemplate: async (
    id: number,
    payload: {
      name?: string;
      json_schema?: Record<string, unknown>;
      ui_schema?: Record<string, unknown>;
      is_active?: boolean;
    },
  ) => {
    const { data } = await apiClient.put<{ data: FormTemplate }>(`/form-templates/${id}`, payload);
    return data.data;
  },
};
