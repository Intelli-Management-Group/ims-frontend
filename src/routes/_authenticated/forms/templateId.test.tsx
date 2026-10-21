import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import * as useFormFillPageModule from "./useFormFillPage";

vi.mock("@tanstack/react-router", () => ({
	createFileRoute: () => (options: any) => ({
		...options,
		useParams: () => ({ templateId: "7" }),
	}),
}));

// Stub the third-party rjsf form so tests focus on this page's own logic,
// not the form-rendering library. onSubmit is wired to a fake submit event.
vi.mock("@rjsf/shadcn", () => ({
	default: ({ children, onSubmit }: any) => (
		<form
			data-testid="rjsf-form"
			onSubmit={(e: any) => {
				e.preventDefault();
				onSubmit({ formData: { field: "value" } });
			}}
		>
			{children}
		</form>
	),
}));

vi.mock("@rjsf/validator-ajv8", () => ({ default: {} }));

vi.mock("./useFormFillPage", () => ({
	useFormFillPage: vi.fn(),
}));

const baseHookReturn = {
	template: { id: 7, name: "Time Off Request", json_schema: {}, ui_schema: {} },
	isLoading: false,
	canFill: true,
	formName: "",
	formNameError: false,
	isSubmitting: false,
	handleSubmit: vi.fn(),
	handleFormNameChange: vi.fn(),
	goBack: vi.fn(),
};

async function renderPage(overrides: Partial<typeof baseHookReturn> = {}) {
	vi.mocked(useFormFillPageModule.useFormFillPage).mockReturnValue({
		...baseHookReturn,
		...overrides,
	} as any);

	const { Route } = await import("./$templateId");
	const Component = (Route as any).component;
	render(<Component />);
}

describe("FormFillPage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("shows skeletons while loading and nothing from the template yet", async () => {
		await renderPage({ isLoading: true, template: undefined });
		expect(screen.queryByText("Time Off Request")).not.toBeInTheDocument();
		expect(screen.queryByTestId("rjsf-form")).not.toBeInTheDocument();
	});

	it("renders nothing once loading finishes without a template", async () => {
		const { container } = await (async () => {
			await renderPage({ isLoading: false, template: undefined });
			return { container: document.body };
		})();
		expect(container.textContent).toBe("");
	});

	it("renders nothing when the caller lacks create permission for the template", async () => {
		await renderPage({ canFill: false });
		expect(document.body.textContent).toBe("");
	});

	it("renders the template name, the form name field, and the rjsf form", async () => {
		await renderPage();

		expect(
			screen.getByRole("heading", { name: "Time Off Request" }),
		).toBeInTheDocument();
		expect(screen.getByLabelText(/form name/i)).toBeInTheDocument();
		expect(screen.getByTestId("rjsf-form")).toBeInTheDocument();
	});

	it("shows a validation message when the form name is missing", async () => {
		await renderPage({ formNameError: true });
		expect(screen.getByText("Form name is required.")).toBeInTheDocument();
	});

	it("calls handleFormNameChange as the user types", async () => {
		const handleFormNameChange = vi.fn();
		await renderPage({ handleFormNameChange });

		fireEvent.change(screen.getByLabelText(/form name/i), {
			target: { value: "My Form" },
		});

		expect(handleFormNameChange).toHaveBeenCalledWith("My Form");
	});

	it("calls goBack when the back button is clicked", async () => {
		const goBack = vi.fn();
		await renderPage({ goBack });

		fireEvent.click(screen.getByRole("button", { name: "" }));
		expect(goBack).toHaveBeenCalled();
	});

	it("disables the form name field and shows a submitting label while submitting", async () => {
		await renderPage({ isSubmitting: true });

		expect(screen.getByLabelText(/form name/i)).toBeDisabled();
		expect(
			screen.getByRole("button", { name: /submitting/i }),
		).toBeDisabled();
	});

	it("calls handleSubmit with the rjsf form data on submit", async () => {
		const handleSubmit = vi.fn();
		await renderPage({ handleSubmit });

		fireEvent.submit(screen.getByTestId("rjsf-form"));

		expect(handleSubmit).toHaveBeenCalledWith({ formData: { field: "value" } });
	});
});
