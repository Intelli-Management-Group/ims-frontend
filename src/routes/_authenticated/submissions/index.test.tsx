import { cleanup, waitFor } from '@testing-library/react';
import { screen, userEvent } from '@/test/test-utils';
import { renderWithRouter } from '@/test/test-utils';
import type { AuthUser, FormSubmission } from '@/types/api';
import { useSubmissionsPage } from './useSubmissionsPage';

vi.mock('./useSubmissionsPage', () => ({
  useSubmissionsPage: vi.fn(),
}));

const adminUser: AuthUser = {
  id: 1,
  name: 'Admin',
  email: 'admin@example.com',
  is_active: true,
  created_at: '',
  updated_at: '',
  role: {
    id: 1,
    name: 'admin',
    is_active: true,
    created_at: '',
    updated_at: '',
  },
};

function buildMockSubmission(overrides?: Partial<FormSubmission>): FormSubmission {
  return {
    id: 5,
    form_template_id: 10,
    current_version_id: 100,
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
        role: adminUser.role,
      },
      form_name: 'Customer Feedback',
      content: { answer: 'Hello World' },
      version_number: 2,
      created_at: '',
      updated_at: '',
    },
    created_at: '',
    updated_at: '',
    ...overrides,
  };
}

// Mirrors the real column set from useSubmissionsPage.tsx so tests exercise
// the actual DataTable / DataTablePagination rendering rather than a stub.
function realColumns() {
  return [
    {
      id: 'template',
      header: 'Form Name',
      cell: ({ row }: { row: { original: FormSubmission } }) =>
        row.original.current_version?.form_name ??
        row.original.template?.name ??
        `Template #${row.original.form_template_id}`,
    },
    {
      id: 'version',
      header: 'Version',
      cell: ({ row }: { row: { original: FormSubmission } }) =>
        `v${row.original.current_version?.version_number ?? '—'}`,
    },
    {
      id: 'submitted_by',
      header: 'Submitted by',
      cell: ({ row }: { row: { original: FormSubmission } }) =>
        row.original.current_version?.user?.name ?? '—',
    },
    {
      accessorKey: 'created_at',
      header: 'Submitted',
      cell: () => '—',
    },
    {
      accessorKey: 'updated_at',
      header: 'Last Updated',
      cell: () => '—',
    },
    {
      id: 'actions',
      header: '',
      cell: () => null,
    },
  ];
}

function mockHook(overrides?: Partial<ReturnType<typeof useSubmissionsPage>>) {
  vi.mocked(useSubmissionsPage).mockReturnValue({
    page: 1,
    setPage: vi.fn(),
    perPage: 10,
    data: undefined,
    isLoading: false,
    columns: realColumns() as never,
    handlePerPageChange: vi.fn(),
    ...overrides,
  });
}

describe('SubmissionsPage', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders the page heading and description', async () => {
    mockHook();

    renderWithRouter({ route: '/submissions', user: adminUser });

    // renderWithRouter's router.navigate() is async and isn't awaited inside
    // the helper, so the route may not have resolved yet on first render.
    // findBy* retries until it appears instead of asserting synchronously.
    expect(await screen.findByRole('heading', { name: 'Submissions' })).toBeInTheDocument();
    expect(screen.getByText('View all filled form submissions')).toBeInTheDocument();
  });

  it('shows skeleton rows while loading', async () => {
    mockHook({ isLoading: true, data: undefined });

    renderWithRouter({ route: '/submissions', user: adminUser });

    await screen.findByRole('heading', { name: 'Submissions' });

    const skeletons = document.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows "No results." when data has not loaded yet', async () => {
    mockHook({ isLoading: false, data: undefined });

    renderWithRouter({ route: '/submissions', user: adminUser });

    expect(await screen.findByText('No results.')).toBeInTheDocument();
  });

  it('renders submission rows once data is available', async () => {
    mockHook({
      isLoading: false,
      data: {
        data: [buildMockSubmission(), buildMockSubmission({ id: 6, form_template_id: 11 })],
        meta: { current_page: 1, last_page: 3, total: 25, per_page: 10 },
      } as never,
    });

    renderWithRouter({ route: '/submissions', user: adminUser });

    expect(await screen.findAllByText('Customer Feedback')).toHaveLength(2);
  });

  it('does not render pagination when data has not loaded', async () => {
    mockHook({ data: undefined });

    renderWithRouter({ route: '/submissions', user: adminUser });

    await screen.findByRole('heading', { name: 'Submissions' });

    expect(screen.queryByText(/entries\. Showing/)).not.toBeInTheDocument();
  });

  it('renders pagination with the correct entry range once data is available', async () => {
    mockHook({
      page: 2,
      perPage: 10,
      data: {
        data: [buildMockSubmission()],
        meta: { current_page: 2, last_page: 5, total: 42, per_page: 10 },
      } as never,
    });

    renderWithRouter({ route: '/submissions', user: adminUser });

    expect(await screen.findByText(/entries\. Showing 11 to 20 of 42/)).toBeInTheDocument();
  });

  it('calls setPage when the next-page control is clicked', async () => {
    const user = userEvent.setup();
    const setPage = vi.fn();

    mockHook({
      page: 1,
      setPage,
      data: {
        data: [buildMockSubmission()],
        meta: { current_page: 1, last_page: 5, total: 42, per_page: 10 },
      } as never,
    });

    renderWithRouter({ route: '/submissions', user: adminUser });

    const nextLink = await screen.findByRole('link', { name: /next/i });
    await user.click(nextLink);

    await waitFor(() => {
      expect(setPage).toHaveBeenCalledWith(2);
    });
  });

  it('calls handlePerPageChange when the per-page select changes', async () => {
    const user = userEvent.setup();
    const handlePerPageChange = vi.fn();

    mockHook({
      perPage: 10,
      handlePerPageChange,
      data: {
        data: [buildMockSubmission()],
        meta: { current_page: 1, last_page: 5, total: 42, per_page: 10 },
      } as never,
    });

    renderWithRouter({ route: '/submissions', user: adminUser });

    const combobox = await screen.findByRole('combobox');
    await user.click(combobox);
    await user.click(await screen.findByRole('option', { name: '20' }));

    await waitFor(() => {
      expect(handlePerPageChange).toHaveBeenCalledWith(20);
    });
  });
});
