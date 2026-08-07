import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useMyTemplatePermissions } from './use-my-template-permissions';
import { formTemplatesApi } from '@/api/form-templates';

// ---- Mocks -----------------------------------------------------------

vi.mock('@/api/form-templates', () => ({
  formTemplatesApi: {
    getMyTemplatePermissions: vi.fn(),
  },
}));

// ---- Test harness --------------------------------------------------------

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ---- Tests -----------------------------------------------------------

describe('useMyTemplatePermissions', () => {
  it('does not fetch when templateId is falsy (0)', () => {
    const wrapper = createWrapper();

    const { result } = renderHook(() => useMyTemplatePermissions(0), { wrapper });

    expect(formTemplatesApi.getMyTemplatePermissions).not.toHaveBeenCalled();
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('fetches permissions for the given templateId when truthy', async () => {
    vi.mocked(formTemplatesApi.getMyTemplatePermissions).mockResolvedValue({
      data: { view: true, create: false, edit: true },
    } as any);
    const wrapper = createWrapper();

    const { result } = renderHook(() => useMyTemplatePermissions(7), { wrapper });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(formTemplatesApi.getMyTemplatePermissions).toHaveBeenCalledWith(7);
    expect(formTemplatesApi.getMyTemplatePermissions).toHaveBeenCalledTimes(1);
  });

  it('exposes the raw resolved data unwrapped by the hook itself', async () => {
    const responsePayload = { data: { view: true, create: false, edit: true } };
    vi.mocked(formTemplatesApi.getMyTemplatePermissions).mockResolvedValue(responsePayload as any);
    const wrapper = createWrapper();

    const { result } = renderHook(() => useMyTemplatePermissions(7), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // The hook does not unwrap `.data` itself -- callers see whatever the API returns.
    expect(result.current.data).toEqual(responsePayload);
  });

  it('surfaces an error state when the request fails', async () => {
    vi.mocked(formTemplatesApi.getMyTemplatePermissions).mockRejectedValue(
      new Error('network error'),
    );
    const wrapper = createWrapper();

    const { result } = renderHook(() => useMyTemplatePermissions(7), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(new Error('network error'));
    expect(result.current.data).toBeUndefined();
  });

  it('re-fetches when templateId changes', async () => {
    vi.mocked(formTemplatesApi.getMyTemplatePermissions).mockImplementation((id: number) =>
      Promise.resolve({ data: { templateId: id } }) as any,
    );
    const wrapper = createWrapper();

    const { result, rerender } = renderHook(
      ({ templateId }) => useMyTemplatePermissions(templateId),
      { wrapper, initialProps: { templateId: 1 } },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(formTemplatesApi.getMyTemplatePermissions).toHaveBeenCalledWith(1);

    rerender({ templateId: 2 });

    await waitFor(() =>
      expect(formTemplatesApi.getMyTemplatePermissions).toHaveBeenCalledWith(2),
    );
    expect(formTemplatesApi.getMyTemplatePermissions).toHaveBeenCalledTimes(2);
  });

  it('stops fetching if templateId becomes falsy again', async () => {
    vi.mocked(formTemplatesApi.getMyTemplatePermissions).mockResolvedValue({
      data: {},
    } as any);
    const wrapper = createWrapper();

    const { result, rerender } = renderHook(
      ({ templateId }) => useMyTemplatePermissions(templateId),
      { wrapper, initialProps: { templateId: 3 } },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(formTemplatesApi.getMyTemplatePermissions).toHaveBeenCalledTimes(1);

    vi.mocked(formTemplatesApi.getMyTemplatePermissions).mockClear();

    rerender({ templateId: 0 });

    expect(formTemplatesApi.getMyTemplatePermissions).not.toHaveBeenCalled();
  });

  it('caches results separately per templateId', async () => {
    vi.mocked(formTemplatesApi.getMyTemplatePermissions).mockImplementation((id: number) =>
      Promise.resolve({ data: { templateId: id } }) as any,
    );
    const wrapper = createWrapper();

    const { result: resultA } = renderHook(() => useMyTemplatePermissions(1), { wrapper });
    const { result: resultB } = renderHook(() => useMyTemplatePermissions(2), { wrapper });

    await waitFor(() => expect(resultA.current.isSuccess).toBe(true));
    await waitFor(() => expect(resultB.current.isSuccess).toBe(true));

    expect((resultA.current.data as any).data.templateId).toBe(1);
    expect((resultB.current.data as any).data.templateId).toBe(2);
  });
});
