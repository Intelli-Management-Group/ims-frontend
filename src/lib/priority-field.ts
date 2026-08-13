import { PRIORITY_VALUES } from "@/constants/priority-options";

/**
 * Finds the key of the Priority field within a template's JSON schema, if one
 * exists. The Priority field is identified by its fixed enum
 * (low/medium/high/critical) rather than by name, since the builder assigns
 * auto-generated field names (e.g. "Priority_1786601241395").
 *
 * Priority is never stored in `content` — its value must always be pulled out
 * of the RJSF form data and sent as the submission's top-level `priority`
 * attribute instead. This helper is shared by the fill page and the edit page
 * so both extract/strip it the same way.
 */
export function getPriorityFieldKey(
	schema: Record<string, unknown> | undefined | null,
): string | undefined {
	const properties = schema?.properties;
	if (!properties || typeof properties !== "object") return undefined;

	for (const [key, value] of Object.entries(
		properties as Record<string, unknown>,
	)) {
		if (!value || typeof value !== "object") continue;

		const enumValues = (value as Record<string, unknown>).enum;
		if (!Array.isArray(enumValues)) continue;

		const stringValues = enumValues.filter(
			(item): item is string => typeof item === "string",
		);
		if (stringValues.length !== PRIORITY_VALUES.length) continue;

		const isPriorityEnum = PRIORITY_VALUES.every((priority) =>
			stringValues.includes(priority),
		);
		if (isPriorityEnum) return key;
	}

	return undefined;
}
