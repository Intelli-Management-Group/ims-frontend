import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useFormsPage } from "./useFormsPage";
import { formTemplatesApi } from "@/api/form-templates";

vi.mock("@/api/form-templates", () => ({
	formTemplatesApi: {
		getFormTemplates: vi.fn(),
	},
}));

// The debounce timing itself isn't this hook's responsibility to test;
// pass the value straight through so tests run synchronously.
vi.mock("@/hooks/use-debounce", () => ({
	useDebounce: (value: string) => value,
}));

vi.mock("@tanstack/react-router", () => ({
	// `params` is an object, so keep it off the DOM and expose it via a
	// data attribute instead of spreading it directly onto the anchor.
	Link: ({ children, params, ...props }: any) => (
		<a {...props} data-template-id={params?.templateId}>
			{children}
		</a>
	),
}));

vi.mock("@/components/ui/button", () => ({
	Button: ({ children, asChild }: any) => (asChild ? children : <button>{children}</button>),
}));

function createWrapper() {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});
	return ({ children }: { children: ReactNode }) => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
}

describe("useFormsPage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(formTemplatesApi.getFormTemplates).mockResolvedValue({
			data: [],
			meta: { last_page: 1, total: 0 },
		} as any);
	});

	it("starts with default page, perPage, and empty search", () => {
		const { result } = renderHook(() => useFormsPage(), {
			wrapper: createWrapper(),
		});

		expect(result.current.page).toBe(1);
		expect(result.current.perPage).toBe(10);
		expect(result.current.search).toBe("");
	});

	it("fetches templates with the current page, perPage, and search", async () => {
		renderHook(() => useFormsPage(), { wrapper: createWrapper() });

		await waitFor(() => {
			expect(formTemplatesApi.getFormTemplates).toHaveBeenCalledWith({
				page: 1,
				per_page: 10,
				search: "",
			});
		});
	});

	it("resets to page 1 when perPage changes", () => {
		const { result } = renderHook(() => useFormsPage(), {
			wrapper: createWrapper(),
		});

		act(() => result.current.setPage(3));
		expect(result.current.page).toBe(3);

		act(() => result.current.handlePerPageChange(25));

		expect(result.current.perPage).toBe(25);
		expect(result.current.page).toBe(1);
	});

	it("resets to page 1 when the search term changes", () => {
		const { result } = renderHook(() => useFormsPage(), {
			wrapper: createWrapper(),
		});

		act(() => result.current.setPage(3));
		act(() => result.current.handleSearchChange("invoice"));

		expect(result.current.search).toBe("invoice");
		expect(result.current.page).toBe(1);
	});

	it("re-fetches with the new search term", async () => {
		const { result } = renderHook(() => useFormsPage(), {
			wrapper: createWrapper(),
		});

		act(() => result.current.handleSearchChange("invoice"));

		await waitFor(() => {
			expect(formTemplatesApi.getFormTemplates).toHaveBeenCalledWith({
				page: 1,
				per_page: 10,
				search: "invoice",
			});
		});
	});

	it("builds a Form column that renders the template name", () => {
		const { result } = renderHook(() => useFormsPage(), {
			wrapper: createWrapper(),
		});
		const nameColumn = result.current.columns.find(
			(c: any) => c.accessorKey === "name",
		);
		const Cell = nameColumn!.cell as any;

		render(<Cell row={{ original: { id: 1, name: "Time Off Request", creator: null } }} />);

		expect(screen.getByText("Time Off Request")).toBeInTheDocument();
	});

	it("builds a Created by column that falls back to an em dash without a creator", () => {
		const { result } = renderHook(() => useFormsPage(), {
			wrapper: createWrapper(),
		});
		const creatorColumn = result.current.columns.find((c: any) => c.id === "creator");
		const Cell = creatorColumn!.cell as any;

		render(<Cell row={{ original: { id: 1, name: "x", creator: null } }} />);

		expect(screen.getByText("—")).toBeInTheDocument();
	});

	it("builds a Created by column that shows the creator name when present", () => {
		const { result } = renderHook(() => useFormsPage(), {
			wrapper: createWrapper(),
		});
		const creatorColumn = result.current.columns.find((c: any) => c.id === "creator");
		const Cell = creatorColumn!.cell as any;

		render(
			<Cell
				row={{ original: { id: 1, name: "x", creator: { name: "Ada Lovelace" } } }}
			/>,
		);

		expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
	});

});