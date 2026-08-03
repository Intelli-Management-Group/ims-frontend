import { Info, ShieldOff, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import {
  PERMISSION_ACTIONS,
  PERMISSION_SUBJECTS,
  usePermissionsPanel,
} from './usePermissionsPanel';

const ACTION_LABELS: Record<string, string> = {
  view: 'View',
  create: 'Create',
  edit: 'Edit',
};

const SUBJECT_LABELS: Record<string, string> = {
  role: 'Role',
  department: 'Department',
  team: 'Team',
};

interface PermissionsPanelProps {
  templateId: number | null;
}

export function PermissionsPanel({ templateId }: PermissionsPanelProps) {
  const {
    enabled,
    isLoading,
    grants,
    openActions,
    subjectType,
    subjectId,
    subjectOptions,
    selectedActions,
    canSubmitGrant,
    isGranting,
    isRevoking,
    pendingRevoke,
    handleSubjectTypeChange,
    setSubjectId,
    toggleAction,
    handleGrant,
    requestRevoke,
    cancelRevoke,
    confirmRevoke,
  } = usePermissionsPanel(templateId);

  if (!enabled) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ShieldOff />
          </EmptyMedia>
          <EmptyTitle>Save the template first</EmptyTitle>
          <EmptyDescription>
            Access restrictions can be managed once this template has been saved for the first
            time.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2 rounded-lg border bg-muted/40 p-3 text-sm">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <p className="text-muted-foreground">
          {openActions.length === 0 ? (
            <>
              Every action on this template is currently restricted to the roles, departments, or
              teams granted below.
            </>
          ) : (
            <>
              With no restrictions in place,{' '}
              <span className="font-medium text-foreground">
                {openActions.map((a) => ACTION_LABELS[a]).join(', ')}
              </span>{' '}
              {openActions.length === 1 ? 'is' : 'are'} currently open to everyone. Adding the
              first grant for an action is what turns on restriction for that action — it isn't
              the presence of this screen that restricts access.
            </>
          )}
        </p>
      </div>

      <div className="space-y-3 rounded-lg border p-4">
        <h4 className="text-sm font-semibold">Add a restriction</h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel>Subject type</FieldLabel>
            <Select
              value={subjectType}
              onValueChange={(v) => handleSubjectTypeChange(v as typeof subjectType)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select subject type" />
              </SelectTrigger>
              <SelectContent>
                {PERMISSION_SUBJECTS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel>{SUBJECT_LABELS[subjectType]}</FieldLabel>
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={`Select ${SUBJECT_LABELS[subjectType].toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {subjectOptions.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    No {SUBJECT_LABELS[subjectType].toLowerCase()}s found
                  </div>
                ) : (
                  subjectOptions.map((option) => (
                    <SelectItem key={option.id} value={String(option.id)}>
                      {option.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <Field>
          <FieldLabel>Allowed actions</FieldLabel>
          <div className="flex flex-wrap gap-4 rounded-lg border p-3">
            {PERMISSION_ACTIONS.map((action) => (
              <div key={action} className="flex items-center gap-2">
                <Checkbox
                  id={`grant-action-${action}`}
                  checked={selectedActions.includes(action)}
                  onCheckedChange={(checked) => toggleAction(action, checked === true)}
                />
                <label htmlFor={`grant-action-${action}`} className="text-sm font-medium">
                  {ACTION_LABELS[action]}
                </label>
              </div>
            ))}
          </div>
        </Field>

        <div className="flex justify-end">
          <Button onClick={handleGrant} disabled={!canSubmitGrant || isGranting}>
            {isGranting ? 'Granting...' : 'Grant access'}
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-semibold">Current grants</h4>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : grants.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No restrictions have been granted yet — this template is open to everyone.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject type</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Action</TableHead>
                <TableHead className="text-right">Revoke</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {grants.map((grant) => (
                <TableRow key={grant.id}>
                  <TableCell>{SUBJECT_LABELS[grant.permissible_type]}</TableCell>
                  <TableCell className="font-medium">{grant.subjectName}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{ACTION_LABELS[grant.action]}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => requestRevoke(grant)}
                      aria-label={`Revoke ${ACTION_LABELS[grant.action]} for ${grant.subjectName}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <ConfirmDialog
        isOpen={pendingRevoke !== null}
        onClose={cancelRevoke}
        onConfirm={confirmRevoke}
        title="Revoke access?"
        description={
          pendingRevoke
            ? `This removes ${ACTION_LABELS[pendingRevoke.action]} access for this ${SUBJECT_LABELS[pendingRevoke.permissible_type].toLowerCase()}. If this was the last grant for this action, the action becomes open to everyone again.`
            : ''
        }
        confirmText="Revoke"
        isLoading={isRevoking}
      />
    </div>
  );
}
