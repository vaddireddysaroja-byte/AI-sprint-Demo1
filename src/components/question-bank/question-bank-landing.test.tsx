import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { QuestionBankLanding } from "@/components/question-bank/question-bank-landing";

vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: vi.fn(),
		replace: vi.fn(),
	}),
}));

vi.mock("@/lib/auth-client", () => ({
	logoutUser: vi.fn(),
}));

describe("QuestionBankLanding", () => {
	it("renders the signed-in question bank view for an authenticated user", () => {
		render(<QuestionBankLanding username="chitti2" />);

		expect(screen.getByRole("heading", { name: "Question Bank" })).toBeInTheDocument();
		expect(screen.getByText("Welcome back, chitti2.")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Log out" })).toBeInTheDocument();
	});
});
