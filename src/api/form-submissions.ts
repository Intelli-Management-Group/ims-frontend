import apiClient from "./client";
import type { FormSubmission, PaginatedResponse } from "../types/api";

export const formSubmissionsApi = {
  getFormSubmissions: async (params?: {
    page?: number;
    per_page?: number;
    form_template_id?: number;
    priority?: string;
  }) => {
    const { data } = await apiClient.get<PaginatedResponse<FormSubmission>>(
      "/form-submissions",
      {
        params,
      },
    );
    return data;
  },

  getFormSubmission: async (id: number) => {
    const { data } = await apiClient.get<{ data: FormSubmission }>(
      `/form-submissions/${id}`,
    );
    return data.data;
  },

  createFormSubmission: async (payload: {
    form_template_id: number;
    form_template_version_id: number;
    form_name: string;
    content: Record<string, unknown>;
    priority?: string;
  }) => {
    const { data } = await apiClient.post<{ data: FormSubmission }>(
      "/form-submissions",
      payload,
    );
    return data.data;
  },

  updateFormSubmission: async (
    id: number,
    payload: {
      form_name: string;
      content: Record<string, unknown>;
      version_number: number;
      priority?: string;
    },
  ) => {
    const { data } = await apiClient.put<{ data: FormSubmission }>(
      `/form-submissions/${id}`,
      payload,
    );
    return data.data;
  },
};
