import type { Metadata } from "next";

import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = {
	title: "Log in",
	description: "Log in or register to access your account.",
};

export default function Home() {
	return (
		<div className="bg-background flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
			<div className="flex w-full max-w-md flex-col gap-6">
				<header className="space-y-2 text-center">
					<h1 className="text-3xl font-semibold tracking-tight">Welcome</h1>
					<p className="text-muted-foreground text-sm sm:text-base">
						Log in to your account or create a new one to get started.
					</p>
				</header>
				<AuthForm />
			</div>
		</div>
	);
}
