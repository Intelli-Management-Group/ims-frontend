import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import axios from 'axios';

import { usePermissionsPanel } from './usePermissionsPanel';
import { rolesApi } from '@/api/roles';
import { departmentsApi } from '@/api/departments';
import { teamsApi } from '@/api/teams';
import { useTemplatePermissions } from '@/hooks/use-template-permissions';
import type { FormTemplatePermission } from '@/types/api';

// ---- Mocks -----------------------------------------------------------

vi.mock('@/api/roles', () => ({
  rolesApi: { getRoles: vi.fn() },
}));

vi.mock('@/api/departments', () => ({
  departmentsApi: { getDepartments: vi.fn() },
}));

vi.mock('@/api/teams', () => ({
  teamsApi: { getTeams: vi.fn() },
}));

vi.mock('@/hooks/use-template-permissions', () => ({
  useTemplatePermissions: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// ---- Fixtures ----------------------------------------------------------

const ROLES = [
  { id: 1, name: 'Admin' },
  { id: 2, name: 'Editor' },
];
const DEPARTMENTS = [{ id: 10, name: 'Engineering' }];
const TEAMS = [{ id: 100, name: 'Platform Team' }];

function makePermission(
  overrides: Partial<FormTemplatePermission> = {},
): FormTemplatePermission {
  return {
    id: 1,
    action: 'view',
    permissible_type: 'role',
    permissible_id: 1,
    ...overrides,
  } as FormTemplatePermission;
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

type MockUseTemplatePermissionsOverrides = Partial<{
  permissions: ReturnType<typeof useTemplatePermissions>['permissions'];
  isLoading: boolean;
  createPermission: {
    mutateAsync: (...args: any[]) => Promise<unknown>;
    isPending: boolean;
  };
  deletePermission: {
    mutateAsync: (...args: any[]) => Promise<unknown>;
    isPending: boolean;
  };
}>;

function mockUseTemplatePermissions(overrides: MockUseTemplatePermissionsOverrides = {}) {
  const createMutateAsync = vi.fn().mockResolvedValue(undefined);
  const deleteMutateAsync = vi.fn().mockResolvedValue(undefined);

  const value = {
    permissions: [],
    isLoading: false,
    createPermission: { mutateAsync: createMutateAsync, isPending: false },
    deletePermission: { mutateAsync: deleteMutateAsync, isPending: false },
    ...overrides,
  };

  vi.mocked(useTemplatePermissions).mockReturnValue(value as unknown as ReturnType<typeof useTemplatePermissions>);
  return { createMutateAsync, deleteMutateAsync };
}

beforeEach(() => {
  vi.clearAllMocks();

  vi.mocked(rolesApi.getRoles).mockResolvedValue({ data: ROLES } as any);
  vi.mocked(departmentsApi.getDepartments).mockResolvedValue({ data: DEPARTMENTS } as any);
  vi.mocked(teamsApi.getTeams).mockResolvedValue({ data: TEAMS } as any);

  mockUseTemplatePermissions();
});

// ---- Tests -----------------------------------------------------------

describe('usePermissionsPanel', () => {
  describe('enabled / disabled state', () => {
    it('is disabled when templateId is null and does not fetch subject lists', async () => {
      const { result } = renderHook(() => usePermissionsPanel(null), {
        wrapper: createWrapper(),
      });

      expect(result.current.enabled).toBe(false);
      expect(rolesApi.getRoles).not.toHaveBeenCalled();
      expect(departmentsApi.getDepartments).not.toHaveBeenCalled();
      expect(teamsApi.getTeams).not.toHaveBeenCalled();
    });

    it('is enabled and fetches subject lists when templateId is provided', async () => {
      const { result } = renderHook(() => usePermissionsPanel(5), {
        wrapper: createWrapper(),
      });

      expect(result.current.enabled).toBe(true);

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(rolesApi.getRoles).toHaveBeenCalledWith({ per_page: 100 });
      expect(departmentsApi.getDepartments).toHaveBeenCalledWith({ per_page: 100 });
      expect(teamsApi.getTeams).toHaveBeenCalledWith({ per_page: 100 });
      expect(useTemplatePermissions).toHaveBeenCalledWith(5);
    });

    it('calls useTemplatePermissions with 0 when templateId is null', () => {
      renderHook(() => usePermissionsPanel(null), { wrapper: createWrapper() });
      expect(useTemplatePermissions).toHaveBeenCalledWith(0);
    });
  });

  describe('loading aggregation', () => {
    it('is loading while permissions are loading even if subject lists resolved', async () => {
      mockUseTemplatePermissions({ isLoading: true });

      const { result } = renderHook(() => usePermissionsPanel(1), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(rolesApi.getRoles).toHaveBeenCalled();
      });

      expect(result.current.isLoading).toBe(true);
    });

    it('is not loading once permissions and subject lists have resolved', async () => {
      const { result } = renderHook(() => usePermissionsPanel(1), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));
    });
  });

  describe('subjectOptions', () => {
    it('defaults to role options', async () => {
      const { result } = renderHook(() => usePermissionsPanel(1), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.subjectType).toBe('role');
      expect(result.current.subjectOptions).toEqual([
        { id: 1, name: 'Admin' },
        { id: 2, name: 'Editor' },
      ]);
    });

    it('switches to department options and resets subjectId', async () => {
      const { result } = renderHook(() => usePermissionsPanel(1), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      act(() => result.current.setSubjectId('1'));
      expect(result.current.subjectId).toBe('1');

      act(() => result.current.handleSubjectTypeChange('department'));

      expect(result.current.subjectType).toBe('department');
      expect(result.current.subjectId).toBe('');
      expect(result.current.subjectOptions).toEqual([{ id: 10, name: 'Engineering' }]);
    });

    it('switches to team options', async () => {
      const { result } = renderHook(() => usePermissionsPanel(1), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      act(() => result.current.handleSubjectTypeChange('team'));

      expect(result.current.subjectOptions).toEqual([{ id: 100, name: 'Platform Team' }]);
    });
  });

  describe('grants', () => {
    it('maps permissions to grant rows with resolved subject names, sorted by action', async () => {
      mockUseTemplatePermissions({
        permissions: [
          makePermission({ id: 1, action: 'edit', permissible_type: 'role', permissible_id: 1 }),
          makePermission({ id: 2, action: 'create', permissible_type: 'department', permissible_id: 10 }),
          makePermission({ id: 3, action: 'view', permissible_type: 'team', permissible_id: 100 }),
        ],
      });

      const { result } = renderHook(() => usePermissionsPanel(1), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.grants.map((g) => g.action)).toEqual(['create', 'edit', 'view']);
      expect(result.current.grants.map((g) => g.subjectName)).toEqual([
        'Engineering',
        'Admin',
        'Platform Team',
      ]);
    });

    it('falls back to a placeholder name when the subject cannot be resolved', async () => {
      mockUseTemplatePermissions({
        permissions: [
          makePermission({ id: 1, action: 'view', permissible_type: 'role', permissible_id: 999 }),
        ],
      });

      const { result } = renderHook(() => usePermissionsPanel(1), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.grants[0].subjectName).toBe('Role #999');
    });
  });

  describe('openActions', () => {
    it('lists all actions as open when there are no permissions', async () => {
      const { result } = renderHook(() => usePermissionsPanel(1), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.openActions).toEqual(['view', 'create', 'edit']);
    });

    it('excludes actions that already have at least one grant', async () => {
      mockUseTemplatePermissions({
        permissions: [makePermission({ action: 'view' })],
      });

      const { result } = renderHook(() => usePermissionsPanel(1), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.openActions).toEqual(['create', 'edit']);
    });
  });

  describe('toggleAction / canSubmitGrant', () => {
    it('adds and removes actions from the selection', async () => {
      const { result } = renderHook(() => usePermissionsPanel(1), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      act(() => result.current.toggleAction('view', true));
      expect(result.current.selectedActions).toEqual(['view']);

      act(() => result.current.toggleAction('edit', true));
      expect(result.current.selectedActions).toEqual(['view', 'edit']);

      act(() => result.current.toggleAction('view', false));
      expect(result.current.selectedActions).toEqual(['edit']);
    });

    it('is not submittable without a subject or without any selected actions', async () => {
      const { result } = renderHook(() => usePermissionsPanel(1), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.canSubmitGrant).toBe(false);

      act(() => result.current.toggleAction('view', true));
      expect(result.current.canSubmitGrant).toBe(false); // no subject yet

      act(() => result.current.setSubjectId('1'));
      expect(result.current.canSubmitGrant).toBe(true);
    });
  });

  describe('handleGrant', () => {
    it('creates a permission per selected action and resets the form on success', async () => {
      const { createMutateAsync } = mockUseTemplatePermissions();

      const { result } = renderHook(() => usePermissionsPanel(1), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      act(() => result.current.setSubjectId('1'));
      act(() => result.current.toggleAction('view', true));
      act(() => result.current.toggleAction('edit', true));

      await act(async () => {
        await result.current.handleGrant();
      });

      expect(createMutateAsync).toHaveBeenCalledTimes(2);
      expect(createMutateAsync).toHaveBeenCalledWith({
        action: 'view',
        permissible_type: 'role',
        permissible_id: 1,
      });
      expect(createMutateAsync).toHaveBeenCalledWith({
        action: 'edit',
        permissible_type: 'role',
        permissible_id: 1,
      });

      expect(toast.success).toHaveBeenCalledWith('Permissions granted');
      expect(result.current.subjectId).toBe('');
      expect(result.current.selectedActions).toEqual([]);
    });

    it('uses singular success copy when only one action is granted', async () => {
      mockUseTemplatePermissions();

      const { result } = renderHook(() => usePermissionsPanel(1), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      act(() => result.current.setSubjectId('1'));
      act(() => result.current.toggleAction('view', true));

      await act(async () => {
        await result.current.handleGrant();
      });

      expect(toast.success).toHaveBeenCalledWith('Permission granted');
    });

    it('does nothing when the form cannot be submitted', async () => {
      const { createMutateAsync } = mockUseTemplatePermissions();

      const { result } = renderHook(() => usePermissionsPanel(1), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.handleGrant();
      });

      expect(createMutateAsync).not.toHaveBeenCalled();
    });

    it('does nothing when disabled (no templateId)', async () => {
      const { createMutateAsync } = mockUseTemplatePermissions();

      const { result } = renderHook(() => usePermissionsPanel(null), {
        wrapper: createWrapper(),
      });

      act(() => result.current.setSubjectId('1'));
      act(() => result.current.toggleAction('view', true));

      await act(async () => {
        await result.current.handleGrant();
      });

      expect(createMutateAsync).not.toHaveBeenCalled();
    });

    it('shows a server validation message on failure and keeps the form populated', async () => {
      const createMutateAsync = vi.fn().mockRejectedValue({
        isAxiosError: true,
        response: { data: { errors: { action: ['Action is already granted'] } } },
      });
      mockUseTemplatePermissions({
        createPermission: { mutateAsync: createMutateAsync, isPending: false },
      });
      vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      const { result } = renderHook(() => usePermissionsPanel(1), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      act(() => result.current.setSubjectId('1'));
      act(() => result.current.toggleAction('view', true));

      await act(async () => {
        await result.current.handleGrant();
      });

      expect(toast.error).toHaveBeenCalledWith('Action is already granted');
      // Form is left populated so the user can correct and retry.
      expect(result.current.subjectId).toBe('1');
      expect(result.current.selectedActions).toEqual(['view']);
    });

    it('falls back to a generic message when the error has no usable payload', async () => {
      const createMutateAsync = vi.fn().mockRejectedValue(new Error('network down'));
      mockUseTemplatePermissions({
        createPermission: { mutateAsync: createMutateAsync, isPending: false },
      });
      vi.spyOn(axios, 'isAxiosError').mockReturnValue(false);

      const { result } = renderHook(() => usePermissionsPanel(1), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      act(() => result.current.setSubjectId('1'));
      act(() => result.current.toggleAction('view', true));

      await act(async () => {
        await result.current.handleGrant();
      });

      expect(toast.error).toHaveBeenCalledWith('Failed to grant permission');
    });

    it('reflects isGranting from the underlying mutation', async () => {
      mockUseTemplatePermissions({
        createPermission: { mutateAsync: vi.fn(), isPending: true },
      });

      const { result } = renderHook(() => usePermissionsPanel(1), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(rolesApi.getRoles).toHaveBeenCalled());

      expect(result.current.isGranting).toBe(true);
    });
  });

  describe('revoke flow', () => {
    it('stages a permission for revoke and allows cancelling', async () => {
      const permission = makePermission();
      const { result } = renderHook(() => usePermissionsPanel(1), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      act(() => result.current.requestRevoke(permission));
      expect(result.current.pendingRevoke).toEqual(permission);

      act(() => result.current.cancelRevoke());
      expect(result.current.pendingRevoke).toBeNull();
    });

    it('deletes the pending permission and clears it on confirm', async () => {
      const permission = makePermission({ id: 42 });
      const { deleteMutateAsync } = mockUseTemplatePermissions();

      const { result } = renderHook(() => usePermissionsPanel(1), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      act(() => result.current.requestRevoke(permission));

      await act(async () => {
        await result.current.confirmRevoke();
      });

      expect(deleteMutateAsync).toHaveBeenCalledWith(42);
      expect(toast.success).toHaveBeenCalledWith('Permission revoked');
      expect(result.current.pendingRevoke).toBeNull();
    });

    it('does nothing on confirm when there is no pending revoke', async () => {
      const { deleteMutateAsync } = mockUseTemplatePermissions();

      const { result } = renderHook(() => usePermissionsPanel(1), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.confirmRevoke();
      });

      expect(deleteMutateAsync).not.toHaveBeenCalled();
    });

    it('shows an error toast and still clears pendingRevoke when deletion fails', async () => {
      const permission = makePermission({ id: 42 });
      const deleteMutateAsync = vi.fn().mockRejectedValue(new Error('boom'));
      mockUseTemplatePermissions({
        deletePermission: { mutateAsync: deleteMutateAsync, isPending: false },
      });
      vi.spyOn(axios, 'isAxiosError').mockReturnValue(false);

      const { result } = renderHook(() => usePermissionsPanel(1), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      act(() => result.current.requestRevoke(permission));

      await act(async () => {
        await result.current.confirmRevoke();
      });

      expect(toast.error).toHaveBeenCalledWith('Failed to revoke permission');
      expect(result.current.pendingRevoke).toBeNull();
    });

    it('reflects isRevoking from the underlying mutation', async () => {
      mockUseTemplatePermissions({
        deletePermission: { mutateAsync: vi.fn(), isPending: true },
      });

      const { result } = renderHook(() => usePermissionsPanel(1), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(rolesApi.getRoles).toHaveBeenCalled());

      expect(result.current.isRevoking).toBe(true);
    });
  });
});
