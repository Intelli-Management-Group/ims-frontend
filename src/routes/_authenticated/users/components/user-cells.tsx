import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/status-badge';
import { Pencil } from 'lucide-react';
import type { User } from '@/types/api';

export function NameCell({ name }: { name: string }) {
  return <div className="font-medium">{name}</div>;
}

export function DepartmentsCell({ departments }: { departments: User['departments'] }) {
  if (!departments || departments.length === 0) {
    return <span className="text-muted-foreground">-</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {departments.map((dept) => (
        <Badge key={dept.id} variant="secondary" className="text-[10px]">
          {dept.name}
        </Badge>
      ))}
    </div>
  );
}

export function TeamsCell({ teams }: { teams: User['teams'] }) {
  if (!teams || teams.length === 0) {
    return <span className="text-muted-foreground">-</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {teams.map((team) => (
        <Badge key={team.id} variant="outline" className="text-[10px]">
          {team.name}
        </Badge>
      ))}
    </div>
  );
}

export function RoleCell({ role }: { role: User['role'] }) {
  if (!role) {
    return <span className="text-muted-foreground">-</span>;
  }

  return (
    <Badge variant="outline" className="text-[10px]">
      {role.name}
    </Badge>
  );
}

export function StatusCell({ isActive }: { isActive: boolean }) {
  return <StatusBadge isActive={isActive} />;
}

export function ActionsCell({
  user,
  isAdmin,
  onEdit,
}: {
  user: User;
  isAdmin: boolean;
  onEdit: (user: User) => void;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => onEdit(user)}
      disabled={!isAdmin}
      aria-label={`Edit ${user.name}`}
    >
      <Pencil className="h-4 w-4" />
    </Button>
  );
}