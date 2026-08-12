import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { formSubmissionsApi } from '@/api/form-submissions';
import { useBreadcrumb } from '@/hooks/use-breadcrumb';
import type { FormSubmission } from '@/types/api';
import { useSubmissionDetailPage } from './useSubmissionDetailPage';

const navigateMock = vi.fn();
let isEditRouteMock = false;

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useRouterState: () => isEditRouteMock,
  };
});

vi.mock('@/api/form-submissions', () => ({
  formSubmissionsApi: {
    getFormSubmission: vi.fn(),
  },
}));

vi.mock('@/hooks/use-breadcrumb', () => ({
  useBreadcrumb: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn() },
}));

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

function buildSubmission(overrides?: Partial<FormSubmission>): FormSubmission {
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
      user: null,
      form_name: 'My Form',
      content: {},
      version_number: 2,
      created_at: '',
      updated_at: '',
    },
    created_at: '',
    updated_at: '',
    ...overrides,
  };
}

describe('useSubmissionDetailPage', () => {
  const setBreadcrumbs = vi.fn();

  beforeEach(() => {
    isEditRouteMock = false;
    vi.mocked(useBreadcrumb).mockReturnValue({ overrides: null, setBreadcrumbs });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('fetches the submission when the id is valid and not on the edit route', async () => {
    vi.mocked(formSubmissionsApi.getFormSubmission).mockResolvedValue(buildSubmission());

    renderHook(() => useSubmissionDetailPage('5'), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(formSubmissionsApi.getFormSubmission).toHaveBeenCalledWith(5);
    });
  });

  it('does not fetch while on the edit route', () => {
    isEditRouteMock = true;

    renderHook(() => useSubmissionDetailPage('5'), { wrapper: createWrapper() });

    expect(formSubmissionsApi.getFormSubmission).not.toHaveBeenCalled();
  });

  it('reports isEditRoute from the router state', () => {
    isEditRouteMock = true;

    const { result } = renderHook(() => useSubmissionDetailPage('5'), {
      wrapper: createWrapper(),
    });

    expect(result.current.isEditRoute).toBe(true);
  });

  it('does not fetch and navigates away with a toast when the id is invalid', async () => {
    renderHook(() => useSubmissionDetailPage('not-a-number'), { wrapper: createWrapper() });

    expect(formSubmissionsApi.getFormSubmission).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invalid submission ID');
    });
    expect(navigateMock).toHaveBeenCalledWith({ to: '/submissions' });
  });

  it('navigates away with a toast when the fetch fails', async () => {
    vi.mocked(formSubmissionsApi.getFormSubmission).mockRejectedValue(new Error('boom'));

    renderHook(() => useSubmissionDetailPage('5'), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load submission');
    });
    expect(navigateMock).toHaveBeenCalledWith({ to: '/submissions' });
  });

  it('sets breadcrumbs using the template name once the submission has loaded', async () => {
    vi.mocked(formSubmissionsApi.getFormSubmission).mockResolvedValue(
      buildSubmission({ id: 9 }),
    );

    renderHook(() => useSubmissionDetailPage('9'), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(setBreadcrumbs).toHaveBeenCalledWith([
        { label: 'Submissions', path: '/submissions' },
        { label: 'Contact Form', path: '/submissions/9' },
      ]);
    });
  });

  it('falls back to "Submission #<id>" for the breadcrumb label when there is no template', async () => {
    vi.mocked(formSubmissionsApi.getFormSubmission).mockResolvedValue(
      buildSubmission({ id: 9, template: null } as never),
    );

    renderHook(() => useSubmissionDetailPage('9'), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(setBreadcrumbs).toHaveBeenCalledWith([
        { label: 'Submissions', path: '/submissions' },
        { label: 'Submission #9', path: '/submissions/9' },
      ]);
    });
  });

  it('does not set breadcrumbs while on the edit route', async () => {
    isEditRouteMock = true;
    vi.mocked(formSubmissionsApi.getFormSubmission).mockResolvedValue(buildSubmission());

    renderHook(() => useSubmissionDetailPage('5'), { wrapper: createWrapper() });

    // Give any pending effects a chance to run.
    await waitFor(() => expect(formSubmissionsApi.getFormSubmission).not.toHaveBeenCalled());
    expect(setBreadcrumbs).not.toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ label: 'Contact Form' })]),
    );
  });

  it('clears breadcrumbs on unmount', async () => {
    vi.mocked(formSubmissionsApi.getFormSubmission).mockResolvedValue(buildSubmission());

    const { unmount } = renderHook(() => useSubmissionDetailPage('5'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(setBreadcrumbs).toHaveBeenCalledWith(expect.any(Array));
    });

    unmount();

    expect(setBreadcrumbs).toHaveBeenLastCalledWith(null);
  });

  it('goBack navigates to the submissions list', () => {
    const { result } = renderHook(() => useSubmissionDetailPage('5'), {
      wrapper: createWrapper(),
    });

    result.current.goBack();

    expect(navigateMock).toHaveBeenCalledWith({ to: '/submissions' });
  });
});
