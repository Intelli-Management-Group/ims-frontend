import {
	createCollection,
	localStorageCollectionOptions,
} from "@tanstack/react-db";
import * as v from "valibot";

const FormBuilderSettingsSchema = v.object({
	validationMethod: v.optional(
		v.picklist(["onChange", "onBlur", "onDynamic"]),
		"onDynamic",
	),
	asyncValidation: v.optional(
		v.pipe(v.number(), v.minValue(0), v.maxValue(10000)),
		500,
	),
});

// ============================================================================
// Form Elements Schema
// ============================================================================

const OptionSchema = v.object({
	value: v.string(),
	label: v.string(),
});

// Common HTML attributes that might be stored
const CommonHtmlProps = v.object({
	placeholder: v.optional(v.string()),
	disabled: v.optional(v.boolean()),
	className: v.optional(v.string()),
	defaultValue: v.optional(v.union([v.string(), v.number(), v.boolean()])),
});

const SharedFormPropsSchema = v.object({
	...CommonHtmlProps.entries,
	id: v.string(),
	name: v.string(),
	label: v.optional(v.string()),
	description: v.optional(v.string()),
	required: v.optional(v.boolean()),
	static: v.optional(v.boolean()),
});

// Field Types
const InputSchema = v.object({
	...SharedFormPropsSchema.entries,
	fieldType: v.literal("Input"),
	type: v.optional(v.string()), // HTML input type
});

const PasswordInputSchema = v.object({
	...SharedFormPropsSchema.entries,
	fieldType: v.literal("Password"),
	type: v.literal("password"),
});

const OTPInputSchema = v.object({
	...SharedFormPropsSchema.entries,
	fieldType: v.literal("OTP"),
	children: v.optional(v.any()), // ReactNode is hard to validate, allowing any for children if stored
});

const TextareaSchema = v.object({
	...SharedFormPropsSchema.entries,
	fieldType: v.literal("Textarea"),
});

const CheckboxSchema = v.object({
	...SharedFormPropsSchema.entries,
	fieldType: v.literal("Checkbox"),
	checked: v.optional(v.boolean()),
});

const RadioGroupSchema = v.object({
	...SharedFormPropsSchema.entries,
	fieldType: v.literal("RadioGroup"),
	options: v.array(OptionSchema),
});

const ToggleGroupSchema = v.object({
	...SharedFormPropsSchema.entries,
	fieldType: v.literal("ToggleGroup"),
	options: v.array(OptionSchema),
	type: v.union([v.literal("single"), v.literal("multiple")]),
});

const SwitchSchema = v.object({
	...SharedFormPropsSchema.entries,
	fieldType: v.literal("Switch"),
	checked: v.optional(v.boolean()),
});

const SliderSchema = v.object({
	...SharedFormPropsSchema.entries,
	fieldType: v.literal("Slider"),
	min: v.optional(v.number()),
	max: v.optional(v.number()),
	step: v.optional(v.number()),
	value: v.optional(v.array(v.number())),
});

const SelectSchema = v.object({
	...SharedFormPropsSchema.entries,
	fieldType: v.literal("Select"),
	options: v.array(OptionSchema),
	placeholder: v.string(),
});

const PrioritySchema = v.object({
  ...SharedFormPropsSchema.entries,
  fieldType: v.literal("Priority"),
});

const MultiSelectSchema = v.object({
	...SharedFormPropsSchema.entries,
	fieldType: v.literal("MultiSelect"),
	options: v.array(OptionSchema),
	placeholder: v.string(),
});

const DatePickerSchema = v.object({
	...SharedFormPropsSchema.entries,
	fieldType: v.literal("DatePicker"),
});

const DateRangePickerSchema = v.object({
	...SharedFormPropsSchema.entries,
	fieldType: v.literal("DateRangePicker"),
	value: v.optional(
		v.object({
			start: v.optional(v.string()),
			end: v.optional(v.string()),
		}),
	),
});

const TimePickerSchema = v.object({
	...SharedFormPropsSchema.entries,
	fieldType: v.literal("TimePicker"),
	step: v.optional(v.number()),
});

// Static Elements
const StaticBaseSchema = v.object({
	id: v.string(),
	name: v.string(),
	static: v.literal(true),
	content: v.optional(v.string()),
});

const H1Schema = v.object({
	...StaticBaseSchema.entries,
	fieldType: v.literal("H1"),
	content: v.string(),
});

const H2Schema = v.object({
	...StaticBaseSchema.entries,
	fieldType: v.literal("H2"),
	content: v.string(),
});

const H3Schema = v.object({
	...StaticBaseSchema.entries,
	fieldType: v.literal("H3"),
	content: v.string(),
});

const DividerSchema = v.object({
	...StaticBaseSchema.entries,
	fieldType: v.literal("Separator"),
});

const DescriptionSchema = v.object({
	...StaticBaseSchema.entries,
	fieldType: v.literal("FieldDescription"),
	content: v.string(),
});

const LegendSchema = v.object({
	...StaticBaseSchema.entries,
	fieldType: v.literal("FieldLegend"),
	content: v.string(),
});

// Recursive Structures
// We need to define types for recursion
export type FormElement = v.InferOutput<typeof FormElementSchema>;
export type FormElementOrList = FormElement | FormElement[];
export type FormElementList = FormElementOrList[];

const FormElementSchema: v.GenericSchema<any> = v.lazy(() =>
	v.union([
		InputSchema,
		PasswordInputSchema,
		OTPInputSchema,
		TextareaSchema,
		CheckboxSchema,
		RadioGroupSchema,
		ToggleGroupSchema,
		SwitchSchema,
		SliderSchema,
		SelectSchema,
		PrioritySchema,
		MultiSelectSchema,
		DatePickerSchema,
		DateRangePickerSchema,
		TimePickerSchema,
		H1Schema,
		H2Schema,
		H3Schema,
		DividerSchema,
		DescriptionSchema,
		LegendSchema,
		FormArraySchema,
	]),
);

const FormElementOrListSchema = v.lazy(() =>
	v.union([FormElementSchema, v.array(FormElementSchema)]),
);

const FormElementListSchema = v.array(FormElementOrListSchema);

const FormArrayEntrySchema = v.object({
	id: v.string(),
	fields: FormElementListSchema,
});

const FormArraySchema = v.object({
	fieldType: v.literal("FormArray"),
	id: v.string(),
	name: v.string(),
	label: v.optional(v.string()),
	arrayField: FormElementListSchema,
	entries: v.array(FormArrayEntrySchema),
});

// ============================================================================
// Unified Form Builder Schema
// ============================================================================
// const FormElementsSchema = v.custom((input) => {
// 	// Allow any array-like structure for formElements
// 	return Array.isArray(input);
// }, "FormElements must be an array");

const FormElementsSchema = FormElementListSchema;

const FormBuilderSchema = v.object({
	id: v.number(),
	formName: v.optional(v.string(), ""),
	formElements: v.optional(FormElementsSchema, []),
	settings: v.optional(FormBuilderSettingsSchema, {}),
});

// ============================================================================
// Type Exports
// ============================================================================

export type FormBuilder = v.InferOutput<typeof FormBuilderSchema>;
export type FormBuilderSettings = v.InferOutput<
	typeof FormBuilderSettingsSchema
>;

export type FormArray = v.InferOutput<typeof FormArraySchema>;
export type FormArrayEntry = v.InferOutput<typeof FormArrayEntrySchema>;
export type FormElements = v.InferOutput<typeof FormElementsSchema>;

// ============================================================================
// Collection Setup
// ============================================================================

const formBuilderCollection = createCollection(
	localStorageCollectionOptions({
		storageKey: "form-builder",
		getKey: (formBuilder) => formBuilder.id,
		schema: FormBuilderSchema,
	}),
);

export { formBuilderCollection };
