import Link from "next/link";

type McqPageShellProps = {
	title: string;
	children: React.ReactNode;
};

export function McqPageShell({ title, children }: McqPageShellProps) {
	return (
		<div className="bg-background min-h-screen px-4 py-10 sm:px-6">
			<div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
				<div>
					<Link
						href="/question-bank"
						className="text-muted-foreground hover:text-foreground text-sm transition-colors"
					>
						← Back to Question Bank
					</Link>
					<h1 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h1>
				</div>
				{children}
			</div>
		</div>
	);
}
