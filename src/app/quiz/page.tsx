import type { Metadata } from "next";

import { FoodQuiz } from "@/components/quiz/food-quiz";

export const metadata: Metadata = {
	title: "Food Options Quiz",
	description: "Test your knowledge of common food and menu options with 5 multiple choice questions.",
};

export default function QuizPage() {
	return (
		<div className="bg-background min-h-screen px-4 py-10 sm:px-6">
			<div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
				<header className="space-y-2 text-center sm:text-left">
					<h1 className="text-3xl font-semibold tracking-tight">Food options quiz</h1>
					<p className="text-muted-foreground max-w-2xl text-sm sm:text-base">
						Choose the best answer for each question about food and menu options. Your score
						appears after the final question.
					</p>
				</header>
				<FoodQuiz />
			</div>
		</div>
	);
}
