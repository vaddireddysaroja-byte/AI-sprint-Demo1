import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthForm } from "@/components/auth/auth-form";

const push = vi.fn();

vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push,
		replace: vi.fn(),
	}),
}));

vi.mock("@/lib/auth-client", () => ({
	registerUser: vi.fn(),
	loginUser: vi.fn(),
}));

import { loginUser, registerUser } from "@/lib/auth-client";

describe("AuthForm registration validation", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("blocks mismatched passwords before calling the API", async () => {
		const user = userEvent.setup();

		render(<AuthForm />);
		await user.click(screen.getByRole("button", { name: "Register" }));

		await user.type(screen.getByLabelText("Username"), "testuser");
		await user.type(screen.getByLabelText("Email"), "form-test@example.com");
		await user.type(screen.getByLabelText("Password"), "password123");
		await user.type(screen.getByLabelText("Confirm password"), "different123");
		await user.click(screen.getByRole("button", { name: "Register" }));

		expect(registerUser).not.toHaveBeenCalled();
		expect(await screen.findByText("Passwords do not match.")).toBeInTheDocument();
		expect(push).not.toHaveBeenCalled();
	});
});

describe("AuthForm successful flows", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("redirects to /question-bank after valid registration", async () => {
		const user = userEvent.setup();
		vi.mocked(registerUser).mockResolvedValue({ ok: true, userId: 1 });

		render(<AuthForm />);
		await user.click(screen.getByRole("button", { name: "Register" }));

		await user.type(screen.getByLabelText("Username"), "testuser");
		await user.type(screen.getByLabelText("Email"), "form-test@example.com");
		await user.type(screen.getByLabelText("Password"), "password123");
		await user.type(screen.getByLabelText("Confirm password"), "password123");
		await user.click(screen.getByRole("button", { name: "Register" }));

		await waitFor(() => {
			expect(registerUser).toHaveBeenCalledWith({
				username: "testuser",
				email: "form-test@example.com",
				password: "password123",
				confirmPassword: "password123",
			});
		});

		expect(push).toHaveBeenCalledWith("/question-bank");
	});

	it("redirects to /question-bank after valid login", async () => {
		const user = userEvent.setup();
		vi.mocked(loginUser).mockResolvedValue({ ok: true });

		render(<AuthForm />);

		await user.type(screen.getByLabelText("Email"), "login-user@example.com");
		await user.type(screen.getByLabelText("Password"), "password123");
		await user.click(screen.getByRole("button", { name: "Log in" }));

		await waitFor(() => {
			expect(loginUser).toHaveBeenCalledWith("login-user@example.com", "password123");
		});

		expect(push).toHaveBeenCalledWith("/question-bank");
	});

	it("shows an error and does not redirect after invalid login", async () => {
		const user = userEvent.setup();
		vi.mocked(loginUser).mockResolvedValue({
			ok: false,
			error: "Invalid email or password.",
		});

		render(<AuthForm />);

		await user.type(screen.getByLabelText("Email"), "missing-user@example.com");
		await user.type(screen.getByLabelText("Password"), "password123");
		await user.click(screen.getByRole("button", { name: "Log in" }));

		expect(await screen.findByText("Invalid email or password.")).toBeInTheDocument();
		expect(push).not.toHaveBeenCalled();
	});
});
