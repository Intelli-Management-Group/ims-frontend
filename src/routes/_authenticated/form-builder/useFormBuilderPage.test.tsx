import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

import { useFormBuilderPage } from './useFormBuilderPage';
import { formTemplatesApi } from '@/api/form-templates';

vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => false }));
vi.mock('@/hooks/use-screen-size', () => ({ useScreenSize: () => ({ lessThan: () => false }) }));
vi.mock('@/hooks/use-form-builder-state', () => ({ default: () => ({ formElements: [] }) }));
vi.mock('@/lib/schema-generators', () => ({ generateFormJsonSchema: () => ({}), generateFormUiSchema: () => ({}) }));

vi.mock('@/api/form-templates', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/api/form-templates')>();
  return {
    formTemplatesApi: {
      ...mod.formTemplatesApi,
      createFormTemplate: vi.fn(),
      createTemplatePermission: vi.fn(),
    },
  };
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useFormBuilderPage save flow with draft permissions', () => {
  it('creates template then applies pending draft permissions', async () => {
    const created = { id: 555, name: 'Saved', json_schema: {}, ui_schema: {}, is_active: true } as any;

    vi.mocked(formTemplatesApi.createFormTemplate).mockResolvedValueOnce(created);
    vi.mocked(formTemplatesApi.createTemplatePermission).mockResolvedValue(undefined as any);

    const { result } = renderHook(() => useFormBuilderPage());

    // simulate drafting a permission via the callback
    act(() => {
      result.current.onPermissionDraftChange?.([
        { action: 'view', permissible_type: 'role', permissible_id: 1, subjectName: 'Admin' } as any,
      ]);
    });

    // call save
    await act(async () => {
      await result.current.headerProps.onSave();
    });

    expect(formTemplatesApi.createFormTemplate).toHaveBeenCalled();
    expect(formTemplatesApi.createTemplatePermission).toHaveBeenCalledWith(555, {
      action: 'view',
      permissible_type: 'role',
      permissible_id: 1,
    });
  });
});
