export const PRIORITY_SCHEMA_FIELD_TYPE = "x-field-type";
export const PRIORITY_SCHEMA_FIELD_VALUE = "Priority";

/**
 * Finds the key of the Priority field within a template's JSON schema, if one
 * exists. The Priority field is identified by explicit schema metadata rather
 * than by name or enum values, since ordinary Select fields can use the same
 * values.
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

		if (
			(value as Record<string, unknown>)[PRIORITY_SCHEMA_FIELD_TYPE] ===
			PRIORITY_SCHEMA_FIELD_VALUE
		) {
			return key;
		}
	}

	return undefined;
}
