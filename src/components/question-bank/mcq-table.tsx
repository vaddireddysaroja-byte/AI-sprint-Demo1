"use client";

import { MoreVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { deleteMcq } from "@/lib/mcq-client";
import type { ApiMcqListItem } from "@/lib/mcq/serializers";

type McqTableProps = {
	initialMcqs: ApiMcqListItem[];
};

export function McqTable({ initialMcqs }: McqTableProps) {
	const router = useRouter();
	const [mcqs, setMcqs] = useState(initialMcqs);
	const [mcqToDelete, setMcqToDelete] = useState<ApiMcqListItem | null>(null);
	const [deleteError, setDeleteError] = useState<string | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	async function handleConfirmDelete() {
		if (!mcqToDelete) {
			return;
		}

		setIsDeleting(true);
		setDeleteError(null);

		const result = await deleteMcq(mcqToDelete.id);
		setIsDeleting(false);

		if (!result.ok) {
			setDeleteError(result.error);
			return;
		}

		setMcqs((current) => current.filter((mcq) => mcq.id !== mcqToDelete.id));
		setMcqToDelete(null);
	}

	if (mcqs.length === 0) {
		return (
			<div className="border-border rounded-xl border border-dashed p-8 text-center">
				<h2 className="text-lg font-medium">No questions yet</h2>
				<p className="text-muted-foreground mt-2 text-sm">
					Create your first question using the button above.
				</p>
			</div>
		);
	}

	return (
		<>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Name</TableHead>
						<TableHead>Question</TableHead>
						<TableHead className="w-[72px] text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{mcqs.map((mcq) => (
						<TableRow key={mcq.id}>
							<TableCell className="font-medium">{mcq.name}</TableCell>
							<TableCell className="max-w-md">
								<span className="block truncate" title={mcq.question}>
									{mcq.question}
								</span>
							</TableCell>
							<TableCell className="text-right">
								<DropdownMenu>
									<DropdownMenuTrigger
										render={
											<Button
												variant="ghost"
												size="icon-sm"
												aria-label={`Actions for ${mcq.name}`}
											/>
										}
									>
										<MoreVertical />
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										<DropdownMenuItem
											onClick={() => router.push(`/question-bank/mcq/${mcq.id}/edit`)}
										>
											Edit
										</DropdownMenuItem>
										<DropdownMenuItem
											onClick={() => router.push(`/question-bank/mcq/${mcq.id}/preview`)}
										>
											Preview
										</DropdownMenuItem>
										<DropdownMenuItem
											variant="destructive"
											onClick={() => {
												setDeleteError(null);
												setMcqToDelete(mcq);
											}}
										>
											Delete
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>

			<Dialog
				open={mcqToDelete !== null}
				onOpenChange={(open) => {
					if (!open) {
						setMcqToDelete(null);
						setDeleteError(null);
					}
				}}
			>
				<DialogContent showCloseButton={!isDeleting}>
					<DialogHeader>
						<DialogTitle>Delete question?</DialogTitle>
						<DialogDescription>
							This will permanently delete &quot;{mcqToDelete?.name}&quot; and its choices.
						</DialogDescription>
					</DialogHeader>
					{deleteError ? (
						<p className="text-destructive text-sm" role="alert">
							{deleteError}
						</p>
					) : null}
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setMcqToDelete(null)}
							disabled={isDeleting}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={() => void handleConfirmDelete()}
							disabled={isDeleting}
						>
							{isDeleting ? "Deleting..." : "Delete"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
