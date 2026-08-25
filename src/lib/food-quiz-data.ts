export type QuizOption = {
	id: string;
	label: string;
};

export type QuizQuestion = {
	id: string;
	question: string;
	options: QuizOption[];
	correctOptionId: string;
};

export const FOOD_QUIZ_QUESTIONS: QuizQuestion[] = [
	{
		id: "q1",
		question: "Which menu item is typically served as a cold starter?",
		options: [
			{ id: "a", label: "Gazpacho" },
			{ id: "b", label: "Grilled steak" },
			{ id: "c", label: "Chicken noodle soup" },
			{ id: "d", label: "Mac and cheese" },
		],
		correctOptionId: "a",
	},
	{
		id: "q2",
		question: "Which food option is naturally gluten-free?",
		options: [
			{ id: "a", label: "Sourdough bread" },
			{ id: "b", label: "Steamed rice bowl" },
			{ id: "c", label: "Spaghetti" },
			{ id: "d", label: "Croissant" },
		],
		correctOptionId: "b",
	},
	{
		id: "q3",
		question: "Which dish is a classic Japanese food option?",
		options: [
			{ id: "a", label: "Sushi rolls" },
			{ id: "b", label: "Fish tacos" },
			{ id: "c", label: "Margherita pizza" },
			{ id: "d", label: "Beef burrito" },
		],
		correctOptionId: "a",
	},
	{
		id: "q4",
		question: "Which menu choice is a common plant-based protein option?",
		options: [
			{ id: "a", label: "Grilled salmon" },
			{ id: "b", label: "Beef burger" },
			{ id: "c", label: "Tofu stir-fry" },
			{ id: "d", label: "Roast chicken" },
		],
		correctOptionId: "c",
	},
	{
		id: "q5",
		question: "Which dessert option is usually served frozen?",
		options: [
			{ id: "a", label: "Chocolate brownie" },
			{ id: "b", label: "Apple pie" },
			{ id: "c", label: "Vanilla ice cream" },
			{ id: "d", label: "Cheesecake slice" },
		],
		correctOptionId: "c",
	},
];
