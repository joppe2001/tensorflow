import * as tf from "@tensorflow/tfjs-node";
import fs from "fs/promises";
import {
	extractDuration,
	ratingToInt,
	oneHotEncodeGenre,
} from "../utils/animeUtils";

// Helper functions
const genreList = [
	"Action",
	"Adventure",
	"Avant Garde",
	"Award Winning",
	"Boys Love",
	"Comedy",
	"Drama",
	"Fantasy",
	"Girls Love",
	"Gourmet",
	"Horror",
	"Mystery",
	"Romance",
	"Sci-Fi",
	"Slice of Life",
	"Sports",
	"Supernatural",
	"Suspense",
	"ecchi",
	"erotica",
	"hentai",
]; // Include all possible genres

const oneHotEncodeGenre = (genreStr) =>
	genreList.map((genre) => (genreStr.includes(genre) ? 1 : 0));

	console.log(tensors);

const splitData = (data, trainSize, valSize) => {
	const shuffled = tf.util.shuffle(data);
	const trainEnd = Math.floor(trainSize * shuffled.length);
	const valEnd = trainEnd + Math.floor(valSize * shuffled.length);
	return {
		train: shuffled.slice(0, trainEnd),
		val: shuffled.slice(trainEnd, valEnd),
		test: shuffled.slice(valEnd),
	};
};

const scoreToClass = (score) => {
	if (score < 5) {
		return 0;
	} else if (score < 6) {
		return 1;
	} else if (score < 7) {
		return 2;
	} else if (score < 8) {
		return 3;
	} else if (score < 9) {
		return 4;
	} else {
		return 5;
	}
};

const oneHotEncodeScore = (score) => {
	const classes = 6;
	const index = scoreToClass(score);
	return Array(classes)
		.fill(0)
		.map((_, i) => (i === index ? 1 : 0));
};

const trainModel = async (animeData) => {
	console.log("Train model started");

	const tensors = animeData.map((d) => ({
		features: tf.tensor([
			d.episodes * extractDuration(d.duration),
			d.status === "Finished Airing" ? 1 : 0,
			d.airing === "True" ? 1 : 0,
			ratingToInt(d.rating),
			d.rank,
			d.popularity,
			...oneHotEncodeGenre(d.genre),
		]),
		label: tf.tensor(oneHotEncodeScore(d.score)),
	}));

	// Splitting data into training, validation, and test sets
	const splitSizes = { train: 0.7, val: 0.15 };
	const { train, val, test } = splitData(
		tensors,
		splitSizes.train,
		splitSizes.val
	);

	const model = tf.sequential();

	model.add(
		tf.layers.dense({
			units: 64,
			activation: "relu",
			inputShape: [train[0].features.shape[0]],
		})
	);

	model.add(tf.layers.dense({ units: 32, activation: "relu" }));

	// Change this part for classification
	model.add(
		tf.layers.dense({
			units: 6, // The number of classes you have
			activation: "softmax",
		})
	);

	model.compile({
		optimizer: tf.train.adam(),
		loss: "categoricalCrossentropy",
		metrics: ["accuracy"],
	});

	const xTrain = tf.stack(train.map((item) => item.features));
	const yTrain = tf.stack(train.map((item) => item.label));
	const xVal = tf.stack(val.map((item) => item.features));
	const yVal = tf.stack(val.map((item) => item.label));

	const history = await model.fit(xTrain, yTrain, {
		epochs: 50,
		batchSize: 100,
		validationData: [xVal, yVal],
	});

	console.log("Training complete");
	console.log("Epochs:", history.epoch[history.epoch.length - 1]);
	console.log(
		"Last Loss Value:",
		history.history.loss[history.epoch.length - 1]
	);

	await model.save("file://./public/anime-recommender");
	console.log("Model saved to ./public/anime-recommender.");
};

const readFile = async () => {
	const data = await fs.readFile("../public/csvjson.json", "utf-8");
	return JSON.parse(data);
};

(async () => {
	const animeData = await readFile();
	await trainModel(animeData);
})();
