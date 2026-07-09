import { useNavigate } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { formTemplatesApi } from '@/api/form-templates';
import type { FormElementOrList } from '@/db-collections/form-builder.collections';
import { useIsMobile } from '@/hooks/use-mobile';
import { useScreenSize } from '@/hooks/use-screen-size';
import useFormBuilderState from '@/hooks/use-form-builder-state';
import {
  generateFormJsonSchema,
  generateFormUiSchema,
  reverseMapRjsfToFormElements,
} from '@/lib/schema-generators';
import { initializeFormBuilder, loadFormTemplate, setFormName } from '@/services/form-builder.service';
import { useBreadcrumb } from '@/hooks/use-breadcrumb';

export function useEditFormBuilderPage(templateId: string) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const screenSize = useScreenSize();
  const isTablet = screenSize.lessThan('lg') && !isMobile;
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [templateDbId, setTemplateDbId] = useState<number | null>(null);
  const [templateName, setTemplateName] = useState('');
  const { formElements } = useFormBuilderState();
  const { setBreadcrumbs } = useBreadcrumb();
  const requestIdRef = useRef(0);

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    initializeFormBuilder();
    setIsLoading(true);
    setTemplateDbId(null);
    setTemplateName('');

    const numericId = Number(templateId);
    if (!numericId) {
      toast.error('Invalid template ID');
      setIsLoading(false);
      navigate({ to: '/form-templates' });
      return () => {
        requestIdRef.current += 1;
        setBreadcrumbs(null);
      };
    }

    void formTemplatesApi
      .getFormTemplate(numericId)
      .then((template) => {
        if (requestId !== requestIdRef.current) {
          return;
        }

        const elements = reverseMapRjsfToFormElements(template.json_schema, template.ui_schema);
        loadFormTemplate(template.name, elements as FormElementOrList[]);
        setTemplateName(template.name);
        setTemplateDbId(template.id);
        setBreadcrumbs([
          { label: 'Form Templates', path: '/form-templates' },
          { label: template.name, path: `/form-builder/${template.id}` },
        ]);
      })
      .catch(() => {
        if (requestId !== requestIdRef.current) {
          return;
        }

        toast.error('Failed to load template');
        navigate({ to: '/form-templates' });
      })
      .finally(() => {
        if (requestId === requestIdRef.current) {
          setIsLoading(false);
        }
      });

    return () => {
      requestIdRef.current += 1;
      setBreadcrumbs(null);
    };
  }, [templateId, navigate, setBreadcrumbs]);

  const handleTemplateNameChange = useCallback(
    (value: string) => {
      setTemplateName(value);
      setFormName(value);
      setBreadcrumbs([
        { label: 'Form Templates', path: '/form-templates' },
        { label: value || 'Untitled', path: `/form-builder/${templateId}` },
      ]);
    },
    [templateId, setBreadcrumbs],
  );

  const jsonSchema = useMemo(
    () => generateFormJsonSchema(formElements as unknown as FormElementOrList[]),
    [formElements],
  );
  const uiSchema = useMemo(
    () => generateFormUiSchema(formElements as unknown as FormElementOrList[]),
    [formElements],
  );

  const handleSave = useCallback(async () => {
    if (isSaving || templateDbId === null) return;
    const trimmedName = templateName.trim();
    if (!trimmedName) {
      toast.error('Enter a template name');
      return;
    }
    setIsSaving(true);
    try {
      await formTemplatesApi.updateFormTemplate(templateDbId, {
        name: trimmedName,
        json_schema: jsonSchema as Record<string, unknown>,
        ui_schema: uiSchema as Record<string, unknown>,
      });
      toast.success('Template updated');
    } catch {
      toast.error('Failed to update template');
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, templateDbId, templateName, jsonSchema, uiSchema]);

  const headerProps = useMemo(
    () => ({
      templateName,
      onTemplateNameChange: handleTemplateNameChange,
      isSaving,
      onSave: handleSave,
    }),
    [templateName, handleTemplateNameChange, isSaving, handleSave],
  );

  return { isMobile, isTablet, isLoading, headerProps };
}
