import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { useFormFillPage } from "./useFormFillPage";
import { formTemplatesApi } from "@/api/form-templates";
import { formSubmissionsApi } from "@/api/form-submissions";

const mockNavigate = vi.fn();
const mockSetBreadcrumbs = vi.fn();

vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => mockNavigate,
}));

vi.mock("@/hooks/use-breadcrumb", () => ({
	useBreadcrumb: () => ({ setBreadcrumbs: mockSetBreadcrumbs }),
}));

vi.mock("@/api/form-templates", () => ({
	formTemplatesApi: {
		getFormTemplate: vi.fn(),
	},
}));

vi.mock("@/api/form-submissions", () => ({
	formSubmissionsApi: {
		createFormSubmission: vi.fn(),
	},
}));

vi.mock("sonner", () => ({
	toast: {
		error: vi.fn(),
		success: vi.fn(),
	},
}));

function createWrapper() {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	});
	return ({ children }: { children: ReactNode }) => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
}

const sampleTemplate = {
	id: 1,
	name: "Onboarding",
	json_schema: {},
	ui_schema: {},
	current_version: {
		id: 10,
	},
};

describe("useFormFillPage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("redirects to /forms and shows an error toast for an invalid template id", async () => {
		renderHook(() => useFormFillPage("not-a-number"), {
			wrapper: createWrapper(),
		});

		await waitFor(() => {
			expect(toast.error).toHaveBeenCalledWith("Invalid template ID");
			expect(mockNavigate).toHaveBeenCalledWith({ to: "/forms" });
		});
	});

	it("does not redirect and fetches the template for a valid numeric id", async () => {
		vi.mocked(formTemplatesApi.getFormTemplate).mockResolvedValue(
			sampleTemplate as any,
		);

		renderHook(() => useFormFillPage("1"), { wrapper: createWrapper() });

		await waitFor(() => {
			expect(formTemplatesApi.getFormTemplate).toHaveBeenCalledWith(1);
		});
		expect(toast.error).not.toHaveBeenCalledWith("Invalid template ID");
		expect(mockNavigate).not.toHaveBeenCalled();
	});

	it("sets breadcrumbs once the template loads and clears them on unmount", async () => {
		vi.mocked(formTemplatesApi.getFormTemplate).mockResolvedValue(
			sampleTemplate as any,
		);

		const { unmount } = renderHook(() => useFormFillPage("1"), {
			wrapper: createWrapper(),
		});

		await waitFor(() => {
			expect(mockSetBreadcrumbs).toHaveBeenCalledWith([
				{ label: "Forms", path: "/forms" },
				{ label: "Onboarding", path: "/forms/1" },
			]);
		});

		unmount();
		expect(mockSetBreadcrumbs).toHaveBeenLastCalledWith(null);
	});

	it("shows an error toast and redirects when the template fails to load", async () => {
		vi.mocked(formTemplatesApi.getFormTemplate).mockRejectedValue(
			new Error("boom"),
		);

		renderHook(() => useFormFillPage("1"), { wrapper: createWrapper() });

		await waitFor(() => {
			expect(toast.error).toHaveBeenCalledWith("Failed to load form template");
			expect(mockNavigate).toHaveBeenCalledWith({ to: "/forms" });
		});
	});

	it("blocks submission and flags the error when the form name is empty", () => {
		const { result } = renderHook(() => useFormFillPage("1"), {
			wrapper: createWrapper(),
		});

		act(() => {
			result.current.handleSubmit({ formData: { foo: "bar" } } as any);
		});

		expect(toast.error).toHaveBeenCalledWith("Please enter a form name");
		expect(formSubmissionsApi.createFormSubmission).not.toHaveBeenCalled();
		expect(result.current.formNameError).toBe(true);
	});

	it("clears the form name error once the user starts typing again", () => {
		const { result } = renderHook(() => useFormFillPage("1"), {
			wrapper: createWrapper(),
		});

		act(() => {
			result.current.handleSubmit({ formData: {} } as any);
		});
		expect(result.current.formNameError).toBe(true);

		act(() => {
			result.current.handleFormNameChange("a");
		});
		expect(result.current.formNameError).toBe(false);
	});

	// it("submits a trimmed form name and content, then navigates on success", async () => {
	// 	vi.mocked(formSubmissionsApi.createFormSubmission).mockResolvedValue(
	// 		{} as any,
	// 	);

	// 	const { result } = renderHook(() => useFormFillPage("1"), {
	// 		wrapper: createWrapper(),
	// 	});

	// 	act(() => {
	// 		result.current.handleFormNameChange("  My Submission  ");
	// 	});
	// 	act(() => {
	// 		result.current.handleSubmit({ formData: { foo: "bar" } } as any);
	// 	});

	// 	await waitFor(() => {
	// 		expect(formSubmissionsApi.createFormSubmission).toHaveBeenCalledWith({
	// 			form_template_id: 1,
	// 			form_name: "My Submission",
	// 			content: { foo: "bar" },
	// 		});
	// 	});

	// 	await waitFor(() => {
	// 		expect(toast.success).toHaveBeenCalledWith("Form submitted successfully");
	// 		expect(mockNavigate).toHaveBeenCalledWith({ to: "/forms" });
	// 	});
	// });

	it("submits a trimmed form name and content, then navigates on success", async () => {
		vi.mocked(formTemplatesApi.getFormTemplate).mockResolvedValue(
			sampleTemplate as any,
		);

		vi.mocked(formSubmissionsApi.createFormSubmission).mockResolvedValue(
			{} as any,
		);

		const { result } = renderHook(() => useFormFillPage("1"), {
			wrapper: createWrapper(),
		});

		// Wait until the template has been loaded
		await waitFor(() => {
			expect(formTemplatesApi.getFormTemplate).toHaveBeenCalledWith(1);
		});

		act(() => {
			result.current.handleFormNameChange("  My Submission  ");
		});

		act(() => {
			result.current.handleSubmit({
				formData: { foo: "bar" },
			} as any);
		});

		await waitFor(() => {
		expect(formSubmissionsApi.createFormSubmission).toHaveBeenCalledWith({
			form_template_id: 1,
			form_template_version_id: 10,
			form_name: "My Submission",
			content: { foo: "bar" },
		});
	});

	await waitFor(() => {
		expect(toast.success).toHaveBeenCalledWith(
			"Form submitted successfully",
		);
		expect(mockNavigate).toHaveBeenCalledWith({ to: "/forms" });
	});
});

it("preserves MultiSelect array values when submitting the form", async () => {
	vi.mocked(formTemplatesApi.getFormTemplate).mockResolvedValue(
		sampleTemplate as any,
	);
	vi.mocked(formSubmissionsApi.createFormSubmission).mockResolvedValue(
		{} as any,
	);

	const { result } = renderHook(() => useFormFillPage("1"), {
		wrapper: createWrapper(),
	});

	await waitFor(() => {
		expect(formTemplatesApi.getFormTemplate).toHaveBeenCalledWith(1);
	});

	act(() => {
		result.current.handleFormNameChange("My Submission");
	});

	act(() => {
		result.current.handleSubmit({
			formData: { tags: ["one", "three"] },
		} as any);
	});

	await waitFor(() => {
		expect(formSubmissionsApi.createFormSubmission).toHaveBeenCalledWith({
			form_template_id: 1,
			form_template_version_id: 10,
			form_name: "My Submission",
			content: { tags: ["one", "three"] },
		});
	});
});

it("submits priority when provided in the form data", async () => {
	vi.mocked(formTemplatesApi.getFormTemplate).mockResolvedValue(
		sampleTemplate as any,
	);
	vi.mocked(formSubmissionsApi.createFormSubmission).mockResolvedValue(
		{} as any,
	);

	const { result } = renderHook(() => useFormFillPage("1"), {
		wrapper: createWrapper(),
	});

	await waitFor(() => {
		expect(formTemplatesApi.getFormTemplate).toHaveBeenCalledWith(1);
	});

	act(() => {
		result.current.handleFormNameChange("My Submission");
	});

	act(() => {
		result.current.handleSubmit({
			formData: { foo: "bar", priority: "high" },
		} as any);
	});

	await waitFor(() => {
		expect(formSubmissionsApi.createFormSubmission).toHaveBeenCalledWith({
			form_template_id: 1,
			form_template_version_id: 10,
			form_name: "My Submission",
			content: { foo: "bar" },
			priority: "high",
		});
	});
});

it("does not include priority when the form field is blank", async () => {
	vi.mocked(formTemplatesApi.getFormTemplate).mockResolvedValue(
		sampleTemplate as any,
	);
	vi.mocked(formSubmissionsApi.createFormSubmission).mockResolvedValue(
		{} as any,
	);

	const { result } = renderHook(() => useFormFillPage("1"), {
		wrapper: createWrapper(),
	});

	await waitFor(() => {
		expect(formTemplatesApi.getFormTemplate).toHaveBeenCalledWith(1);
	});

	act(() => {
		result.current.handleFormNameChange("My Submission");
	});

	act(() => {
		result.current.handleSubmit({
			formData: { foo: "bar", priority: "" },
		} as any);
	});

	await waitFor(() => {
		expect(formSubmissionsApi.createFormSubmission).toHaveBeenCalledWith({
			form_template_id: 1,
			form_template_version_id: 10,
			form_name: "My Submission",
			content: { foo: "bar" },
		});
	});
});

it("detects a priority field with a custom name and sends it as priority", async () => {
	vi.mocked(formTemplatesApi.getFormTemplate).mockResolvedValue(
		{
			...sampleTemplate,
			json_schema: {
				properties: {
					priority_level: {
						type: "string",
						enum: ["low", "medium", "high", "critical"],
					},
				},
			},
		} as any,
	);
	vi.mocked(formSubmissionsApi.createFormSubmission).mockResolvedValue(
		{} as any,
	);

	const { result } = renderHook(() => useFormFillPage("1"), {
		wrapper: createWrapper(),
	});

	await waitFor(() => {
		expect(formTemplatesApi.getFormTemplate).toHaveBeenCalledWith(1);
	});

	act(() => {
		result.current.handleFormNameChange("My Submission");
	});

	act(() => {
		result.current.handleSubmit({
			formData: { foo: "bar", priority_level: "high" },
		} as any);
	});

	await waitFor(() => {
		expect(formSubmissionsApi.createFormSubmission).toHaveBeenCalledWith({
			form_template_id: 1,
			form_template_version_id: 10,
			form_name: "My Submission",
			content: { foo: "bar" },
			priority: "high",
		});
	});
});

it("does not submit when formData is missing, even with a valid name", () => {
	const { result } = renderHook(() => useFormFillPage("1"), {
		wrapper: createWrapper(),
	});

	act(() => {
		result.current.handleFormNameChange("My Submission");
	});
	act(() => {
		result.current.handleSubmit({ formData: undefined } as any);
	});

	expect(formSubmissionsApi.createFormSubmission).not.toHaveBeenCalled();
});

it("shows an error toast when submission fails", async () => {
	vi.mocked(formSubmissionsApi.createFormSubmission).mockRejectedValue(
		new Error("nope"),
	);

	const { result } = renderHook(() => useFormFillPage("1"), {
		wrapper: createWrapper(),
	});

	act(() => {
		result.current.handleFormNameChange("My Submission");
	});
	act(() => {
		result.current.handleSubmit({ formData: { foo: "bar" } } as any);
	});

	await waitFor(() => {
		expect(toast.error).toHaveBeenCalledWith("Failed to submit form");
	});
});

it("goBack navigates to /forms", () => {
	const { result } = renderHook(() => useFormFillPage("1"), {
		wrapper: createWrapper(),
	});

	act(() => {
		result.current.goBack();
	});

	expect(mockNavigate).toHaveBeenCalledWith({ to: "/forms" });
});
});
