import { z } from "zod";

export const registerSchema = z
	.object({
		username: z
			.string()
			.trim()
			.min(1, "Username is required.")
			.max(50, "Username must be 50 characters or fewer."),
		email: z.string().trim().email("Enter a valid email address."),
		password: z.string().min(8, "Password must be at least 8 characters."),
		confirmPassword: z.string().min(1, "Confirm password is required."),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords do not match.",
		path: ["confirmPassword"],
	});

export const loginSchema = z.object({
	email: z.string().trim().email("Enter a valid email address."),
	password: z.string().min(1, "Password is required."),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
