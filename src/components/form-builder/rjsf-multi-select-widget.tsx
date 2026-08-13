import type { WidgetProps } from "@rjsf/utils";
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectItem,
  MultiSelectList,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@/components/ui/multi-select";

/**
 * RJSF widget for the builder's MultiSelect field.
 * @rjsf/shadcn's `select` widget is a native/single-select widget, so
 * `ui:options.multiple` is not enough to render the builder MultiSelect.
 */
export function RjsfMultiSelectWidget({
  id,
  value,
  disabled,
  readonly,
  onChange,
  onBlur,
  onFocus,
  options,
  rawErrors,
}: WidgetProps) {
  const selectedValues = Array.isArray(value) ? value : [];
  const enumOptions = options.enumOptions ?? [];

  const placeholder =
    typeof options.placeholder === 'string' && options.placeholder
      ? options.placeholder
      : 'Select items';

  return (
    <MultiSelect
      value={selectedValues}
      disabled={disabled || readonly}
      onValueChange={onChange}
      onOpenChange={(open) => {
        if (!open) {
          onBlur?.(id, selectedValues);
        }
      }}
    >
      <MultiSelectTrigger
        id={id}
        aria-invalid={rawErrors?.length ? true : undefined}
        onFocus={() => onFocus?.(id, selectedValues)}
      >
        <MultiSelectValue placeholder={placeholder} />
      </MultiSelectTrigger>

      <MultiSelectContent>
        <MultiSelectList>
          {enumOptions.map((option) => (
            <MultiSelectItem
              key={String(option.value)}
              value={String(option.value)}
            >
              {option.label}
            </MultiSelectItem>
          ))}
        </MultiSelectList>
      </MultiSelectContent>
    </MultiSelect>
  );
}
