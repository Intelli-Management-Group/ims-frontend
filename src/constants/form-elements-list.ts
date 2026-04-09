import {
	Calendar,
	CheckSquare,
	ChevronDown,
	ListChecks,
	// ToggleLeft,
	Type,
	WrapText,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type FormElementsPaletteItem = {
	group: string;
	name: string;
	fieldType: string;
	icon: LucideIcon;
	static?: boolean;
	content?: string;
	type?: string;
	options?: { value: string; label: string }[];
	min?: number;
	max?: number;
	step?: number;
};

/**
 * used in
 * - form-elements-selector.tsx
 * - form-elements-selector-command.tsx
 */
export const formElementsList: FormElementsPaletteItem[] = [
	{
		group: "field",
		name: "Checkbox",
		fieldType: "Checkbox",
		icon: CheckSquare,
	},
	{
		group: "field",
		name: "Date Picker",
		fieldType: "DatePicker",
		icon: Calendar,
	},
	{
		group: "field",
		name: "Input",
		fieldType: "Input",
		icon: Type,
	},
	{
		group: "field",
		name: "Multi select",
		fieldType: "MultiSelect",
		icon: ListChecks,
		options: [
			{
				value: "1",
				label: "Option 1",
			},
			{
				value: "2",
				label: "Option 2",
			},
			{
				value: "3",
				label: "Option 3",
			},
			{
				value: "4",
				label: "Option 4",
			},
			{
				value: "5",
				label: "Option 5",
			},
		],
	},
	{
		group: "field",
		name: "Select",
		icon: ChevronDown,
		fieldType: "Select",
		options: [
			{
				value: "1",
				label: "Option 1",
			},
			{
				value: "2",
				label: "Option 2",
			},
		],
	},
	// {
	// 	group: "field",
	// 	name: "Switch",
	// 	fieldType: "Switch",
	// 	icon: ToggleLeft,
	// },
	{
		group: "field",
		name: "Textarea",
		fieldType: "Textarea",
		icon: WrapText,
	},
];
