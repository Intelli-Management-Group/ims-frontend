import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import * as useFormsPageModule from "./useFormsPage";

vi.mock("@tanstack/react-router", () => ({
	createFileRoute: () => (options: any) => options,
}));

vi.mock("@/components/data-table/data-table", () => ({
	DataTable: ({ data, isLoading }: any) => (
		<div data-testid="data-table">{isLoading ? "loading" : `rows:${data.length}`}</div>
	),
}));

vi.mock("@/components/data-table/data-table-pagination", () => ({
	DataTablePagination: ({ currentPage, lastPage, total }: any) => (
		<div data-testid="pagination">{`${currentPage}/${lastPage} (${total})`}</div>
	),
}));

vi.mock("./useFormsPage", () => ({
	useFormsPage: vi.fn(),
}));

type FormsPageData = {
	data: Array<{ id: number }>;
	meta: {
		last_page: number;
		total: number;
	};
};

type BaseHookReturn = {
	page: number;
	setPage: ReturnType<typeof vi.fn>;
	perPage: number;
	search: string;
	data?: FormsPageData;
	isLoading: boolean;
	columns: unknown[];
	handlePerPageChange: ReturnType<typeof vi.fn>;
	handleSearchChange: ReturnType<typeof vi.fn>;
};

const baseHookReturn: BaseHookReturn = {
	page: 1,
	setPage: vi.fn(),
	perPage: 10,
	search: "",
	data: undefined,
	isLoading: false,
	columns: [],
	handlePerPageChange: vi.fn(),
	handleSearchChange: vi.fn(),
};


async function renderPage(overrides: Partial<typeof baseHookReturn> = {}) {
	vi.mocked(useFormsPageModule.useFormsPage).mockReturnValue({
		...baseHookReturn,
		...overrides,
	} as any);

	const { Route } = await import("./index");
	const Component = (Route as any).component;
	render(<Component />);
}

describe("FormsPage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders the page heading and search input", async () => {
		await renderPage();

		expect(screen.getByRole("heading", { name: "Forms" })).toBeInTheDocument();
		expect(screen.getByPlaceholderText("Search forms...")).toBeInTheDocument();
	});

	it("calls handleSearchChange as the user types in the search box", async () => {
		const handleSearchChange = vi.fn();
		await renderPage({ handleSearchChange });

		fireEvent.change(screen.getByPlaceholderText("Search forms..."), {
			target: { value: "expense" },
		});

		expect(handleSearchChange).toHaveBeenCalledWith("expense");
	});

	it("shows the data table in a loading state", async () => {
		await renderPage({ isLoading: true, data: undefined });
		expect(screen.getByTestId("data-table")).toHaveTextContent("loading");
	});

	it("passes the loaded rows through to the data table", async () => {
		await renderPage({
			isLoading: false,
			data: { data: [{ id: 1 }, { id: 2 }], meta: { last_page: 3, total: 25 } },
		});

		expect(screen.getByTestId("data-table")).toHaveTextContent("rows:2");
	});

	it("does not render pagination before data has loaded", async () => {
		await renderPage({ data: undefined });
		expect(screen.queryByTestId("pagination")).not.toBeInTheDocument();
	});

	it("renders pagination details once data has loaded", async () => {
		await renderPage({
			page: 2,
			data: { data: [], meta: { last_page: 5, total: 42 } },
		});

		expect(screen.getByTestId("pagination")).toHaveTextContent("2/5 (42)");
	});
});
