import { act, cleanup, render, renderHook, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { CellContext } from '@tanstack/react-table';
import { formSubmissionsApi } from '@/api/form-submissions';
import type { FormSubmission } from '@/types/api';
import { useSubmissionsPage } from './useSubmissionsPage';

vi.mock('@/api/form-submissions', () => ({
  formSubmissionsApi: {
    getFormSubmissions: vi.fn(),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

function buildMockSubmission(overrides?: Partial<FormSubmission>): FormSubmission {
  return {
    id: 5,
    form_template_id: 10,
    current_version_id: 100,
    created_by: 'John Doe',
    template: {
      id: 10,
      name: 'Contact Form',
      json_schema: {},
      ui_schema: {},
      is_active: true,
      created_by: 1,
      creator: null,
      created_at: '',
      updated_at: '',
    },
    current_version: {
      id: 100,
      submission_id: 5,
      user_id: 1,
      user: {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        is_active: true,
        created_at: '',
        updated_at: '',
        role: { id: 1, name: 'admin', is_active: true, created_at: '', updated_at: '' },
      },
      form_name: 'Customer Feedback',
      content: {},
      version_number: 2,
      created_at: '',
      updated_at: '',
    },
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-16T08:00:00Z',
    ...overrides,
  };
}

function renderCell(
  columns: ReturnType<typeof useSubmissionsPage>['columns'],
  columnId: string,
  submission: FormSubmission,
) {
  const column = columns.find((c) => ('id' in c ? c.id : c.accessorKey) === columnId);
  if (!column?.cell) throw new Error(`Column "${columnId}" or its cell renderer was not found`);
  const cellFn = column.cell as (ctx: Pick<CellContext<FormSubmission, unknown>, 'row'>) => ReactNode;
  return render(<>{cellFn({ row: { original: submission } as never })}</>);
}

describe('useSubmissionsPage', () => {
  beforeEach(() => {
    vi.mocked(formSubmissionsApi.getFormSubmissions).mockResolvedValue({
      data: [],
      meta: { current_page: 1, last_page: 1, total: 0, per_page: 10 },
    } as never);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('fetches submissions with the initial page and per-page values', async () => {
    renderHook(() => useSubmissionsPage(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(formSubmissionsApi.getFormSubmissions).toHaveBeenCalledWith({
        page: 1,
        per_page: 10,
      });
    });
  });

  it('refetches with the new page when setPage is called', async () => {
    const { result } = renderHook(() => useSubmissionsPage(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.setPage(3);
    });

    await waitFor(() => {
      expect(formSubmissionsApi.getFormSubmissions).toHaveBeenCalledWith({
        page: 3,
        per_page: 10,
      });
    });
  });

  it('resets the page back to 1 when per-page changes', async () => {
    const { result } = renderHook(() => useSubmissionsPage(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.setPage(3);
    });
    await waitFor(() => expect(result.current.page).toBe(3));

    act(() => {
      result.current.handlePerPageChange(25);
    });

    expect(result.current.page).toBe(1);
    expect(result.current.perPage).toBe(25);

    await waitFor(() => {
      expect(formSubmissionsApi.getFormSubmissions).toHaveBeenCalledWith({
        page: 1,
        per_page: 25,
      });
    });
  });

  describe('columns', () => {
    it('prefers the current version form name for the "template" column', async () => {
      const { result } = renderHook(() => useSubmissionsPage(), { wrapper: createWrapper() });
      renderCell(result.current.columns, 'template', buildMockSubmission());

      expect(await screen.findByText('Customer Feedback')).toBeInTheDocument();
    });

    it('falls back to the template name when there is no current version form name', async () => {
      const { result } = renderHook(() => useSubmissionsPage(), { wrapper: createWrapper() });
      renderCell(
        result.current.columns,
        'template',
        buildMockSubmission({ current_version: null } as never),
      );

      expect(await screen.findByText('Contact Form')).toBeInTheDocument();
    });

    it('falls back to "Template #<id>" when neither form name nor template are set', async () => {
      const { result } = renderHook(() => useSubmissionsPage(), { wrapper: createWrapper() });
      renderCell(
        result.current.columns,
        'template',
        buildMockSubmission({ current_version: null, template: null } as never),
      );

      expect(await screen.findByText('Template #10')).toBeInTheDocument();
    });

    it('renders the version number prefixed with "v"', async () => {
      const { result } = renderHook(() => useSubmissionsPage(), { wrapper: createWrapper() });
      renderCell(result.current.columns, 'version', buildMockSubmission());

      expect(await screen.findByText('v2')).toBeInTheDocument();
    });

    it('renders an em dash for the version when there is no current version', async () => {
      const { result } = renderHook(() => useSubmissionsPage(), { wrapper: createWrapper() });
      renderCell(
        result.current.columns,
        'version',
        buildMockSubmission({ current_version: null } as never),
      );

      expect(await screen.findByText('v—')).toBeInTheDocument();
    });

    it('renders the submitter name', async () => {
      const { result } = renderHook(() => useSubmissionsPage(), {
        wrapper: createWrapper(),
      });

      renderCell(
        result.current.columns,
        'submitted_by',
        buildMockSubmission({ created_by: 'John Doe' }),
      );

      expect(await screen.findByText('John Doe')).toBeInTheDocument();
    });
    
    it('renders an em dash when there is no submitter', async () => {
      const { result } = renderHook(() => useSubmissionsPage(), {
        wrapper: createWrapper(),
      });

      renderCell(
        result.current.columns,
        'submitted_by',
        buildMockSubmission({ created_by: null } as never),
      );

      expect(await screen.findByText('—')).toBeInTheDocument();
    });
    
    it('renders an em dash for created_at / updated_at when the date is missing', async () => {
      const { result } = renderHook(() => useSubmissionsPage(), { wrapper: createWrapper() });
      renderCell(result.current.columns, 'created_at', buildMockSubmission({ created_at: '' }));

      expect(await screen.findByText('—')).toBeInTheDocument();
    });

    it('renders an em dash for created_at when the date is invalid', async () => {
      const { result } = renderHook(() => useSubmissionsPage(), { wrapper: createWrapper() });
      renderCell(
        result.current.columns,
        'created_at',
        buildMockSubmission({ created_at: 'not-a-date' }),
      );

      expect(await screen.findByText('—')).toBeInTheDocument();
    });

    it('includes an actions column', async () => {
      const { result } = renderHook(() => useSubmissionsPage(), { wrapper: createWrapper() });

      expect(result.current.columns.find((c) => 'id' in c && c.id === 'actions')).toBeDefined();
    });
  });
});
