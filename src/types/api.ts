export interface User {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
  departments?: Department[];
  teams?: Team[];
  role?: Role | null;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: number;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: number;
  name: string;
  department_id: number;
  department?: Department | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface Role {
  id: number;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FormTemplateVersion {
  id: number;
  template_id: number;
  user_id: number | null;
  user?: User | null;
  name: string;
  json_schema: Record<string, unknown>;
  ui_schema: Record<string, unknown>;
  is_active: boolean;
  version_number: number;
  created_at: string;
  updated_at: string;
}

export interface FormTemplate {
  id: number;
  name: string;

  json_schema: Record<string, unknown>;
  ui_schema: Record<string, unknown>;

  is_active: boolean;

  created_by: number | null;
  creator?: User | null;

  // Optional because some API responses/tests don't include it
  current_version?: FormTemplateVersion | null;

  created_at: string;
  updated_at: string;
}

export interface FormSubmissionVersion {
  id: number;
  submission_id: number;

  user_id: number | null;
  user?: User | null;

  form_name: string;

  content: Record<string, unknown> | unknown[];

  version_number: number;

  created_at: string;
  updated_at: string;
}

export interface FormSubmission {
  id: number;

  form_template_id: number;

  current_version_id: number | null;

  template?: FormTemplate | null;

  template_version?: FormTemplateVersion | null;

  current_version?: FormSubmissionVersion | null;

  // API can return id or name depending on endpoint
  created_by?: string | number | null;

  priority?: string;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];

  links: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };

  meta: {
    current_page: number;
    from: number | null;
    last_page: number;

    links: {
      url: string | null;
      label: string;
      active: boolean;
    }[];

    path: string;

    per_page: number;

    to: number | null;

    total: number;
  };
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface AuthUser extends User {}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}