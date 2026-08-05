import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { formTemplatesApi } from '@/api/form-templates';
import apiClient from '@/api/client';
import type { FormTemplatePermission, MyTemplatePermissions } from '@/types/api';

// ---- Mocks -----------------------------------------------------------

vi.mock('@/api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

// ---- getTemplatePermissions --------------------------------------------

describe('formTemplatesApi.getTemplatePermissions', () => {
  it('GETs the permissions endpoint for the given template', async () => {
    const responseBody = { data: [{ id: 1 } as FormTemplatePermission] };
    vi.mocked(apiClient.get).mockResolvedValue({ data: responseBody });

    const result = await formTemplatesApi.getTemplatePermissions(5);

    expect(apiClient.get).toHaveBeenCalledWith('/form-templates/5/permissions');
    expect(apiClient.get).toHaveBeenCalledTimes(1);
    // Returns the full response body (i.e. the { data: [...] } envelope),
    // unlike getFormTemplate which unwraps `.data.data`.
    expect(result).toEqual(responseBody);
  });

  it('logs and rethrows when the request fails', async () => {
    const error = new Error('network down');
    vi.mocked(apiClient.get).mockRejectedValue(error);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(formTemplatesApi.getTemplatePermissions(5)).rejects.toThrow('network down');

    expect(consoleSpy).toHaveBeenCalledWith('Permission API Error:', error);

    consoleSpy.mockRestore();
  });
});

// ---- createTemplatePermission -------------------------------------------

describe('formTemplatesApi.createTemplatePermission', () => {
  it('POSTs the payload to the permissions endpoint and returns the created permission', async () => {
    const created: FormTemplatePermission = {
      id: 99,
      action: 'view',
      permissible_type: 'role',
      permissible_id: 1,
    } as FormTemplatePermission;
    vi.mocked(apiClient.post).mockResolvedValue({ data: created });

    const payload = {
      action: 'view' as const,
      permissible_type: 'role' as const,
      permissible_id: 1,
    };

    const result = await formTemplatesApi.createTemplatePermission(5, payload);

    expect(apiClient.post).toHaveBeenCalledWith('/form-templates/5/permissions', payload);
    expect(result).toEqual(created);
  });

  it('propagates errors from the API client without swallowing them', async () => {
    const error = new Error('validation failed');
    vi.mocked(apiClient.post).mockRejectedValue(error);

    await expect(
      formTemplatesApi.createTemplatePermission(5, {
        action: 'edit',
        permissible_type: 'team',
        permissible_id: 3,
      }),
    ).rejects.toThrow('validation failed');
  });
});

// ---- deleteTemplatePermission --------------------------------------------

describe('formTemplatesApi.deleteTemplatePermission', () => {
  it('DELETEs the permission at the correct nested endpoint', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({ data: undefined });

    const result = await formTemplatesApi.deleteTemplatePermission(5, 42);

    expect(apiClient.delete).toHaveBeenCalledWith('/form-templates/5/permissions/42');
    expect(result).toBeUndefined();
  });

  it('propagates errors from the API client', async () => {
    const error = new Error('forbidden');
    vi.mocked(apiClient.delete).mockRejectedValue(error);

    await expect(formTemplatesApi.deleteTemplatePermission(5, 42)).rejects.toThrow('forbidden');
  });
});

// ---- getMyTemplatePermissions --------------------------------------------

describe('formTemplatesApi.getMyTemplatePermissions', () => {
  it('GETs the my-permissions endpoint for the given template', async () => {
    const myPermissions: MyTemplatePermissions = {
      view: true,
      create: false,
      edit: true,
    } as MyTemplatePermissions;
    vi.mocked(apiClient.get).mockResolvedValue({ data: myPermissions });

    const result = await formTemplatesApi.getMyTemplatePermissions(5);

    expect(apiClient.get).toHaveBeenCalledWith('/form-templates/5/my-permissions');
    expect(result).toEqual(myPermissions);
  });

  it('propagates errors from the API client', async () => {
    const error = new Error('network down');
    vi.mocked(apiClient.get).mockRejectedValue(error);

    await expect(formTemplatesApi.getMyTemplatePermissions(5)).rejects.toThrow('network down');
  });
});
