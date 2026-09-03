import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { QuestionBankLanding } from "@/components/question-bank/question-bank-landing";

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

vi.mock("@/lib/auth-client", () => ({
	logoutUser: vi.fn(),
}));

vi.mock("@/lib/mcq-client", () => ({
	deleteMcq: vi.fn(),
}));

describe("QuestionBankLanding", () => {
	it("renders the signed-in question bank view with create action", () => {
		render(
			<QuestionBankLanding
				username="chitti2"
				mcqs={[
					{
						id: 1,
						name: "Math basics",
						question: "What is 2+2?",
						createdAt: "2026-09-03T10:00:00.000Z",
						updatedAt: "2026-09-03T10:00:00.000Z",
					},
				]}
			/>,
		);

		expect(screen.getByRole("heading", { name: "Question Bank" })).toBeInTheDocument();
		expect(screen.getByText("Welcome back, chitti2.")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Create question" })).toHaveAttribute(
			"href",
			"/question-bank/mcq/new",
		);
		expect(screen.getByRole("button", { name: "Log out" })).toBeInTheDocument();
		expect(screen.getByText("Math basics")).toBeInTheDocument();
	});
});
