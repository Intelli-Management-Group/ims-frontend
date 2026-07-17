import { cleanup } from '@testing-library/react';
import { screen, waitFor, userEvent } from '@/test/test-utils';
import { renderWithRouter } from '@/test/test-utils';
import type { AuthUser, FormSubmission } from '@/types/api';
import { useSubmissionDetailPage } from './useSubmissionDetailPage';

vi.mock('./useSubmissionDetailPage', () => ({
  useSubmissionDetailPage: vi.fn(),
}));

vi.mock('@/hooks/use-breadcrumb', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks/use-breadcrumb')>();
  return {
    ...actual,
    useBreadcrumb: vi.fn(() => ({
      overrides: null,
      setBreadcrumbs: vi.fn(),
    })),
  };
});

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

const jsonSchema = {
  type: 'object',
  properties: {
    answer: {
      type: 'string',
      title: 'Answer',
    },
  },
};

function buildMockSubmission(
  overrides?: Partial<FormSubmission>,
): FormSubmission {
  return {
    id: 5,
    form_template_id: 10,
    current_version_id: 100,
    template: {
      id: 10,
      name: 'Contact Form',
      json_schema: jsonSchema,
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
      content: {
        answer: 'Hello World',
      },
      version_number: 2,
      created_at: '',
      updated_at: '',
    },
    created_at: '',
    updated_at: '',
    ...overrides,
  };
}

describe('SubmissionDetailPage', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('shows loading skeleton while loading', () => {
    vi.mocked(useSubmissionDetailPage).mockReturnValue({
        isEditRoute: false,
        submission: null,
        isLoading: true,
        goBack: vi.fn(),
    });

    const { container } = renderWithRouter({
        route: '/submissions/5',
        user: adminUser,
    });

    expect(container.querySelector('.max-w-2xl')).toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });

  it('renders submission details', async () => {
    vi.mocked(useSubmissionDetailPage).mockReturnValue({
      isEditRoute: false,
      submission: buildMockSubmission(),
      isLoading: false,
      goBack: vi.fn(),
    });

    renderWithRouter({
      route: '/submissions/5',
      user: adminUser,
    });

    expect(
      screen.getByRole('heading', {
        name: 'Customer Feedback',
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        /Template: Contact Form — Version 2 — submitted by John Doe/,
      ),
    ).toBeInTheDocument();

    expect(screen.getByDisplayValue('Hello World')).toBeInTheDocument();
  });

  it('renders readonly form fields', () => {
    vi.mocked(useSubmissionDetailPage).mockReturnValue({
      isEditRoute: false,
      submission: buildMockSubmission(),
      isLoading: false,
      goBack: vi.fn(),
    });

    renderWithRouter({
      route: '/submissions/5',
      user: adminUser,
    });

    const input = screen.getByLabelText(/Answer/i);

    expect(input).toBeDisabled();
  });

  it('calls goBack when back button is clicked', async () => {
    const user = userEvent.setup();
    const goBack = vi.fn();

    vi.mocked(useSubmissionDetailPage).mockReturnValue({
      isEditRoute: false,
      submission: buildMockSubmission(),
      isLoading: false,
      goBack,
    });

    renderWithRouter({
      route: '/submissions/5',
      user: adminUser,
    });

    await user.click(screen.getByRole('button'));

    expect(goBack).toHaveBeenCalledTimes(1);
  });

  it('returns null when submission is missing', () => {
    vi.mocked(useSubmissionDetailPage).mockReturnValue({
      isEditRoute: false,
      submission: null,
      isLoading: false,
      goBack: vi.fn(),
    });

    const { container } = renderWithRouter({
      route: '/submissions/5',
      user: adminUser,
    });

    expect(container.firstChild).toBeNull();
  });

  it('returns null when template is missing', () => {
    vi.mocked(useSubmissionDetailPage).mockReturnValue({
      isEditRoute: false,
      submission: {
        ...buildMockSubmission(),
        template: null,
      } as never,
      isLoading: false,
      goBack: vi.fn(),
    });

    const { container } = renderWithRouter({
      route: '/submissions/5',
      user: adminUser,
    });

    expect(container.firstChild).toBeNull();
  });

  it('returns null when current_version is missing', () => {
    vi.mocked(useSubmissionDetailPage).mockReturnValue({
      isEditRoute: false,
      submission: {
        ...buildMockSubmission(),
        current_version: null,
      } as never,
      isLoading: false,
      goBack: vi.fn(),
    });

    const { container } = renderWithRouter({
      route: '/submissions/5',
      user: adminUser,
    });

    expect(container.firstChild).toBeNull();
  });

  it('renders outlet when on edit route', async () => {
    vi.mocked(useSubmissionDetailPage).mockReturnValue({
      isEditRoute: true,
      submission: null,
      isLoading: false,
      goBack: vi.fn(),
    });

    renderWithRouter({
      route: '/submissions/5/edit',
      user: adminUser,
    });

    await waitFor(() => {
      expect(screen.queryByText('Customer Feedback')).not.toBeInTheDocument();
    });
  });
});