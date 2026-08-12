// form-elements-dropdown.tsx

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formElementsList } from "@/constants/form-elements-list";
import type { FormElement } from "@/db-collections/form-builder.collections";
import { addFormArrayField, appendElement } from "@/services/form-builder.service";
import { PlusIcon } from "@/components/ui/plus";

/**
 * Use for adding a nested form element
 */
export function FormElementsDropdown({
	fieldIndex,
	type = "MS",
	arrayId,
	j,
	isFormArrayField,
}: {
	fieldIndex?: number;
	arrayId?: string;
	type?: "FA" | "MS";
	j?: number;
	isFormArrayField?: boolean;
}) {
	const handleAddingElement = (fieldType: string) => {
		if (type === "MS" || isFormArrayField) {
			appendElement({
				fieldIndex,
				fieldType: fieldType as FormElement["fieldType"],
				j: isFormArrayField ? j : undefined,
			});
		} else {
			if (arrayId) {
				addFormArrayField(arrayId, fieldType as FormElement["fieldType"]);
			}
		}
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="icon" className="rounded-xl h-9">
					<PlusIcon />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent data-align="end" className="p-0">
				<ScrollArea className="h-64">
					<div className="space-y-3 p-3">
						{formElementsList
							.filter((o) => !o.static)
							.map((o) => (
								<DropdownMenuItem
									onSelect={() => handleAddingElement(o.fieldType)}
									key={o.name}
									disabled={!!o.static}
									className="px-4"
								>
									{o.name}
								</DropdownMenuItem>
							))}
					</div>
				</ScrollArea>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
