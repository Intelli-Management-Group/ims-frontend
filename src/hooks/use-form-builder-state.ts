import { useLiveQuery } from "@tanstack/react-db";
import {
  type FormBuilder,
  type FormBuilderSettings,
  formBuilderCollection,
} from "@/db-collections/form-builder.collections";
import type { FormElements } from "@/db-collections/form-builder.collections";
import {
  DEFAULT_FORM_ELEMENTS,
  DEFAULT_FORM_SETTINGS,
} from "@/services/form-builder.service";

const defaultFormBuilderState: Omit<FormBuilder, "id"> = {
  formName: "",
  formElements: DEFAULT_FORM_ELEMENTS,
  settings: DEFAULT_FORM_SETTINGS,
};

type FormBuilderState = {
  formName: string;
  formElements: FormElements;
  settings: FormBuilderSettings;
};

export default function useFormBuilderState() {
  const { data } = useLiveQuery((q) =>
    q
      .from({ formBuilder: formBuilderCollection })
      .select(({ formBuilder }) => ({
        formName: formBuilder.formName,
        formElements: formBuilder.formElements,
        settings: formBuilder.settings,
      })),
  );

  return (data?.[0] ?? defaultFormBuilderState) as unknown as FormBuilderState;
}
