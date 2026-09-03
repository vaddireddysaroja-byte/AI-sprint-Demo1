"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { McqTable } from "@/components/question-bank/mcq-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { logoutUser } from "@/lib/auth-client";
import type { ApiMcqListItem } from "@/lib/mcq/serializers";

type QuestionBankLandingProps = {
	username: string;
	mcqs: ApiMcqListItem[];
};

export function QuestionBankLanding({ username, mcqs }: QuestionBankLandingProps) {
	const router = useRouter();

	async function handleLogout() {
		await logoutUser();
		router.replace("/");
	}

	return (
		<div className="bg-background min-h-screen px-4 py-10 sm:px-6">
			<div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
				<header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
					<div className="space-y-2">
						<Badge variant="secondary">Signed in</Badge>
						<h1 className="text-3xl font-semibold tracking-tight">Question Bank</h1>
						<p className="text-muted-foreground max-w-2xl text-sm sm:text-base">
							Welcome back, {username}.
						</p>
					</div>
					<div className="flex flex-wrap gap-2">
						<Button nativeButton={false} render={<Link href="/question-bank/mcq/new" />}>
							Create question
						</Button>
						<Button variant="outline" onClick={() => void handleLogout()}>
							Log out
						</Button>
					</div>
				</header>

				<McqTable initialMcqs={mcqs} />
			</div>
		</div>
	);
}
