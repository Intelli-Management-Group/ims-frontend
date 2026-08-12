import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { formSubmissionsApi } from '@/api/form-submissions';
import { useBreadcrumb } from '@/hooks/use-breadcrumb';
import type { FormSubmission } from '@/types/api';
import { useSubmissionEditPage } from './useSubmissionEditPage';

const navigateMock = vi.fn();

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('@/api/form-submissions', () => ({
  formSubmissionsApi: {
    getFormSubmission: vi.fn(),
    updateFormSubmission: vi.fn(),
  },
}));

vi.mock('@/hooks/use-breadcrumb', () => ({
  useBreadcrumb: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
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
      content: { answer: 'hello' },
      version_number: 2,
      created_at: '',
      updated_at: '',
    },
    created_at: '',
    updated_at: '',
    ...overrides,
  };
}

describe('useSubmissionEditPage', () => {
  const setBreadcrumbs = vi.fn();

  beforeEach(() => {
    vi.mocked(useBreadcrumb).mockReturnValue({ overrides: null, setBreadcrumbs });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('fetches the submission by numeric id', async () => {
    vi.mocked(formSubmissionsApi.getFormSubmission).mockResolvedValue(buildSubmission());

    renderHook(() => useSubmissionEditPage('5'), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(formSubmissionsApi.getFormSubmission).toHaveBeenCalledWith(5);
    });
  });

  it('does not fetch and navigates away with a toast when the id is invalid', async () => {
    renderHook(() => useSubmissionEditPage('not-a-number'), { wrapper: createWrapper() });

    expect(formSubmissionsApi.getFormSubmission).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invalid submission ID');
    });
    expect(navigateMock).toHaveBeenCalledWith({ to: '/submissions' });
  });

  it('navigates away with a toast when the fetch fails', async () => {
    vi.mocked(formSubmissionsApi.getFormSubmission).mockRejectedValue(new Error('boom'));

    renderHook(() => useSubmissionEditPage('5'), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load submission');
    });
    expect(navigateMock).toHaveBeenCalledWith({ to: '/submissions' });
  });

  it('sets breadcrumbs once the submission (with template and current_version) has loaded', async () => {
    vi.mocked(formSubmissionsApi.getFormSubmission).mockResolvedValue(
      buildSubmission({ id: 7 }),
    );

    renderHook(() => useSubmissionEditPage('7'), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(setBreadcrumbs).toHaveBeenCalledWith([
        { label: 'Submissions', path: '/submissions' },
        { label: 'Edit: My Form', path: '/submissions/7/edit' },
      ]);
    });
  });

  it('does not set breadcrumbs while the submission is still loading', () => {
    vi.mocked(formSubmissionsApi.getFormSubmission).mockImplementation(
      () => new Promise(() => {}),
    );

    renderHook(() => useSubmissionEditPage('5'), { wrapper: createWrapper() });

    expect(setBreadcrumbs).not.toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ label: expect.stringContaining('Edit:') }),
    ]));
  });

  it('sends the mapped payload to updateFormSubmission, toasts, invalidates queries, and navigates on success', async () => {
    vi.mocked(formSubmissionsApi.getFormSubmission).mockResolvedValue(buildSubmission());
    vi.mocked(formSubmissionsApi.updateFormSubmission).mockResolvedValue(buildSubmission());

    const { result } = renderHook(() => useSubmissionEditPage('5'), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.updateSubmission({
        formName: 'New Name',
        content: { answer: 'updated' },
        versionNumber: 2,
      });
    });

    await waitFor(() => {
      expect(formSubmissionsApi.updateFormSubmission).toHaveBeenCalledWith(5, {
        form_name: 'New Name',
        content: { answer: 'updated' },
        version_number: 2,
      });
    });
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Submission updated successfully');
    });
    expect(navigateMock).toHaveBeenCalledWith({
      to: '/submissions/$submissionId',
      params: { submissionId: '5' },
    });
  });

  it('shows a conflict toast and does not navigate when the API returns 409', async () => {
    vi.mocked(formSubmissionsApi.getFormSubmission).mockResolvedValue(buildSubmission());
    const conflictError = new axios.AxiosError(
      'Conflict',
      '409',
      {} as never,
      {},
      {
        status: 409,
        statusText: 'Conflict',
        data: {},
        headers: {},
        config: {} as never,
      },
    );
    vi.mocked(formSubmissionsApi.updateFormSubmission).mockRejectedValue(conflictError);

    const { result } = renderHook(() => useSubmissionEditPage('5'), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.updateSubmission({ formName: 'x', content: {}, versionNumber: 1 });
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'This submission was updated elsewhere. Refresh the page and try again.',
      );
    });
    expect(toast.success).not.toHaveBeenCalled();
    expect(navigateMock).not.toHaveBeenCalledWith(
      expect.objectContaining({ to: '/submissions/$submissionId' }),
    );
  });

  it('shows a generic error toast on non-409 update failures', async () => {
    vi.mocked(formSubmissionsApi.getFormSubmission).mockResolvedValue(buildSubmission());
    vi.mocked(formSubmissionsApi.updateFormSubmission).mockRejectedValue(new Error('network down'));

    const { result } = renderHook(() => useSubmissionEditPage('5'), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.updateSubmission({ formName: 'x', content: {}, versionNumber: 1 });
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to update submission');
    });
  });
});
