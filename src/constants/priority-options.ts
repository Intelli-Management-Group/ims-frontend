import type { Option } from "@/types/form-types";

/**
 * Fixed set of choices for the "Priority" field type.
 * Keep these values in sync with the backend's allowed `priority` values:
 * "low" | "medium" | "high" | "critical".
 */
export const PRIORITY_OPTIONS: Option[] = [
	{ value: "low", label: "Low" },
	{ value: "medium", label: "Medium" },
	{ value: "high", label: "High" },
	{ value: "critical", label: "Critical" },
];

export const PRIORITY_VALUES = PRIORITY_OPTIONS.map((o) => o.value) as [
	string,
	...string[],
];
