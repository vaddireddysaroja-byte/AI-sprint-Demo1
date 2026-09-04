import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { McqPreview } from "@/components/question-bank/mcq-preview";

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
	recordMcqAttempt: vi.fn(),
}));

import { recordMcqAttempt } from "@/lib/mcq-client";

const sampleMcq = {
	id: 3,
	name: "Science",
	question: "What planet is closest to the Sun?",
	createdAt: "2026-09-03T10:00:00.000Z",
	updatedAt: "2026-09-03T10:00:00.000Z",
	choices: [
		{ id: 10, choiceText: "Mercury", isCorrect: true, sortOrder: 0 },
		{ id: 11, choiceText: "Venus", isCorrect: false, sortOrder: 1 },
	],
};

describe("McqPreview", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders the question and choices", () => {
		render(<McqPreview mcq={sampleMcq} />);

		expect(screen.getByText("Science")).toBeInTheDocument();
		expect(screen.getByText("What planet is closest to the Sun?")).toBeInTheDocument();
		expect(screen.getByText("Mercury")).toBeInTheDocument();
		expect(screen.getByText("Venus")).toBeInTheDocument();
	});

	it("does not show feedback when only selecting an answer", async () => {
		const user = userEvent.setup();
		render(<McqPreview mcq={sampleMcq} />);

		expect(screen.getByRole("button", { name: "Submit answer" })).toBeDisabled();

		await user.click(screen.getByLabelText("Mercury"));

		expect(screen.queryByRole("status")).not.toBeInTheDocument();
		expect(screen.queryByText("Correct!")).not.toBeInTheDocument();
		expect(screen.queryByText("Incorrect.")).not.toBeInTheDocument();
		expect(recordMcqAttempt).not.toHaveBeenCalled();
		expect(screen.getByRole("button", { name: "Submit answer" })).toBeEnabled();
	});

	it("shows correct feedback only after submitting", async () => {
		const user = userEvent.setup();
		vi.mocked(recordMcqAttempt).mockResolvedValue({ ok: true, isCorrect: true });

		render(<McqPreview mcq={sampleMcq} />);

		await user.click(screen.getByLabelText("Mercury"));
		await user.click(screen.getByRole("button", { name: "Submit answer" }));

		await waitFor(() => {
			expect(recordMcqAttempt).toHaveBeenCalledWith(3, 10);
			expect(screen.getByRole("status")).toHaveTextContent("Correct!");
		});

		expect(screen.queryByRole("button", { name: "Submit answer" })).not.toBeInTheDocument();
	});

	it("shows incorrect feedback after a wrong attempt", async () => {
		const user = userEvent.setup();
		vi.mocked(recordMcqAttempt).mockResolvedValue({ ok: true, isCorrect: false });

		render(<McqPreview mcq={sampleMcq} />);

		await user.click(screen.getByLabelText("Venus"));
		await user.click(screen.getByRole("button", { name: "Submit answer" }));

		await waitFor(() => {
			expect(screen.getByRole("status")).toHaveTextContent("Incorrect.");
		});
	});

	it("requires a choice before submitting", async () => {
		const user = userEvent.setup();
		render(<McqPreview mcq={sampleMcq} />);

		const submitButton = screen.getByRole("button", { name: "Submit answer" });
		expect(submitButton).toBeDisabled();

		await user.click(submitButton);

		expect(recordMcqAttempt).not.toHaveBeenCalled();
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
	});

	it("lets the user try the question again after submitting", async () => {
		const user = userEvent.setup();
		vi.mocked(recordMcqAttempt).mockResolvedValue({ ok: true, isCorrect: false });

		render(<McqPreview mcq={sampleMcq} />);

		await user.click(screen.getByLabelText("Venus"));
		await user.click(screen.getByRole("button", { name: "Submit answer" }));

		await waitFor(() => {
			expect(screen.getByRole("status")).toHaveTextContent("Incorrect.");
		});

		await user.click(screen.getByRole("button", { name: "Try this question again" }));

		expect(screen.queryByRole("status")).not.toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Submit answer" })).toBeDisabled();
		expect(screen.getByRole("radio", { name: /Mercury/i })).not.toBeChecked();
		expect(screen.getByRole("radio", { name: /Venus/i })).not.toBeChecked();
	});
});
