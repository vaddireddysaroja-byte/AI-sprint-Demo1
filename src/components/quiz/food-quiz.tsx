"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
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
	FieldGroup,
	FieldLabel,
	FieldLegend,
	FieldSet,
} from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import { FOOD_QUIZ_QUESTIONS } from "@/lib/food-quiz-data";
import { cn } from "@/lib/utils";

const TOTAL_QUESTIONS = FOOD_QUIZ_QUESTIONS.length;

function getScoreMessage(score: number) {
	if (score === TOTAL_QUESTIONS) {
		return "Perfect score! You know your food options.";
	}

	if (score >= 4) {
		return "Great job! You have a strong sense of menu choices.";
	}

	if (score >= 2) {
		return "Not bad. A few more meals and you will be an expert.";
	}

	return "Keep exploring the menu. Every meal is a chance to learn.";
}

export function FoodQuiz() {
	const [currentIndex, setCurrentIndex] = useState(0);
	const [answers, setAnswers] = useState<Record<string, string>>({});
	const [showResults, setShowResults] = useState(false);

	const currentQuestion = FOOD_QUIZ_QUESTIONS[currentIndex];
	const selectedOptionId = answers[currentQuestion.id];
	const answeredCount = Object.keys(answers).length;
	const isLastQuestion = currentIndex === TOTAL_QUESTIONS - 1;

	const score = useMemo(() => {
		return FOOD_QUIZ_QUESTIONS.reduce((total, question) => {
			return answers[question.id] === question.correctOptionId ? total + 1 : total;
		}, 0);
	}, [answers]);

	function handleSelectOption(optionId: string) {
		setAnswers((previous) => ({
			...previous,
			[currentQuestion.id]: optionId,
		}));
	}

	function handleNext() {
		if (!selectedOptionId) {
			return;
		}

		if (isLastQuestion) {
			setShowResults(true);
			return;
		}

		setCurrentIndex((previous) => previous + 1);
	}

	function handlePrevious() {
		setCurrentIndex((previous) => Math.max(previous - 1, 0));
	}

	function handleRestart() {
		setCurrentIndex(0);
		setAnswers({});
		setShowResults(false);
	}

	if (showResults) {
		return (
			<Card className="mx-auto w-full max-w-2xl">
				<CardHeader>
					<CardTitle>Quiz complete</CardTitle>
					<CardDescription>Here is how you did on the food options quiz.</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="flex flex-col items-center gap-3 rounded-xl border bg-muted/30 p-8 text-center">
						<Badge variant="secondary">Final score</Badge>
						<p className="text-4xl font-semibold tracking-tight">
							{score} / {TOTAL_QUESTIONS}
						</p>
						<p className="max-w-md text-sm text-muted-foreground">{getScoreMessage(score)}</p>
					</div>

					<Separator />

					<div className="space-y-4">
						{FOOD_QUIZ_QUESTIONS.map((question, index) => {
							const selectedId = answers[question.id];
							const isCorrect = selectedId === question.correctOptionId;
							const selectedLabel = question.options.find((option) => option.id === selectedId)?.label;
							const correctLabel = question.options.find(
								(option) => option.id === question.correctOptionId,
							)?.label;

							return (
								<div key={question.id} className="space-y-2 rounded-lg border p-4">
									<div className="flex items-start justify-between gap-3">
										<p className="font-medium">
											{index + 1}. {question.question}
										</p>
										<Badge variant={isCorrect ? "default" : "destructive"}>
											{isCorrect ? "Correct" : "Incorrect"}
										</Badge>
									</div>
									<p className="text-sm text-muted-foreground">
										Your answer: {selectedLabel ?? "No answer"}
									</p>
									{!isCorrect ? (
										<p className="text-sm text-muted-foreground">
											Correct answer: {correctLabel}
										</p>
									) : null}
								</div>
							);
						})}
					</div>
				</CardContent>
				<CardFooter>
					<Button onClick={handleRestart}>Take quiz again</Button>
				</CardFooter>
			</Card>
		);
	}

	return (
		<Card className="mx-auto w-full max-w-2xl">
			<CardHeader>
				<div className="flex items-center justify-between gap-3">
					<div className="space-y-1">
						<CardTitle>Food options quiz</CardTitle>
						<CardDescription>
							Answer all {TOTAL_QUESTIONS} multiple choice questions about menu choices.
						</CardDescription>
					</div>
					<Badge variant="outline">
						Question {currentIndex + 1} of {TOTAL_QUESTIONS}
					</Badge>
				</div>
			</CardHeader>

			<CardContent className="space-y-6">
				<div className="flex items-center gap-2">
					{FOOD_QUIZ_QUESTIONS.map((question, index) => (
						<div
							key={question.id}
							className={cn(
								"h-2 flex-1 rounded-full bg-muted",
								index <= currentIndex && "bg-primary",
								answers[question.id] && "bg-primary/80",
							)}
						/>
					))}
				</div>

				<FieldSet>
					<FieldLegend>{currentQuestion.question}</FieldLegend>
					<FieldGroup data-slot="radio-group">
						{currentQuestion.options.map((option) => {
							const isSelected = selectedOptionId === option.id;

							return (
								<FieldLabel
									key={option.id}
									htmlFor={`${currentQuestion.id}-${option.id}`}
									className={cn(
										"cursor-pointer rounded-lg border px-4 py-3 transition-colors",
										isSelected && "border-primary bg-primary/5",
									)}
								>
									<input
										id={`${currentQuestion.id}-${option.id}`}
										type="radio"
										name={currentQuestion.id}
										value={option.id}
										checked={isSelected}
										onChange={() => handleSelectOption(option.id)}
										className="size-4 accent-primary"
									/>
									{option.label}
								</FieldLabel>
							);
						})}
					</FieldGroup>
				</FieldSet>
			</CardContent>

			<CardFooter className="flex items-center justify-between gap-3">
				<p className="text-sm text-muted-foreground">
					{answeredCount} of {TOTAL_QUESTIONS} answered
				</p>
				<div className="flex gap-2">
					<Button
						variant="outline"
						onClick={handlePrevious}
						disabled={currentIndex === 0}
					>
						Previous
					</Button>
					<Button onClick={handleNext} disabled={!selectedOptionId}>
						{isLastQuestion ? "See score" : "Next"}
					</Button>
				</div>
			</CardFooter>
		</Card>
	);
}
