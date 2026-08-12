import { v4 as uuid } from "uuid";
import { defaultFormElements } from "@/constants/default-form-element";
import {
	type FormArray,
	type FormArrayEntry,
	type FormBuilderSettings,
	type FormElement,
	type FormElementList,
	type FormElements,
	formBuilderCollection,
} from "@/db-collections/form-builder.collections";
import { dropAtIndex } from "@/lib/form-elements-helpers";
import type {
	AppendElement,
	DropElement,
	EditElement,
	FormElementOrList,
	ReorderElements,
} from "@/types/form-types";

const FORM_ID = 1;

// ============================================================================
// Default Values
// ============================================================================

export const DEFAULT_FORM_SETTINGS: FormBuilderSettings = {
	validationMethod: "onDynamic",
	asyncValidation: 500,
};

export const DEFAULT_FORM_ELEMENTS: FormElementOrList[] = [];

// ============================================================================
// Type Guards
// ============================================================================

const isFormArray = (element: unknown): element is FormArray => {
	return (
		typeof element === "object" &&
		element !== null &&
		!Array.isArray(element) &&
		"arrayField" in element &&
		"fieldType" in element &&
		(element as FormArray).fieldType === "FormArray"
	);
};

const isFormArrayForm = (
	formElements: FormElements,
): formElements is FormArray[] => {
	return (
		Array.isArray(formElements) &&
		formElements.length > 0 &&
		isFormArray(formElements[0])
	);
};

// ============================================================================
// Error Handling
// ============================================================================

class FormBuilderError extends Error {
	code: string;

	constructor(message: string, code: string) {
		super(message);
		this.name = "FormBuilderError";
		this.code = code;
	}
}

const validateFieldIndex = (
	fields: FormElementList,
	fieldIndex: number,
): void => {
	if (fieldIndex < 0 || fieldIndex >= fields.length) {
		throw new FormBuilderError(
			`Invalid field index: ${fieldIndex}. Must be between 0 and ${fields.length - 1}`,
			"INVALID_FIELD_INDEX",
		);
	}
};

const validateFieldType = (
	fieldType: string,
): fieldType is keyof typeof defaultFormElements => {
	if (!(fieldType in defaultFormElements)) {
		throw new FormBuilderError(
			`Unknown field type: ${fieldType}`,
			"UNKNOWN_FIELD_TYPE",
		);
	}
	return true;
};

// ============================================================================
// Helper Functions
// ============================================================================

const syncEntriesForFormArray = (formArray: FormArray): FormArrayEntry[] => {
	return formArray.entries.map((entry: FormArrayEntry, entryIndex: number) => {
		const syncedFields = formArray.arrayField.map(
			(templateField: FormElement | FormElement[], index: number) => {
				if (Array.isArray(templateField)) {
					// Handle nested arrays
					if (Array.isArray(entry.fields[index])) {
						return templateField.map(
							(nestedTemplate: FormElement, nestedIndex: number) => {
								const existingNested = (entry.fields[index] as FormElement[])[
									nestedIndex
								];
								if (
									existingNested &&
									!Array.isArray(existingNested) &&
									existingNested.fieldType === nestedTemplate.fieldType
								) {
									const {
										id: _id,
										name: _name,
										...existingAttrs
									} = existingNested;
									return {
										...nestedTemplate,
										...existingAttrs,
										id: existingNested.id,
										name: `${formArray.name.replace(/-/g, "_")}[${entryIndex}].${nestedTemplate.name.replace(/-/g, "_")}`,
									};
								}
								return {
									...nestedTemplate,
									id: uuid(),
									name: `${formArray.name.replace(/-/g, "_")}[${entryIndex}].${nestedTemplate.name.replace(/-/g, "_")}`,
								};
							},
						);
					}
					return templateField.map((nestedTemplate: FormElement) => ({
						...nestedTemplate,
						id: uuid(),
						name: `${formArray.name.replace(/-/g, "_")}[${entryIndex}].${nestedTemplate.name.replace(/-/g, "_")}`,
					}));
				}
				// Handle single fields
				if (
					entry.fields[index] &&
					!Array.isArray(entry.fields[index]) &&
					(entry.fields[index] as FormElement).fieldType ===
					templateField.fieldType
				) {
					const existing = entry.fields[index] as FormElement;
					const { id: _id, name: _name, ...existingAttrs } = existing;
					return {
						...templateField,
						...existingAttrs,
						id: existing.id,
						name: `${formArray.name.replace(/-/g, "_")}[${entryIndex}].${templateField.name.replace(/-/g, "_")}`,
					};
				}
				return {
					...templateField,
					id: uuid(),
					name: `${formArray.name.replace(/-/g, "_")}[${entryIndex}].${templateField.name.replace(/-/g, "_")}`,
				};
			},
		);
		return { ...entry, fields: syncedFields };
	});
};

const getDefaultElementContent = (
	fieldType: keyof typeof defaultFormElements,
): string | undefined => {
	const element = defaultFormElements[fieldType];

	if (
		"content" in element &&
		typeof element.content === "string"
	) {
		return element.content;
	}

	return undefined;
};

// ============================================================================
// Query Operations
// ============================================================================

// ============================================================================
// Form Metadata Operations
// ============================================================================

/**
 * Set form name
 */
export const setFormName = (name: string): boolean => {
	try {
		formBuilderCollection.update(FORM_ID, (draft) => {
			draft.formName = name;
		});
		return true;
	} catch (error) {
		console.error("Failed to set form name:", error);
		return false;
	}
};

/**
 * Current template name from the local form-builder store (synchronous).
 * Use when saving so the name matches the latest `setFormName` write; the
 * `useLiveQuery` hook may not have re-rendered yet in the same tick.
 */
export function getStoredFormName(): string {
	try {
		return formBuilderCollection.get(FORM_ID)?.formName ?? "";
	} catch {
		return "";
	}
}

// ============================================================================
// Form Element CRUD Operations
// ============================================================================

/**
 * Append a new element to the form
 */
export const appendElement: AppendElement = (options) => {
	const { fieldIndex, fieldType, id, name, content, j, ...rest } = options || {
		fieldIndex: null,
	};
	validateFieldType(fieldType);

	try {
		formBuilderCollection.update(FORM_ID, (draft) => {

			const defaultElement = defaultFormElements[fieldType];
			const defaultContent = getDefaultElementContent(fieldType);

			const newFormElement = {
				id: id || uuid(),
				...defaultElement,

				...(defaultContent !== undefined
					? {
							content: content || defaultContent,
						}
					: {}),

				label:
					content ||
					("label" in defaultElement
						? defaultElement.label
						: undefined),

				name: name || `${fieldType}_${Date.now()}`,
				required: true,
				fieldType,
				...rest,
			};

			const formElements = draft.formElements as FormElementList;
			if (typeof fieldIndex === "number") {
				const existingElement = formElements[fieldIndex];
				if (j !== undefined && isFormArray(existingElement)) {
					const formArray = existingElement;
					const existingField = formArray.arrayField[j];
					if (Array.isArray(existingField)) {
						formArray.arrayField[j] = [...existingField, newFormElement];
					} else {
						formArray.arrayField[j] = [existingField, newFormElement];
					}
					formArray.entries = syncEntriesForFormArray(formArray);
				} else if (Array.isArray(existingElement)) {
					formElements[fieldIndex] = [...existingElement, newFormElement];
				} else {
					formElements[fieldIndex] = [existingElement, newFormElement];
				}
			} else {
				formElements.push(newFormElement);
			}
		});
	} catch (error) {
		console.error("Failed to append element:", error);
		throw error;
	}
};

/**
 * Drop (remove) an element from the form
 */
export const dropElement: DropElement = (options) => {
	const { j, fieldIndex } = options;

	try {
		formBuilderCollection.update(FORM_ID, (draft) => {
			const formElements = draft.formElements as FormElementList;
			if (typeof j === "number" && Array.isArray(formElements[fieldIndex])) {
				validateFieldIndex(formElements, fieldIndex);
				const existingElement = formElements[fieldIndex];
				if (Array.isArray(existingElement)) {
					if (j < 0 || j >= existingElement.length) {
						throw new FormBuilderError(
							`Invalid nested index: ${j}`,
							"INVALID_NESTED_INDEX",
						);
					}
					const [updatedArray] = dropAtIndex(existingElement, j);
					formElements[fieldIndex] =
						updatedArray.length === 1 ? updatedArray[0] : updatedArray;
				}
			} else {
				validateFieldIndex(formElements, fieldIndex);
				const updatedElements = dropAtIndex(formElements, fieldIndex);
				draft.formElements = updatedElements;
			}
		});
	} catch (error) {
		console.error("Failed to drop element:", error);
		throw error;
	}
};

/**
 * Edit an existing element
 */
export const editElement: EditElement = (options) => {
	const { j, fieldIndex, modifiedFormElement } = options;

	try {
		formBuilderCollection.update(FORM_ID, (draft) => {
			const formElements = draft.formElements as FormElementList;
			validateFieldIndex(formElements, fieldIndex);

			if (typeof j === "number" && Array.isArray(formElements[fieldIndex])) {
				const currentElement = formElements[fieldIndex];
				if (j < 0 || j >= currentElement.length) {
					throw new FormBuilderError(
						`Invalid nested index: ${j}`,
						"INVALID_NESTED_INDEX",
					);
				}
				currentElement[j] = {
					...currentElement[j],
					...modifiedFormElement,
				};
			} else {
				formElements[fieldIndex] = {
					...formElements[fieldIndex],
					...modifiedFormElement,
				};
			}
		});
	} catch (error) {
		console.error("Failed to edit element:", error);
		throw error;
	}
};

/**
 * Reorder form elements
 */
export const reorder: ReorderElements = (options) => {
	const { newOrder, fieldIndex } = options;

	try {
		formBuilderCollection.update(FORM_ID, (draft) => {
			if (typeof fieldIndex === "number") {
				const formElements = draft.formElements as FormElementList;
				validateFieldIndex(formElements, fieldIndex);
				formElements[fieldIndex] = newOrder;
			} else {
				draft.formElements = newOrder;
			}
		});
	} catch (error) {
		console.error("Failed to reorder elements:", error);
		throw error;
	}
};

/**
 * Reset form elements to empty
 */
export const resetFormElements = (): boolean => {
	try {
		formBuilderCollection.update(FORM_ID, (draft) => {
			draft.formElements = [];
		});
		return true;
	} catch (error) {
		console.error("Failed to reset form elements:", error);
		return false;
	}
};

// ============================================================================
// Form Array Operations
// ============================================================================

/**
 * Remove a form array
 */
export const removeFormArray = (id: string): boolean => {
	try {
		formBuilderCollection.update(FORM_ID, (draft) => {
			const findAndRemoveFormArray = <T extends FormElementOrList>(
				elements: T[],
			): T[] => {
				return elements.filter((el) => {
					if (isFormArray(el)) {
						return el.id !== id;
					}
					return true;
				});
			};

			if (isFormArrayForm(draft.formElements as FormElementList)) {
				draft.formElements = findAndRemoveFormArray(
					draft.formElements as FormElementList,
				);
			} else {
				draft.formElements = findAndRemoveFormArray(
					draft.formElements as FormElementList,
				);
			}
		});
		return true;
	} catch (error) {
		console.error("Failed to remove form array:", error);
		return false;
	}
};

/**
 * Update form array properties
 */
export const updateFormArrayProperties = (
	id: string,
	properties: Partial<FormArray>,
): boolean => {
	try {
		formBuilderCollection.update(FORM_ID, (draft) => {
			const findAndUpdateFormArray = <T extends FormElementOrList>(
				elements: T[],
			): void => {
				for (let i = 0; i < elements.length; i++) {
					const el = elements[i];
					if (isFormArray(el)) {
						if (el.id === id) {
							elements[i] = { ...el, ...properties } as T;
						}
					}
				}
			};

			if (isFormArrayForm(draft.formElements as FormElementList)) {
				findAndUpdateFormArray(draft.formElements as FormElementList);
			} else {
				findAndUpdateFormArray(draft.formElements as FormElementList);
			}
		});
		return true;
	} catch (error) {
		console.error("Failed to update form array properties:", error);
		return false;
	}
};

/**
 * Add a form array entry
 */
export const addFormArrayEntry = (arrayId: string): boolean => {
	try {
		formBuilderCollection.update(FORM_ID, (draft) => {
			const findAndUpdateFormArray = (elements: FormElementList): void => {
				for (let i = 0; i < elements.length; i++) {
					const el = elements[i];
					if (isFormArray(el)) {
						if (el.id === arrayId) {
							const formArray = el;
							const newEntry: FormArrayEntry = {
								id: uuid(),
								fields: formArray.arrayField.map((field) => {
									if (Array.isArray(field)) {
										return field.map((nestedField) => ({
											...nestedField,
											id: uuid(),
											name: `${formArray.name?.replace(/-/g, "_")}[${formArray.entries.length}].${nestedField.name.replace(/-/g, "_")}`,
										}));
									}
									return {
										...field,
										id: uuid(),
										name: `${formArray.name?.replace(/-/g, "_")}[${formArray.entries.length}].${field.name.replace(/-/g, "_")}`,
									};
								}),
							};
							formArray.entries.push(newEntry);
						}
					}
				}
			};

			if (isFormArrayForm(draft.formElements as FormElementList)) {
				findAndUpdateFormArray(draft.formElements as FormElementList);
			} else {
				findAndUpdateFormArray(draft.formElements as FormElementList);
			}
		});
		return true;
	} catch (error) {
		console.error("Failed to add form array entry:", error);
		return false;
	}
};

/**
 * Remove a form array entry
 */
export const removeFormArrayEntry = (
	arrayId: string,
	entryId: string,
): boolean => {
	try {
		formBuilderCollection.update(FORM_ID, (draft) => {
			const findAndUpdateFormArray = (elements: FormElementList): void => {
				for (let i = 0; i < elements.length; i++) {
					const el = elements[i];
					if (isFormArray(el)) {
						if (el.id === arrayId) {
							const formArray = el;
							if (
								formArray.entries.length > 0 &&
								formArray.entries[0].id === entryId
							) {
								throw new FormBuilderError(
									"Cannot delete the first entry (default entry) from FormArray",
									"CANNOT_DELETE_FIRST_ENTRY",
								);
							}
							formArray.entries = formArray.entries.filter(
								(entry) => entry.id !== entryId,
							);
						}
					}
				}
			};

			if (!draft.formElements) {
				return;
			}

			if (isFormArrayForm(draft.formElements)) {
				findAndUpdateFormArray(draft.formElements as FormElementList);
			} else {
				findAndUpdateFormArray(draft.formElements as FormElementList);
			}
		});
		return true;
	} catch (error) {
		console.error("Failed to remove form array entry:", error);
		return false;
	}
};

/**
 * Add a field to form array
 */
export const addFormArrayField = (
	arrayId: string,
	fieldType: FormElement["fieldType"],
): boolean => {
	if (!validateFieldType(fieldType)) {
		return false;
	}

	try {
		formBuilderCollection.update(FORM_ID, (draft) => {
			const templateElement = defaultFormElements[fieldType];
			const templateContent = getDefaultElementContent(fieldType);
			const newFormElement = {
				id: uuid(),
				...templateElement,

				...(templateContent !== undefined
					? {
							content: templateContent,
						}
					: {}),

				label:
					"label" in templateElement
						? templateElement.label
						: templateContent,

				name: `${fieldType}_${Date.now()}`.replace(/-/g, "_"),
				required: true,
				fieldType,
			} as FormElement;

			const findAndUpdateFormArray = (elements: FormElementList): void => {
				for (let i = 0; i < elements.length; i++) {
					const el = elements[i];
					if (isFormArray(el)) {
						if (el.id === arrayId) {
							const formArray = el;
							formArray.arrayField.push(newFormElement);
							formArray.entries = syncEntriesForFormArray(formArray);
						}
					}
				}
			};

			if (!draft.formElements) {
				return;
			}

			if (isFormArrayForm(draft.formElements)) {
				findAndUpdateFormArray(draft.formElements as FormElementList);
			} else {
				findAndUpdateFormArray(draft.formElements as FormElementList);
			}
		});
		return true;
	} catch (error) {
		console.error("Failed to add form array field:", error);
		return false;
	}
};

/**
 * Remove a field from form array
 */
export const removeFormArrayField = (
	arrayId: string,
	fieldIndex: number,
): boolean => {
	try {
		formBuilderCollection.update(FORM_ID, (draft) => {
			const findAndUpdateFormArray = (elements: FormElementList): void => {
				for (let i = 0; i < elements.length; i++) {
					const el = elements[i];
					if (isFormArray(el)) {
						if (el.id === arrayId) {
							const formArray = el;
							formArray.arrayField = formArray.arrayField.filter(
								(_, index) => index !== fieldIndex,
							);
							formArray.entries = syncEntriesForFormArray(formArray);
						}
					}
				}
			};

			if (isFormArrayForm(draft.formElements as FormElementList)) {
				findAndUpdateFormArray(draft.formElements as FormElementList);
			} else {
				findAndUpdateFormArray(draft.formElements as FormElementList);
			}
		});
		return true;
	} catch (error) {
		console.error("Failed to remove form array field:", error);
		return false;
	}
};

/**
 * Reorder form array fields
 */
export const reorderFormArrayFields = (
	arrayId: string,
	newOrder: FormElementList,
): boolean => {
	try {
		formBuilderCollection.update(FORM_ID, (draft) => {
			const findAndUpdateFormArray = (elements: FormElementList): void => {
				for (let i = 0; i < elements.length; i++) {
					const el = elements[i];
					if (isFormArray(el)) {
						if (el.id === arrayId) {
							const formArray = el;
							formArray.arrayField = newOrder;
							formArray.entries = syncEntriesForFormArray(formArray);
						}
					}
				}
			};

			if (isFormArrayForm(draft.formElements as FormElementList)) {
				findAndUpdateFormArray(draft.formElements as FormElementList);
			} else {
				findAndUpdateFormArray(draft.formElements as FormElementList);
			}
		});
		return true;
	} catch (error) {
		console.error("Failed to reorder form array fields:", error);
		return false;
	}
};

/**
 * Sync form array entries with template
 */
const syncFormArrayEntries = (arrayId: string): boolean => {
	try {
		formBuilderCollection.update(FORM_ID, (draft) => {
			const findAndSyncFormArray = (elements: FormElementList): void => {
				for (let i = 0; i < elements.length; i++) {
					const el = elements[i];
					if (isFormArray(el)) {
						if (el.id === arrayId) {
							const formArray = el;
							formArray.entries = syncEntriesForFormArray(formArray);
						}
					}
				}
			};

			if (isFormArrayForm(draft.formElements as FormElementList)) {
				findAndSyncFormArray(draft.formElements as FormElementList);
			} else {
				findAndSyncFormArray(draft.formElements as FormElementList);
			}
		});
		return true;
	} catch (error) {
		console.error("Failed to sync form array entries:", error);
		return false;
	}
};

/**
 * Update form array template (arrayField)
 */
export const updateFormArray = (
	id: string,
	arrayField: FormElementList,
): boolean => {
	try {
		formBuilderCollection.update(FORM_ID, (draft) => {
			const findAndUpdateFormArray = (elements: FormElementList): void => {
				for (let i = 0; i < elements.length; i++) {
					const el = elements[i];
					if (isFormArray(el)) {
						if (el.id === id) {
							el.arrayField = arrayField;
						}
					}
				}
			};

			if (!draft.formElements) {
				return;
			}

			if (isFormArrayForm(draft.formElements as FormElementList)) {
				findAndUpdateFormArray(draft.formElements as FormElementList);
			} else {
				findAndUpdateFormArray(draft.formElements as FormElementList);
			}
		});
		// Auto-sync entries when template changes
		syncFormArrayEntries(id);
		return true;
	} catch (error) {
		console.error("Failed to update form array:", error);
		return false;
	}
};

/**
 * Update a specific field within a form array (both template and entries)
 */
export const updateFormArrayField = (
	arrayId: string,
	fieldIndex: number,
	updatedField: Partial<FormElement>,
	nestedIndex?: number,
	updateTemplate = true,
): boolean => {
	try {
		formBuilderCollection.update(FORM_ID, (draft) => {
			const findAndUpdateFormArray = (elements: FormElementList): void => {
				for (let i = 0; i < elements.length; i++) {
					const el = elements[i];
					if (isFormArray(el)) {
						if (el.id === arrayId) {
							const formArray = el;

							// Update template if requested
							if (updateTemplate) {
								if (nestedIndex !== undefined) {
									const currentField = formArray.arrayField[fieldIndex];
									if (Array.isArray(currentField)) {
										currentField[nestedIndex] = {
											...currentField[nestedIndex],
											...updatedField,
										};
									} else {
										formArray.arrayField[fieldIndex] = {
											...currentField,
											...updatedField,
										};
									}
								} else {
									const currentField = formArray.arrayField[fieldIndex];
									if (!Array.isArray(currentField)) {
										formArray.arrayField[fieldIndex] = {
											...currentField,
											...updatedField,
										};
									}
								}
							}

							// Update all entries
							for (const entry of formArray.entries) {
								const currentField = entry.fields[fieldIndex];
								if (nestedIndex !== undefined && Array.isArray(currentField)) {
									currentField[nestedIndex] = {
										...currentField[nestedIndex],
										...updatedField,
									};
								} else if (!Array.isArray(currentField)) {
									entry.fields[fieldIndex] = {
										...currentField,
										...updatedField,
									};
								}
							}
						}
					}
				}
			};

			if (!draft.formElements) {
				return;
			}

			if (isFormArrayForm(draft.formElements as FormElementList)) {
				findAndUpdateFormArray(draft.formElements as FormElementList);
			} else {
				findAndUpdateFormArray(draft.formElements as FormElementList);
			}
		});

		// Sync entries if we updated the template
		if (updateTemplate) {
			syncFormArrayEntries(arrayId);
		}
		return true;
	} catch (error) {
		console.error("Failed to update form array field:", error);
		return false;
	}
};

// ============================================================================
// Template Loading
// ============================================================================

/**
 * Hydrate the form builder store from a saved template.
 * Replaces any current formElements and sets the template name.
 */
export function loadFormTemplate(
	name: string,
	formElements: FormElementOrList[],
): boolean {
	try {
		formBuilderCollection.update(FORM_ID, (draft) => {
			draft.formName = name;
			draft.formElements = formElements;
		});
		return true;
	} catch (error) {
		console.error("Failed to load form template:", error);
		return false;
	}
}

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initialize the form builder store with defaults
 */
export function initializeFormBuilder(): boolean {
	try {
		try {
			const existing = formBuilderCollection.get(FORM_ID);
			if (existing) {
				return true;
			}
		} catch (_error) {
			localStorage.removeItem("form-builder");
		}

		formBuilderCollection.insert([
			{
				id: FORM_ID,
				formName: "",
				formElements: DEFAULT_FORM_ELEMENTS,
				settings: DEFAULT_FORM_SETTINGS,
			},
		]);
		return true;
	} catch (error) {
		console.error("Failed to initialize form builder:", error);
		return false;
	}
}

/**
 * Reset the form builder store to empty defaults.
 * Use when opening a new (blank) template so stale data from a
 * previously-edited template is cleared.
 */
export function resetFormBuilder(): boolean {
	try {
		initializeFormBuilder();
		formBuilderCollection.update(FORM_ID, (draft) => {
			draft.formName = "";
			draft.formElements = DEFAULT_FORM_ELEMENTS;
			draft.settings = DEFAULT_FORM_SETTINGS;
		});
		return true;
	} catch (error) {
		console.error("Failed to reset form builder:", error);
		return false;
	}
}

