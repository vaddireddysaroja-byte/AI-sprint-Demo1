import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { McqForm } from "@/components/question-bank/mcq-form";

const push = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push,
		replace: vi.fn(),
		refresh,
	}),
}));

vi.mock("@/lib/mcq-client", () => ({
	createMcq: vi.fn(),
	updateMcq: vi.fn(),
}));

import { createMcq, updateMcq } from "@/lib/mcq-client";

describe("McqForm", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders two default choice rows on create", () => {
		render(<McqForm mode="create" />);

		expect(screen.getByLabelText("Choice 1 text")).toBeInTheDocument();
		expect(screen.getByLabelText("Choice 2 text")).toBeInTheDocument();
		expect(screen.getAllByRole("radio", { name: /correct/i })).toHaveLength(2);
	});

	it("shows Save and Cancel buttons with equal full width", () => {
		render(<McqForm mode="create" />);

		const saveButton = screen.getByRole("button", { name: "Save" });
		const cancelButton = screen.getByRole("button", { name: "Cancel" });

		expect(saveButton).toHaveClass("w-full");
		expect(cancelButton).toHaveClass("w-full");
		expect(saveButton.parentElement).toHaveClass("grid-cols-2");
	});

	it("blocks submit when required fields are missing", async () => {
		const user = userEvent.setup();
		render(<McqForm mode="create" />);

		await user.click(screen.getByRole("button", { name: "Save" }));

		expect(createMcq).not.toHaveBeenCalled();
		expect(screen.getByText("Please fix the errors below.")).toBeInTheDocument();
		expect(screen.getByText("Name is required.")).toBeInTheDocument();
	});

	it("creates an MCQ and redirects on valid submit", async () => {
		const user = userEvent.setup();
		vi.mocked(createMcq).mockResolvedValue({ ok: true, mcqId: 7 });

		render(<McqForm mode="create" />);

		await user.type(screen.getByLabelText("Name"), "Science");
		await user.type(screen.getByLabelText("Question"), "What is H2O?");
		await user.type(screen.getByLabelText("Choice 1 text"), "Water");
		await user.type(screen.getByLabelText("Choice 2 text"), "Fire");

		await user.click(screen.getByRole("button", { name: "Save" }));

		await waitFor(() => {
			expect(createMcq).toHaveBeenCalledWith({
				name: "Science",
				question: "What is H2O?",
				choices: [
					{ choiceText: "Water", isCorrect: true },
					{ choiceText: "Fire", isCorrect: false },
				],
			});
		});

		expect(push).toHaveBeenCalledWith("/question-bank");
		expect(refresh).toHaveBeenCalled();
	});

	it("updates an existing MCQ on edit", async () => {
		const user = userEvent.setup();
		vi.mocked(updateMcq).mockResolvedValue({ ok: true });

		render(
			<McqForm
				mode="edit"
				mcqId={5}
				initialValues={{
					name: "Old",
					question: "Old question?",
					choices: [
						{ choiceText: "A", isCorrect: true },
						{ choiceText: "B", isCorrect: false },
					],
				}}
			/>,
		);

		const nameInput = screen.getByLabelText("Name");
		await user.clear(nameInput);
		await user.type(nameInput, "Updated");
		await user.click(screen.getByRole("button", { name: "Save" }));

		await waitFor(() => {
			expect(updateMcq).toHaveBeenCalledWith(5, {
				name: "Updated",
				question: "Old question?",
				choices: [
					{ choiceText: "A", isCorrect: true },
					{ choiceText: "B", isCorrect: false },
				],
			});
		});
	});

	it("navigates back to the question bank on cancel", async () => {
		const user = userEvent.setup();
		render(<McqForm mode="create" />);

		await user.click(screen.getByRole("button", { name: "Cancel" }));

		expect(push).toHaveBeenCalledWith("/question-bank");
	});
});
