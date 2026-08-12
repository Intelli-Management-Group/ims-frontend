import { useState } from 'react';
import type { IChangeEvent } from '@rjsf/core';
import { toast } from 'sonner';
import type { FormSubmission, FormSubmissionVersion, FormTemplate } from '@/types/api';

export type SubmissionWithTemplate = FormSubmission & {
  template: FormTemplate;
  current_version: FormSubmissionVersion;
};

interface UseSubmissionEditFormArgs {
  submission: SubmissionWithTemplate;
  onSave: (payload: {
    formName: string;
    content: Record<string, unknown>;
    versionNumber: number;
    priority?: string | null;
  }) => void;
}

export function useSubmissionEditForm({ submission, onSave }: UseSubmissionEditFormArgs) {
  const current = submission.current_version;

  const [formName, setFormName] = useState(current.form_name);
  const [formNameError, setFormNameError] = useState(false);
  const [priority, setPriority] = useState<string | null>(
    submission.priority ?? null,
  );

  // versionNumber is pinned to the version this form was opened against.
  // We rely on the parent remounting this component (via `key`) whenever
  // the underlying current_version changes, rather than tracking it live,
  // so a stale value here always reflects the version the user is actually
  // editing against and lets the server's 409 check do its job correctly.
  const versionNumber = current.version_number;

  const handleFormNameChange = (value: string) => {
    setFormName(value);
    if (formNameError) setFormNameError(false);
  };

  const handleSubmit = ({ formData: nextData }: IChangeEvent) => {
    if (!formName.trim()) {
      setFormNameError(true);
      toast.error('Please enter a form name');
      return;
    }
    if (nextData !== undefined) {
      onSave({
        formName: formName.trim(),
        content: nextData as Record<string, unknown>,
        versionNumber,
        priority,
      });
    }
  };

  return {
    formName,
    formNameError,
    handleFormNameChange,
    handleSubmit,
    priority,
    setPriority,
  };
}
