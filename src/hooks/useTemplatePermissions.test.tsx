import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useTemplatePermissions } from '@/hooks/use-template-permissions';
import { formTemplatesApi } from '@/api/form-templates';
import type { FormTemplatePermission } from '@/types/api';

// ---- Mocks -----------------------------------------------------------

vi.mock('@/api/form-templates', () => ({
  formTemplatesApi: {
    getTemplatePermissions: vi.fn(),
    createTemplatePermission: vi.fn(),
    deleteTemplatePermission: vi.fn(),
  },
}));

// ---- Fixtures ----------------------------------------------------------

function makePermission(overrides: Partial<FormTemplatePermission> = {}): FormTemplatePermission {
  return {
    id: 1,
    action: 'view',
    permissible_type: 'role',
    permissible_id: 1,
    ...overrides,
  } as FormTemplatePermission;
}

// ---- Test harness --------------------------------------------------------

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { wrapper, queryClient };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ---- Tests -----------------------------------------------------------

describe('useTemplatePermissions', () => {
  describe('fetching permissions', () => {
    it('does not fetch when templateId is falsy (0)', () => {
      const { wrapper } = createWrapper();

      renderHook(() => useTemplatePermissions(0), { wrapper });

      expect(formTemplatesApi.getTemplatePermissions).not.toHaveBeenCalled();
    });

    it('fetches permissions for the given templateId when truthy', async () => {
      vi.mocked(formTemplatesApi.getTemplatePermissions).mockResolvedValue({
        data: [makePermission()],
      } as any);
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useTemplatePermissions(5), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(formTemplatesApi.getTemplatePermissions).toHaveBeenCalledWith(5);
      expect(result.current.permissions).toEqual([makePermission()]);
    });

    it('unwraps permissions from the { data } envelope', async () => {
      const permissions = [makePermission({ id: 1 }), makePermission({ id: 2, action: 'edit' })];
      vi.mocked(formTemplatesApi.getTemplatePermissions).mockResolvedValue({
        data: permissions,
      } as any);
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useTemplatePermissions(5), { wrapper });

      await waitFor(() => expect(result.current.permissions).toHaveLength(2));

      expect(result.current.permissions).toEqual(permissions);
    });

    it('defaults permissions to an empty array before data resolves and if data is missing', async () => {
      vi.mocked(formTemplatesApi.getTemplatePermissions).mockResolvedValue({} as any);
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useTemplatePermissions(5), { wrapper });

      // Before resolution
      expect(result.current.permissions).toEqual([]);

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // After resolution, still empty since response had no `data` field
      expect(result.current.permissions).toEqual([]);
    });

    it('reflects the query loading state', async () => {
      vi.mocked(formTemplatesApi.getTemplatePermissions).mockResolvedValue({
        data: [],
      } as any);
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useTemplatePermissions(5), { wrapper });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => expect(result.current.isLoading).toBe(false));
    });

    it('exposes refetch from the underlying query', async () => {
      vi.mocked(formTemplatesApi.getTemplatePermissions).mockResolvedValue({
        data: [],
      } as any);
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useTemplatePermissions(5), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      vi.mocked(formTemplatesApi.getTemplatePermissions).mockClear();

      await act(async () => {
        await result.current.refetch();
      });

      expect(formTemplatesApi.getTemplatePermissions).toHaveBeenCalledWith(5);
    });
  });

  describe('createPermission', () => {
    it('calls the API with templateId and the payload', async () => {
      vi.mocked(formTemplatesApi.getTemplatePermissions).mockResolvedValue({
        data: [],
      } as any);
      vi.mocked(formTemplatesApi.createTemplatePermission).mockResolvedValue(
        makePermission() as any,
      );
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useTemplatePermissions(5), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const payload = {
        action: 'view' as const,
        permissible_type: 'role' as const,
        permissible_id: 1,
      };

      await act(async () => {
        await result.current.createPermission.mutateAsync(payload);
      });

      expect(formTemplatesApi.createTemplatePermission).toHaveBeenCalledWith(5, payload);
    });

    it('invalidates the permissions query on success, triggering a refetch', async () => {
      vi.mocked(formTemplatesApi.getTemplatePermissions).mockResolvedValue({
        data: [],
      } as any);
      vi.mocked(formTemplatesApi.createTemplatePermission).mockResolvedValue(
        makePermission() as any,
      );
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useTemplatePermissions(5), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(formTemplatesApi.getTemplatePermissions).toHaveBeenCalledTimes(1);

      await act(async () => {
        await result.current.createPermission.mutateAsync({
          action: 'create',
          permissible_type: 'department',
          permissible_id: 10,
        });
      });

      await waitFor(() =>
        expect(formTemplatesApi.getTemplatePermissions).toHaveBeenCalledTimes(2),
      );
    });

    it('does not invalidate the query when the mutation fails', async () => {
      vi.mocked(formTemplatesApi.getTemplatePermissions).mockResolvedValue({
        data: [],
      } as any);
      vi.mocked(formTemplatesApi.createTemplatePermission).mockRejectedValue(
        new Error('failed'),
      );
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useTemplatePermissions(5), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(formTemplatesApi.getTemplatePermissions).toHaveBeenCalledTimes(1);

      await act(async () => {
        await expect(
          result.current.createPermission.mutateAsync({
            action: 'view',
            permissible_type: 'role',
            permissible_id: 1,
          }),
        ).rejects.toThrow('failed');
      });

      expect(formTemplatesApi.getTemplatePermissions).toHaveBeenCalledTimes(1);
    });

    it('exposes isPending while the mutation is in flight', async () => {
      vi.mocked(formTemplatesApi.getTemplatePermissions).mockResolvedValue({
        data: [],
      } as any);
      let resolveCreate!: (value: unknown) => void;
      vi.mocked(formTemplatesApi.createTemplatePermission).mockReturnValue(
        new Promise((resolve) => {
          resolveCreate = resolve;
        }) as any,
      );
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useTemplatePermissions(5), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.createPermission.isPending).toBe(false);

      let mutatePromise: Promise<unknown>;
      act(() => {
        mutatePromise = result.current.createPermission.mutateAsync({
          action: 'view',
          permissible_type: 'role',
          permissible_id: 1,
        });
      });

      await waitFor(() => expect(result.current.createPermission.isPending).toBe(true));

      await act(async () => {
        resolveCreate(makePermission());
        await mutatePromise;
      });

      await waitFor(() => expect(result.current.createPermission.isPending).toBe(false));
    });
  });

  describe('deletePermission', () => {
    it('calls the API with templateId and permissionId', async () => {
      vi.mocked(formTemplatesApi.getTemplatePermissions).mockResolvedValue({
        data: [],
      } as any);
      vi.mocked(formTemplatesApi.deleteTemplatePermission).mockResolvedValue(undefined as any);
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useTemplatePermissions(5), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.deletePermission.mutateAsync(42);
      });

      expect(formTemplatesApi.deleteTemplatePermission).toHaveBeenCalledWith(5, 42);
    });

    it('invalidates the permissions query on success, triggering a refetch', async () => {
      vi.mocked(formTemplatesApi.getTemplatePermissions).mockResolvedValue({
        data: [makePermission({ id: 42 })],
      } as any);
      vi.mocked(formTemplatesApi.deleteTemplatePermission).mockResolvedValue(undefined as any);
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useTemplatePermissions(5), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(formTemplatesApi.getTemplatePermissions).toHaveBeenCalledTimes(1);

      await act(async () => {
        await result.current.deletePermission.mutateAsync(42);
      });

      await waitFor(() =>
        expect(formTemplatesApi.getTemplatePermissions).toHaveBeenCalledTimes(2),
      );
    });

    it('does not invalidate the query when the mutation fails', async () => {
      vi.mocked(formTemplatesApi.getTemplatePermissions).mockResolvedValue({
        data: [],
      } as any);
      vi.mocked(formTemplatesApi.deleteTemplatePermission).mockRejectedValue(
        new Error('failed'),
      );
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useTemplatePermissions(5), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(formTemplatesApi.getTemplatePermissions).toHaveBeenCalledTimes(1);

      await act(async () => {
        await expect(result.current.deletePermission.mutateAsync(42)).rejects.toThrow('failed');
      });

      expect(formTemplatesApi.getTemplatePermissions).toHaveBeenCalledTimes(1);
    });

    it('exposes isPending while the mutation is in flight', async () => {
      vi.mocked(formTemplatesApi.getTemplatePermissions).mockResolvedValue({
        data: [],
      } as any);
      let resolveDelete!: (value: unknown) => void;
      vi.mocked(formTemplatesApi.deleteTemplatePermission).mockReturnValue(
        new Promise((resolve) => {
          resolveDelete = resolve;
        }) as any,
      );
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useTemplatePermissions(5), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.deletePermission.isPending).toBe(false);

      let mutatePromise: Promise<unknown>;
      act(() => {
        mutatePromise = result.current.deletePermission.mutateAsync(42);
      });

      await waitFor(() => expect(result.current.deletePermission.isPending).toBe(true));

      await act(async () => {
        resolveDelete(undefined);
        await mutatePromise;
      });

      await waitFor(() => expect(result.current.deletePermission.isPending).toBe(false));
    });
  });

  describe('query key isolation between templates', () => {
    it('caches permissions separately per templateId', async () => {
      vi.mocked(formTemplatesApi.getTemplatePermissions).mockImplementation((id: number) =>
        Promise.resolve({ data: [makePermission({ id, permissible_id: id })] }) as any,
      );
      const { wrapper } = createWrapper();

      const { result: resultA } = renderHook(() => useTemplatePermissions(1), { wrapper });
      const { result: resultB } = renderHook(() => useTemplatePermissions(2), { wrapper });

      await waitFor(() => expect(resultA.current.isLoading).toBe(false));
      await waitFor(() => expect(resultB.current.isLoading).toBe(false));

      expect(resultA.current.permissions[0].id).toBe(1);
      expect(resultB.current.permissions[0].id).toBe(2);
    });
  });
});
