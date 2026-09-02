"use client";

import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { logoutUser } from "@/lib/auth-client";

type QuestionBankLandingProps = {
	username: string;
};

export function QuestionBankLanding({ username }: QuestionBankLandingProps) {
	const router = useRouter();

	async function handleLogout() {
		await logoutUser();
		router.replace("/");
	}

	return (
		<div className="bg-background min-h-screen px-4 py-10 sm:px-6">
			<div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
				<header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
					<div className="space-y-2">
						<Badge variant="secondary">Signed in</Badge>
						<h1 className="text-3xl font-semibold tracking-tight">Question Bank</h1>
						<p className="text-muted-foreground max-w-2xl text-sm sm:text-base">
							Welcome back, {username}.
						</p>
					</div>
					<Button variant="outline" onClick={() => void handleLogout()}>
						Log out
					</Button>
				</header>
			</div>
		</div>
	);
}
