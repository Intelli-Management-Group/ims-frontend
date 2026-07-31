import { useLiveQuery } from "@tanstack/react-db";
import {
  type FormBuilderSettings,
  formBuilderCollection,
} from "@/db-collections/form-builder.collections";

const defaultSettings: FormBuilderSettings = {
  validationMethod: "onDynamic",
  asyncValidation: 300,
};

export default function useSettings() {
  const { data } = useLiveQuery((q) =>
    q.from({ form: formBuilderCollection }).select(({ form }) => ({
      validationMethod: form.settings.validationMethod,
      asyncValidation: form.settings.asyncValidation,
    })),
  );
  return data?.[0] || defaultSettings;
}
