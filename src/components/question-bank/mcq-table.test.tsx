import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { McqTable } from "@/components/question-bank/mcq-table";

vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: vi.fn(),
		replace: vi.fn(),
	}),
}));

vi.mock("next/link", () => ({
	default: ({
		children,
		href,
		...props
	}: {
		children: React.ReactNode;
		href: string;
	}) => (
		<a href={href} {...props}>
			{children}
		</a>
	),
}));

vi.mock("@/lib/mcq-client", () => ({
	deleteMcq: vi.fn(),
}));

const sampleMcqs = [
	{
		id: 1,
		name: "Math basics",
		question: "What is 2+2?",
		createdAt: "2026-09-03T10:00:00.000Z",
		updatedAt: "2026-09-03T10:00:00.000Z",
	},
	{
		id: 2,
		name: "Science",
		question: "What planet is closest to the Sun?",
		createdAt: "2026-09-03T11:00:00.000Z",
		updatedAt: "2026-09-03T11:00:00.000Z",
	},
];

describe("McqTable", () => {
	it("shows an empty state when there are no MCQs", () => {
		render(<McqTable initialMcqs={[]} />);

		expect(screen.getByRole("heading", { name: "No questions yet" })).toBeInTheDocument();
		expect(
			screen.getByText("Create your first question using the button above."),
		).toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "Create question" })).not.toBeInTheDocument();
	});

	it("renders MCQ rows with name and question columns", () => {
		render(<McqTable initialMcqs={sampleMcqs} />);

		expect(screen.getByRole("columnheader", { name: "Name" })).toBeInTheDocument();
		expect(screen.getByRole("columnheader", { name: "Question" })).toBeInTheDocument();
		expect(screen.getByText("Math basics")).toBeInTheDocument();
		expect(screen.getByText("What is 2+2?")).toBeInTheDocument();
		expect(screen.getByText("Science")).toBeInTheDocument();
	});

	it("shows Edit, Preview, and Delete in the row actions menu", async () => {
		const user = userEvent.setup();
		render(<McqTable initialMcqs={sampleMcqs} />);

		await user.click(screen.getByRole("button", { name: "Actions for Math basics" }));

		await waitFor(() => {
			expect(screen.getByText("Edit")).toBeInTheDocument();
			expect(screen.getByText("Preview")).toBeInTheDocument();
			expect(screen.getByText("Delete")).toBeInTheDocument();
		});
	});
});
