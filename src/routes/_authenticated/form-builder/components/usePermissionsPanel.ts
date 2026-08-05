import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import axios from 'axios';
import { rolesApi } from '@/api/roles';
import { departmentsApi } from '@/api/departments';
import { teamsApi } from '@/api/teams';
import { useTemplatePermissions } from '@/hooks/use-template-permissions';
import type {
  FormTemplatePermission,
  TemplatePermissionAction,
  TemplatePermissionSubject,
} from '@/types/api';

export const PERMISSION_ACTIONS: TemplatePermissionAction[] = ['view', 'create', 'edit'];

export const PERMISSION_SUBJECTS: { value: TemplatePermissionSubject; label: string }[] = [
  { value: 'role', label: 'Role' },
  { value: 'department', label: 'Department' },
  { value: 'team', label: 'Team' },
];

export interface PermissionGrantRow extends FormTemplatePermission {
  subjectName: string;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const response = error.response?.data;
    if (response?.errors) {
      const first = Object.values(response.errors).flat()[0];
      if (first) return String(first);
    }
    if (response?.message) return response.message;
  }
  return fallback;
}

export function usePermissionsPanel(templateId: number | null) {
  const [subjectType, setSubjectType] = useState<TemplatePermissionSubject>('role');
  const [subjectId, setSubjectId] = useState<string>('');
  const [selectedActions, setSelectedActions] = useState<TemplatePermissionAction[]>([]);
  const [pendingRevoke, setPendingRevoke] = useState<FormTemplatePermission | null>(null);

  const enabled = templateId !== null;

  const { permissions, isLoading, createPermission, deletePermission } = useTemplatePermissions(
    templateId ?? 0,
  );
  
  const { data: rolesData, isLoading: isLoadingRoles } = useQuery({
    queryKey: ['roles-all'],
    queryFn: () => rolesApi.getRoles({ per_page: 100 }),
    enabled,
  });

  const { data: departmentsData, isLoading: isLoadingDepartments } = useQuery({
    queryKey: ['departments-all'],
    queryFn: () => departmentsApi.getDepartments({ per_page: 100 }),
    enabled,
  });

  const { data: teamsData, isLoading: isLoadingTeams } = useQuery({
    queryKey: ['teams-all'],
    queryFn: () => teamsApi.getTeams({ per_page: 100 }),
    enabled,
  });

  const roles = rolesData?.data ?? [];
  const departments = departmentsData?.data ?? [];
  const teams = teamsData?.data ?? [];

  const subjectOptions = useMemo(() => {
    if (subjectType === 'role') return roles.map((r) => ({ id: r.id, name: r.name }));
    if (subjectType === 'department') return departments.map((d) => ({ id: d.id, name: d.name }));
    return teams.map((t) => ({ id: t.id, name: t.name }));
  }, [subjectType, roles, departments, teams]);

  const isLoadingSubjects = isLoadingRoles || isLoadingDepartments || isLoadingTeams;

  const resolveSubjectName = useMemo(() => {
    const roleMap = new Map(roles.map((r) => [r.id, r.name]));
    const departmentMap = new Map(departments.map((d) => [d.id, d.name]));
    const teamMap = new Map(teams.map((t) => [t.id, t.name]));

    return (type: TemplatePermissionSubject, id: number): string => {
      if (type === 'role') return roleMap.get(id) ?? `Role #${id}`;
      if (type === 'department') return departmentMap.get(id) ?? `Department #${id}`;
      return teamMap.get(id) ?? `Team #${id}`;
    };
  }, [roles, departments, teams]);

  const grants: PermissionGrantRow[] = useMemo(
    () =>
      [...permissions]
        .sort((a, b) => a.action.localeCompare(b.action))
        .map((permission) => ({
          ...permission,
          subjectName: resolveSubjectName(permission.permissible_type, permission.permissible_id),
        })),
    [permissions, resolveSubjectName],
  );

  /** Which actions currently have zero grants at all — i.e. are wide open to every user. */
  const openActions = useMemo(
    () => PERMISSION_ACTIONS.filter((action) => !permissions.some((p) => p.action === action)),
    [permissions],
  );

  const handleSubjectTypeChange = (value: TemplatePermissionSubject) => {
    setSubjectType(value);
    setSubjectId('');
  };

  const toggleAction = (action: TemplatePermissionAction, checked: boolean) => {
    setSelectedActions((prev) =>
      checked ? [...prev, action] : prev.filter((a) => a !== action),
    );
  };

  const canSubmitGrant = subjectId !== '' && selectedActions.length > 0;

  const handleGrant = async () => {
    if (!enabled || !canSubmitGrant) return;

    const numericSubjectId = Number(subjectId);
    const actionsToGrant = [...selectedActions];

    try {
      await Promise.all(
        actionsToGrant.map((action) =>
          createPermission.mutateAsync({
            action,
            permissible_type: subjectType,
            permissible_id: numericSubjectId,
          }),
        ),
      );
      toast.success(
        actionsToGrant.length > 1 ? 'Permissions granted' : 'Permission granted',
      );
      setSubjectId('');
      setSelectedActions([]);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to grant permission'));
    }
  };

  const requestRevoke = (permission: FormTemplatePermission) => setPendingRevoke(permission);
  const cancelRevoke = () => setPendingRevoke(null);

  const confirmRevoke = async () => {
    if (!pendingRevoke) return;
    try {
      await deletePermission.mutateAsync(pendingRevoke.id);
      toast.success('Permission revoked');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to revoke permission'));
    } finally {
      setPendingRevoke(null);
    }
  };

  return {
    enabled,
    isLoading: isLoading || isLoadingSubjects,
    grants,
    openActions,
    subjectType,
    subjectId,
    subjectOptions,
    selectedActions,
    canSubmitGrant,
    isGranting: createPermission.isPending,
    isRevoking: deletePermission.isPending,
    pendingRevoke,
    handleSubjectTypeChange,
    setSubjectId,
    toggleAction,
    handleGrant,
    requestRevoke,
    cancelRevoke,
    confirmRevoke,
  };
}
