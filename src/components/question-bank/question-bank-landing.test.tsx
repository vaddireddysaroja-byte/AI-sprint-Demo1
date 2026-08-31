import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { QuestionBankLanding } from "@/components/question-bank/question-bank-landing";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: vi.fn(),
		replace,
	}),
}));

vi.mock("@/lib/auth-client", () => ({
	getSession: vi.fn(),
	logoutUser: vi.fn(),
}));

import { getSession } from "@/lib/auth-client";

describe("QuestionBankLanding", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("redirects to / when there is no valid session", async () => {
		vi.mocked(getSession).mockResolvedValue({
			ok: false,
			error: "You are not signed in.",
		});

		render(<QuestionBankLanding />);

		await waitFor(() => {
			expect(replace).toHaveBeenCalledWith("/");
		});
	});
});
