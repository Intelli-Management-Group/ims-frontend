import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createContext, useContext } from 'react';

import { PermissionsPanel } from './permissions-panel'
import { usePermissionsPanel } from './usePermissionsPanel';
import type { PermissionGrantRow } from './usePermissionsPanel';

vi.mock('./usePermissionsPanel', async () => {
  const actual = await vi.importActual<typeof import('./usePermissionsPanel')>(
    './usePermissionsPanel',
  );
  return {
    ...actual,
    usePermissionsPanel: vi.fn(),
  };
});

// ---- Mock: Select (native <select> wired through context) ----------

const SelectCtx = createContext<{ value: string; onValueChange: (v: string) => void } | null>(
  null,
);

vi.mock('@/components/ui/select', () => ({
  Select: ({ value, onValueChange, children }: any) => (
    <SelectCtx.Provider value={{ value, onValueChange }}>{children}</SelectCtx.Provider>
  ),
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: ({ placeholder }: any) => {
    const ctx = useContext(SelectCtx);
    return <span>{ctx?.value || placeholder}</span>;
  },
  SelectContent: ({ children }: any) => {
    const ctx = useContext(SelectCtx);
    return (
      <select
        aria-label="mock-select-content"
        value={ctx?.value ?? ''}
        onChange={(e) => ctx?.onValueChange(e.target.value)}
      >
        <option value="" disabled hidden />
        {children}
      </select>
    );
  },
  SelectItem: ({ value, children }: any) => <option value={value}>{children}</option>,
}));

// ---- Mock: Checkbox (native input) ----------------------------------

vi.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ id, checked, onCheckedChange }: any) => (
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
    />
  ),
}));

// ---- Mock: ConfirmDialog ---------------------------------------------

vi.mock('@/components/shared/confirm-dialog', () => ({
  ConfirmDialog: ({ isOpen, onClose, onConfirm, title, description, confirmText, isLoading }: any) =>
    isOpen ? (
      <div role="alertdialog" aria-label={title}>
        <p>{description}</p>
        <button onClick={onClose}>Cancel</button>
        <button onClick={onConfirm} disabled={isLoading}>
          {confirmText}
        </button>
      </div>
    ) : null,
}));

// ---- Mock: Empty state components -------------------------------------

vi.mock('@/components/ui/empty', () => ({
  Empty: ({ children }: any) => <div>{children}</div>,
  EmptyHeader: ({ children }: any) => <div>{children}</div>,
  EmptyMedia: ({ children }: any) => <div>{children}</div>,
  EmptyTitle: ({ children }: any) => <h3>{children}</h3>,
  EmptyDescription: ({ children }: any) => <p>{children}</p>,
}));

// ---- Fixtures ----------------------------------------------------------

function makeGrant(overrides: Partial<PermissionGrantRow> = {}): PermissionGrantRow {
  return {
    id: 1,
    action: 'view',
    permissible_type: 'role',
    permissible_id: 1,
    subjectName: 'Admin',
    ...overrides,
  } as PermissionGrantRow;
}

function baseHookReturn(overrides: Partial<ReturnType<typeof usePermissionsPanel>> = {}) {
  return {
    enabled: true,
    isLoading: false,
    grants: [],
    openActions: ['view', 'create', 'edit'],
    subjectType: 'role',
    subjectId: '',
    subjectOptions: [{ id: 1, name: 'Admin' }, { id: 2, name: 'Editor' }],
    selectedActions: [],
    canSubmitGrant: false,
    isGranting: false,
    isRevoking: false,
    pendingRevoke: null,
    handleSubjectTypeChange: vi.fn(),
    setSubjectId: vi.fn(),
    toggleAction: vi.fn(),
    handleGrant: vi.fn(),
    requestRevoke: vi.fn(),
    cancelRevoke: vi.fn(),
    confirmRevoke: vi.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof usePermissionsPanel>;
}

function setHook(overrides: Partial<ReturnType<typeof usePermissionsPanel>> = {}) {
  const value = baseHookReturn(overrides);
  vi.mocked(usePermissionsPanel).mockReturnValue(value);
  return value;
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ---- Tests -----------------------------------------------------------

describe('PermissionsPanel', () => {
  describe('disabled state', () => {
    it('shows the "save the template first" empty state when disabled', () => {
      setHook({ enabled: false });

      render(<PermissionsPanel templateId={null} />);

      expect(screen.getByText('Save the template first')).toBeInTheDocument();
      expect(
        screen.getByText(/access restrictions can be managed once this template has been saved/i),
      ).toBeInTheDocument();
      expect(screen.queryByText('Add a restriction')).not.toBeInTheDocument();
    });
  });

  describe('open-access banner', () => {
    it('lists open actions and uses plural copy for multiple actions', () => {
      setHook({ openActions: ['view', 'create', 'edit'] });

      render(<PermissionsPanel templateId={1} />);

      const banner = screen.getByText(/currently open to everyone/i).closest('p')!;
      expect(within(banner).getByText('View, Create, Edit')).toBeInTheDocument();
      expect(within(banner).getByText(/are currently open to everyone/i)).toBeInTheDocument();
    });

    it('uses singular copy for a single open action', () => {
      setHook({ openActions: ['view'] });

      render(<PermissionsPanel templateId={1} />);

      const banner = screen.getByText(/currently open to everyone/i).closest('p')!;
      expect(within(banner).getByText('View')).toBeInTheDocument();
      expect(within(banner).getByText(/is currently open to everyone/i)).toBeInTheDocument();
    });

    it('shows the fully-restricted message when there are no open actions', () => {
      setHook({ openActions: [] });

      render(<PermissionsPanel templateId={1} />);

      expect(
        screen.getByText(/every action on this template is currently restricted/i),
      ).toBeInTheDocument();
    });
  });

  describe('grant form', () => {
    it('disables the grant button when the form cannot be submitted', () => {
      setHook({ canSubmitGrant: false });

      render(<PermissionsPanel templateId={1} />);

      expect(screen.getByRole('button', { name: 'Grant access' })).toBeDisabled();
    });

    it('enables the grant button when the form is valid', () => {
      setHook({ canSubmitGrant: true });

      render(<PermissionsPanel templateId={1} />);

      expect(screen.getByRole('button', { name: 'Grant access' })).toBeEnabled();
    });

    it('shows a granting indicator and disables the button while submitting', () => {
      setHook({ canSubmitGrant: true, isGranting: true });

      render(<PermissionsPanel templateId={1} />);

      const button = screen.getByRole('button', { name: 'Granting...' });
      expect(button).toBeDisabled();
    });

    it('calls handleGrant when the grant button is clicked', async () => {
      const user = userEvent.setup();
      const hook = setHook({ canSubmitGrant: true });

      render(<PermissionsPanel templateId={1} />);

      await user.click(screen.getByRole('button', { name: 'Grant access' }));

      expect(hook.handleGrant).toHaveBeenCalledTimes(1);
    });

    it('calls handleSubjectTypeChange when a different subject type is chosen', async () => {
      const user = userEvent.setup();
      const hook = setHook();

      render(<PermissionsPanel templateId={1} />);

      const selects = screen.getAllByLabelText('mock-select-content');
      // First select in the form is subject type
      await user.selectOptions(selects[0], 'department');

      expect(hook.handleSubjectTypeChange).toHaveBeenCalledWith('department');
    });

    it('calls setSubjectId when a subject option is chosen', async () => {
      const user = userEvent.setup();
      const hook = setHook();

      render(<PermissionsPanel templateId={1} />);

      const selects = screen.getAllByLabelText('mock-select-content');
      // Second select in the form is the subject picker
      await user.selectOptions(selects[1], '2');

      expect(hook.setSubjectId).toHaveBeenCalledWith('2');
    });

    it('shows a "not found" message when there are no subject options', () => {
      setHook({ subjectOptions: [] });

      render(<PermissionsPanel templateId={1} />);

      expect(screen.getByText(/no roles found/i)).toBeInTheDocument();
    });

    it('calls toggleAction when an action checkbox is toggled', async () => {
      const user = userEvent.setup();
      const hook = setHook();

      render(<PermissionsPanel templateId={1} />);

      await user.click(screen.getByLabelText('View'));

      expect(hook.toggleAction).toHaveBeenCalledWith('view', true);
    });

    it('reflects already-selected actions as checked', () => {
      setHook({ selectedActions: ['edit'] });

      render(<PermissionsPanel templateId={1} />);

      expect(screen.getByLabelText('Edit')).toBeChecked();
      expect(screen.getByLabelText('View')).not.toBeChecked();
    });
  });

  describe('current grants', () => {
    it('shows skeleton placeholders while loading', () => {
      setHook({ isLoading: true, grants: [makeGrant()] });

      render(<PermissionsPanel templateId={1} />);

      expect(screen.queryByRole('table')).not.toBeInTheDocument();
      expect(screen.queryByText('No restrictions have been granted yet — this template is open to everyone.')).not.toBeInTheDocument();
    });

    it('shows an empty message when there are no grants', () => {
      setHook({ isLoading: false, grants: [] });

      render(<PermissionsPanel templateId={1} />);

      expect(
        screen.getByText('No restrictions have been granted yet — this template is open to everyone.'),
      ).toBeInTheDocument();
    });

    it('renders a table row per grant with subject type, name, and action', () => {
      setHook({
        grants: [
          makeGrant({ id: 1, action: 'view', permissible_type: 'role', subjectName: 'Admin' }),
          makeGrant({ id: 2, action: 'edit', permissible_type: 'department', subjectName: 'Engineering' }),
        ],
      });

      render(<PermissionsPanel templateId={1} />);

      const rows = screen.getAllByRole('row');
      // header row + 2 data rows
      expect(rows).toHaveLength(3);

      const firstRow = within(rows[1]);
      expect(firstRow.getByText('Role')).toBeInTheDocument();
      expect(firstRow.getByText('Admin')).toBeInTheDocument();
      expect(firstRow.getByText('View')).toBeInTheDocument();

      const secondRow = within(rows[2]);
      expect(secondRow.getByText('Department')).toBeInTheDocument();
      expect(secondRow.getByText('Engineering')).toBeInTheDocument();
      expect(secondRow.getByText('Edit')).toBeInTheDocument();
    });

    it('calls requestRevoke with the grant when its revoke button is clicked', async () => {
      const user = userEvent.setup();
      const grant = makeGrant({ id: 7, action: 'create', subjectName: 'Editor' });
      const hook = setHook({ grants: [grant] });

      render(<PermissionsPanel templateId={1} />);

      await user.click(screen.getByRole('button', { name: 'Revoke Create for Editor' }));

      expect(hook.requestRevoke).toHaveBeenCalledWith(grant);
    });
  });

  describe('revoke confirmation dialog', () => {
    it('is not rendered when there is no pending revoke', () => {
      setHook({ pendingRevoke: null });

      render(<PermissionsPanel templateId={1} />);

      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });

    it('renders with a description built from the pending grant when open', () => {
      setHook({
        pendingRevoke: makeGrant({ action: 'edit', permissible_type: 'team', subjectName: 'Platform Team' }),
      });

      render(<PermissionsPanel templateId={1} />);

      const dialog = screen.getByRole('alertdialog', { name: 'Revoke access?' });
      expect(
        within(dialog).getByText(
          /this removes edit access for this team\. if this was the last grant for this action, the action becomes open to everyone again\./i,
        ),
      ).toBeInTheDocument();
    });

    it('calls cancelRevoke when the dialog is dismissed', async () => {
      const user = userEvent.setup();
      const hook = setHook({ pendingRevoke: makeGrant() });

      render(<PermissionsPanel templateId={1} />);

      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(hook.cancelRevoke).toHaveBeenCalledTimes(1);
    });

    it('calls confirmRevoke when the revoke action is confirmed', async () => {
      const user = userEvent.setup();
      const hook = setHook({ pendingRevoke: makeGrant() });

      render(<PermissionsPanel templateId={1} />);

      await user.click(screen.getByRole('button', { name: 'Revoke' }));

      expect(hook.confirmRevoke).toHaveBeenCalledTimes(1);
    });

    it('disables the confirm button while revoking', () => {
      setHook({ pendingRevoke: makeGrant(), isRevoking: true });

      render(<PermissionsPanel templateId={1} />);

      expect(screen.getByRole('button', { name: 'Revoke' })).toBeDisabled();
    });
  });
});
