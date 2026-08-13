import { v4 as uuid } from "uuid";
import type { FormElement, Option } from "@/types/form-types";
import type {
	FormArray,
	FormElementOrList,
} from "@/db-collections/form-builder.collections";
import { PRIORITY_VALUES } from "@/constants/priority-options";

type JsonProp = Record<string, unknown>;
type RjsfUiSchema = Record<string, unknown>;

// ============================================================================
// Small helpers
// ============================================================================

function asString(v: unknown): string {
	return typeof v === "string" ? v : "";
}

function asNumber(v: unknown, fallback: number): number {
	return typeof v === "number" ? v : fallback;
}

function asOptions(
	enumValues: unknown,
	enumNames: unknown,
): Option[] {
	const values = Array.isArray(enumValues)
		? (enumValues as unknown[]).map(asString)
		: [];
	const labels = Array.isArray(enumNames)
		? (enumNames as unknown[]).map(asString)
		: [];
	return values.map((value, i) => ({
		value,
		label: labels[i] ?? value,
	}));
}

function getUiWidget(ui: RjsfUiSchema | undefined, key: string): string {
	if (!ui) return "";
	const entry = ui[key];
	if (!entry || typeof entry !== "object") return "";
	return asString((entry as RjsfUiSchema)["ui:widget"]);
}

function getUiOptions(
	ui: RjsfUiSchema | undefined,
	key: string,
): RjsfUiSchema {
	if (!ui) return {};
	const entry = ui[key];
	if (!entry || typeof entry !== "object") return {};
	const opts = (entry as RjsfUiSchema)["ui:options"];
	return opts && typeof opts === "object" ? (opts as RjsfUiSchema) : {};
}

function getUiPlaceholder(
	ui: RjsfUiSchema | undefined,
	key: string,
): string | undefined {
	if (!ui) return undefined;
	const entry = ui[key];
	if (!entry || typeof entry !== "object") return undefined;
	const ph = (entry as RjsfUiSchema)["ui:placeholder"];
	return typeof ph === "string" ? ph : undefined;
}

// ============================================================================
// Determine fieldType and reconstruct a FormElement from one JSON Schema property
// ============================================================================

function buildFormElement(
	key: string,
	prop: JsonProp,
	ui: RjsfUiSchema | undefined,
	requiredKeys: string[],
): FormElement | null {
	const type = asString(prop.type);
	const format = asString(prop.format);
	const widget = getUiWidget(ui, key);
	const uiOptions = getUiOptions(ui, key);
	const placeholder = getUiPlaceholder(ui, key);
	const title = asString(prop.title);
	const description =
		typeof prop.description === "string" ? prop.description : undefined;
	const required = requiredKeys.includes(key);

	const base = {
		id: uuid(),
		name: key,
		label: title || key,
		...(description ? { description } : {}),
		required,
	};

	// ---- OTP: string with equal minLength/maxLength and inputType option ----
	if (
		type === "string" &&
		typeof prop.minLength === "number" &&
		typeof prop.maxLength === "number" &&
		prop.minLength === prop.maxLength &&
		uiOptions.inputType === "password"
	) {
		return {
			...base,
			fieldType: "OTP",
			maxLength: prop.maxLength,
		} as FormElement;
	}

	// ---- Password ----
	if (type === "string" && widget === "password") {
		return {
			...base,
			fieldType: "Password",
			type: "password",
		} as FormElement;
	}

	// ---- Textarea ----
	if (type === "string" && widget === "textarea") {
		const rows = typeof uiOptions.rows === "number" ? uiOptions.rows : undefined;
		return {
			...base,
			fieldType: "Textarea",
			...(rows !== undefined ? { rows } : {}),
		} as FormElement;
	}

	// ---- DatePicker ----
	if (type === "string" && format === "date") {
		return {
			...base,
			fieldType: "DatePicker",
		} as FormElement;
	}

	// ---- Date range picker ----
	if (type === "object" && prop.properties && typeof prop.properties === "object") {
		const properties = prop.properties as Record<string, JsonProp>;
		if (properties.start && properties.end) {
			return {
				...base,
				fieldType: "DateRangePicker",
			} as FormElement;
		}
	}

	// ---- TimePicker ----
	if (type === "string" && format === "time") {
		return {
			...base,
			fieldType: "TimePicker",
		} as FormElement;
	}

	// ---- Input (email) ----
	if (type === "string" && format === "email") {
		return {
			...base,
			fieldType: "Input",
			type: "email",
		} as FormElement;
	}

	// ---- Input (number) ----
	if (type === "number") {
		return {
			...base,
			fieldType: "Input",
			type: "number",
		} as FormElement;
	}

	// ---- Slider ----
	if (type === "integer" && widget === "range") {
		return {
			...base,
			fieldType: "Slider",
			min: asNumber(prop.minimum, 1),
			max: asNumber(prop.maximum, 100),
		} as FormElement;
	}

	// ---- Boolean types ----
	if (type === "boolean") {
		// Both Checkbox and Switch produce identical schemas; default to Checkbox.
		return {
			...base,
			fieldType: "Checkbox",
		} as FormElement;
	}

	// ---- Array types (MultiSelect, ToggleGroup multiple) ----
	if (type === "array") {
		const items = prop.items;
		if (items && typeof items === "object" && !Array.isArray(items)) {
			const itemProp = items as JsonProp;
			const enumValues = itemProp.enum;
			const enumNames = itemProp.enumNames;

			// MultiSelect: dedicated widget or legacy select + options.multiple
			if (widget === "multiSelect" || widget === "select" || uiOptions.multiple === true) {
				return {
					...base,
					fieldType: "MultiSelect",
					options: asOptions(enumValues, enumNames),
					placeholder: placeholder ?? "",
				} as FormElement;
			}

			// ToggleGroup multiple: widget=checkboxes
			if (widget === "checkboxes") {
				return {
					...base,
					fieldType: "ToggleGroup",
					type: "multiple",
					options: asOptions(enumValues, enumNames),
				} as FormElement;
			}

			// Fallback for arrays with enum items
			if (Array.isArray(enumValues)) {
				return {
					...base,
					fieldType: "MultiSelect",
					options: asOptions(enumValues, enumNames),
					placeholder: placeholder ?? "",
				} as FormElement;
			}
		}
		// Array items = object → handled as FormArray at call site; return null here
		return null;
	}

	// ---- Priority: string enum matching the fixed low/medium/high/critical set ----
	if (type === "string" && Array.isArray(prop.enum)) {
		const enumValues = (prop.enum as unknown[]).map(asString);
		const isPriorityEnum =
			enumValues.length === PRIORITY_VALUES.length &&
			PRIORITY_VALUES.every((value) => enumValues.includes(value));

		if (isPriorityEnum) {
			return {
				...base,
				fieldType: "Priority",
			} as FormElement;
		}
	}

	// ---- String with enum: Select, RadioGroup, ToggleGroup single ----
	if (type === "string" && Array.isArray(prop.enum)) {
		const options = asOptions(prop.enum, prop.enumNames);

		if (widget === "select") {
			return {
				...base,
				fieldType: "Select",
				options,
				placeholder: placeholder ?? "",
			} as FormElement;
		}

		if (widget === "radio") {
			return {
				...base,
				fieldType: "RadioGroup",
				options,
			} as FormElement;
		}

		// Default enum string → Select
		return {
			...base,
			fieldType: "Select",
			options,
			placeholder: placeholder ?? "",
		} as FormElement;
	}

	// ---- Plain string Input ----
	if (type === "string") {
		return {
			...base,
			fieldType: "Input",
			type: "text",
			...(placeholder !== undefined ? { placeholder } : {}),
		} as FormElement;
	}

	return null;
}

// ============================================================================
// Reconstruct a FormArray from an array-of-objects property
// ============================================================================

function buildFormArray(
	key: string,
	prop: JsonProp,
	ui: RjsfUiSchema | undefined,
	requiredKeys: string[],
): FormArray | null {
	const items = prop.items;
	if (
		!items ||
		typeof items !== "object" ||
		Array.isArray(items) ||
		(items as JsonProp).type !== "object"
	) {
		return null;
	}

	const itemProp = items as JsonProp;
	const itemProperties = itemProp.properties;
	const itemRequired = Array.isArray(itemProp.required)
		? (itemProp.required as string[])
		: [];

	if (!itemProperties || typeof itemProperties !== "object") {
		return null;
	}

	// Determine field order from items ui:order if present
	const arrUi = ui?.[key];
	const itemsUi =
		arrUi && typeof arrUi === "object"
			? ((arrUi as RjsfUiSchema).items as RjsfUiSchema | undefined)
			: undefined;
	const itemOrder = Array.isArray(itemsUi?.["ui:order"])
		? (itemsUi!["ui:order"] as string[])
		: Object.keys(itemProperties as object);

	const arrayField: FormElementOrList[] = [];

	for (const innerKey of itemOrder) {
		const innerProp = (itemProperties as Record<string, JsonProp>)[innerKey];
		if (!innerProp) continue;

		const innerUiScope: RjsfUiSchema | undefined = itemsUi
			? itemsUi
			: undefined;

		const el = buildFormElement(
			innerKey,
			innerProp,
			innerUiScope,
			itemRequired,
		);
		if (el) {
			arrayField.push(el);
		}
	}

	const title = asString(prop.title);
	const description =
		typeof prop.description === "string" ? prop.description : undefined;
	const required = requiredKeys.includes(key);

	return {
		fieldType: "FormArray",
		id: uuid(),
		name: key,
		label: title || key,
		...(description ? { description } : {}),
		required,
		arrayField,
		entries: [],
	} as unknown as FormArray;
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Reverse-map a saved RJSF JSON Schema + UI Schema back into the form builder's
 * `FormElementOrList[]` representation, so a stored template can be loaded into
 * the editor for modification.
 *
 * This is the inverse of `generateRjsfJsonSchema` + `generateFormUiSchema`.
 */
export function reverseMapRjsfToFormElements(
	jsonSchema: unknown,
	uiSchema: unknown,
): FormElementOrList[] {
	if (
		!jsonSchema ||
		typeof jsonSchema !== "object" ||
		Array.isArray(jsonSchema)
	) {
		return [];
	}

	const schema = jsonSchema as JsonProp;
	const properties = schema.properties;
	if (!properties || typeof properties !== "object") {
		return [];
	}

	const ui = uiSchema && typeof uiSchema === "object" && !Array.isArray(uiSchema)
		? (uiSchema as RjsfUiSchema)
		: undefined;

	const requiredKeys = Array.isArray(schema.required)
		? (schema.required as string[])
		: [];

	// Respect ui:order when iterating
	const order = Array.isArray(ui?.["ui:order"])
		? (ui!["ui:order"] as string[])
		: Object.keys(properties as object);

	const result: FormElementOrList[] = [];

	for (const key of order) {
		const prop = (properties as Record<string, JsonProp>)[key];
		if (!prop || typeof prop !== "object") continue;

		const type = asString(prop.type);

		// Array-of-objects → FormArray
		if (type === "array") {
			const items = prop.items;
			if (
				items &&
				typeof items === "object" &&
				!Array.isArray(items) &&
				(items as JsonProp).type === "object"
			) {
				const formArray = buildFormArray(key, prop, ui, requiredKeys);
				if (formArray) {
					result.push(formArray as unknown as FormElementOrList);
				}
				continue;
			}
		}

		const el = buildFormElement(key, prop, ui, requiredKeys);
		if (el) {
			result.push(el);
		}
	}

	return result;
}
