import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { McqPreview } from "@/components/question-bank/mcq-preview";

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

	it("shows correct feedback after a correct attempt", async () => {
		const user = userEvent.setup();
		vi.mocked(recordMcqAttempt).mockResolvedValue({ ok: true, isCorrect: true });

		render(<McqPreview mcq={sampleMcq} />);

		await user.click(screen.getByLabelText("Mercury"));
		await user.click(screen.getByRole("button", { name: "Submit answer" }));

		await waitFor(() => {
			expect(recordMcqAttempt).toHaveBeenCalledWith(3, 10);
			expect(screen.getByRole("status")).toHaveTextContent("Correct!");
		});
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

		await user.click(screen.getByRole("button", { name: "Submit answer" }));

		expect(recordMcqAttempt).not.toHaveBeenCalled();
		expect(await screen.findByRole("alert")).toHaveTextContent(
			"Select an answer before submitting.",
		);
	});
});
