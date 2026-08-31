"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { loginUser, registerUser } from "@/lib/auth-client";

type AuthMode = "login" | "register";

type FormErrors = {
	username?: string;
	email?: string;
	password?: string;
	confirmPassword?: string;
	form?: string;
};

function isValidEmail(email: string) {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateLoginForm(email: string, password: string): FormErrors {
	const errors: FormErrors = {};

	if (!email.trim()) {
		errors.email = "Email is required.";
	} else if (!isValidEmail(email)) {
		errors.email = "Enter a valid email address.";
	}

	if (!password) {
		errors.password = "Password is required.";
	}

	return errors;
}

function validateRegisterForm(
	username: string,
	email: string,
	password: string,
	confirmPassword: string,
): FormErrors {
	const errors: FormErrors = {};

	if (!username.trim()) {
		errors.username = "Username is required.";
	}

	if (!email.trim()) {
		errors.email = "Email is required.";
	} else if (!isValidEmail(email)) {
		errors.email = "Enter a valid email address.";
	}

	if (!password) {
		errors.password = "Password is required.";
	} else if (password.length < 8) {
		errors.password = "Password must be at least 8 characters.";
	}

	if (!confirmPassword) {
		errors.confirmPassword = "Confirm password is required.";
	} else if (password !== confirmPassword) {
		errors.confirmPassword = "Passwords do not match.";
	}

	return errors;
}

export function AuthForm() {
	const router = useRouter();
	const [mode, setMode] = useState<AuthMode>("login");
	const [username, setUsername] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [errors, setErrors] = useState<FormErrors>({});
	const [isSubmitting, setIsSubmitting] = useState(false);

	function switchMode(nextMode: AuthMode) {
		setMode(nextMode);
		setErrors({});
		setPassword("");
		setConfirmPassword("");
	}

	function resetSensitiveFields() {
		setPassword("");
		setConfirmPassword("");
	}

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		const nextErrors =
			mode === "register"
				? validateRegisterForm(username, email, password, confirmPassword)
				: validateLoginForm(email, password);

		setErrors(nextErrors);

		if (Object.keys(nextErrors).length > 0) {
			return;
		}

		setIsSubmitting(true);
		setErrors({});

		try {
			if (mode === "register") {
				const result = await registerUser({
					username,
					email,
					password,
					confirmPassword,
				});

				if (!result.ok) {
					setErrors({ form: result.error });
					return;
				}

				router.push("/question-bank");
				return;
			}

			const result = await loginUser(email, password);

			if (!result.ok) {
				setErrors({ form: result.error });
				return;
			}

			router.push("/question-bank");
		} catch {
			setErrors({
				form: "Something went wrong. Please try again.",
			});
		} finally {
			setIsSubmitting(false);
		}
	}

	const isLogin = mode === "login";

	return (
		<Card className="mx-auto w-full max-w-md">
			<CardHeader>
				<CardTitle>{isLogin ? "Log in" : "Create an account"}</CardTitle>
				<CardDescription>
					{isLogin
						? "Enter your email and password to continue."
						: "Create an account with a username, email, and password."}
				</CardDescription>
			</CardHeader>

			<form onSubmit={handleSubmit}>
				<CardContent className="space-y-4">
					{errors.form ? (
						<FieldError errors={[{ message: errors.form }]} />
					) : null}

					<FieldGroup>
						{!isLogin ? (
							<Field data-invalid={Boolean(errors.username)}>
								<FieldLabel htmlFor="username">Username</FieldLabel>
								<Input
									id="username"
									name="username"
									type="text"
									autoComplete="username"
									placeholder="yourname"
									value={username}
									onChange={(event) => setUsername(event.target.value)}
									aria-invalid={Boolean(errors.username)}
									disabled={isSubmitting}
								/>
								<FieldError
									errors={errors.username ? [{ message: errors.username }] : undefined}
								/>
							</Field>
						) : null}

						<Field data-invalid={Boolean(errors.email)}>
							<FieldLabel htmlFor="email">Email</FieldLabel>
							<Input
								id="email"
								name="email"
								type="email"
								autoComplete="email"
								placeholder="you@example.com"
								value={email}
								onChange={(event) => setEmail(event.target.value)}
								aria-invalid={Boolean(errors.email)}
								disabled={isSubmitting}
							/>
							<FieldError errors={errors.email ? [{ message: errors.email }] : undefined} />
						</Field>

						<Field data-invalid={Boolean(errors.password)}>
							<FieldLabel htmlFor="password">Password</FieldLabel>
							<Input
								id="password"
								name="password"
								type="password"
								autoComplete={isLogin ? "current-password" : "new-password"}
								placeholder={isLogin ? "Enter your password" : "At least 8 characters"}
								value={password}
								onChange={(event) => setPassword(event.target.value)}
								aria-invalid={Boolean(errors.password)}
								disabled={isSubmitting}
							/>
							<FieldError errors={errors.password ? [{ message: errors.password }] : undefined} />
						</Field>

						{!isLogin ? (
							<Field data-invalid={Boolean(errors.confirmPassword)}>
								<FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
								<Input
									id="confirmPassword"
									name="confirmPassword"
									type="password"
									autoComplete="new-password"
									placeholder="Re-enter your password"
									value={confirmPassword}
									onChange={(event) => setConfirmPassword(event.target.value)}
									aria-invalid={Boolean(errors.confirmPassword)}
									disabled={isSubmitting}
								/>
								<FieldError
									errors={
										errors.confirmPassword
											? [{ message: errors.confirmPassword }]
											: undefined
									}
								/>
							</Field>
						) : null}
					</FieldGroup>
				</CardContent>

				<CardFooter className="flex flex-col gap-4">
					<Button type="submit" className="w-full" disabled={isSubmitting}>
						{isSubmitting ? "Please wait..." : isLogin ? "Log in" : "Register"}
					</Button>

					<p className="text-muted-foreground text-center text-sm">
						{isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
						<Button
							type="button"
							variant="link"
							className="h-auto p-0"
							onClick={() => {
								switchMode(isLogin ? "register" : "login");
								resetSensitiveFields();
							}}
							disabled={isSubmitting}
						>
							{isLogin ? "Register" : "Log in"}
						</Button>
					</p>
				</CardFooter>
			</form>
		</Card>
	);
}
