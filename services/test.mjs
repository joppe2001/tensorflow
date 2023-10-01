import * as tf from "@tensorflow/tfjs-node";
import fs from "fs/promises";

const trainModel = async (xTrain, yTrain, xVal, yVal) => {
	console.log("Creating the model...");

	const model = tf.sequential();

	model.add(
		tf.layers.dense({
			units: 256, // increased units
			activation: "relu",
			inputShape: [xTrain.shape[1]],
		})
	);

	model.add(tf.layers.dropout(0.2)); // dropout layer to prevent overfitting
	model.add(tf.layers.dropout(0.2)); // dropout layer

	model.add(tf.layers.dense({ units: xTrain.shape[1], activation: "sigmoid" }));

	console.log("Compiling the model...");
	model.compile({
		optimizer: tf.train.adam(0.0001),
		loss: "meanSquaredError",
	});

	console.log("Training the model...");
	const history = await model.fit(xTrain, yTrain, {
		epochs: 50, // increased epochs
		batchSize: 10, // changed batch size
		validationData: [xVal, yVal],
	});

	console.log("Training complete!");
	console.log("History Object:", history);
	console.log("Epochs:", history.epoch[history.epoch.length - 1]);
	console.log(
		"Last Loss Value:",
		history.history.loss[history.epoch.length - 1]
	);

	await model.save("file://../public/anime-recommender");
	console.log("Model saved to ./public/anime-recommender.");
};

const readFile = async () => {
	console.log("Reading the dataset...");
	const data = await fs.readFile("../public/hotEncodedAnime.json", "utf-8");
	return JSON.parse(data);
};

(async () => {
	const animeData = await readFile();

	const features = animeData.map((d) => [
		...d.hotEncodedGenres,
		d.episodes,
		d.popular,
	]);

	const dataTensors = tf.stack(features);

	const splitIdx1 = Math.floor(features.length * 0.8);
	const splitIdx2 = Math.floor(features.length * 0.9);

	const xTrain = dataTensors.slice([0, 0], [splitIdx1, -1]);
	const xVal = dataTensors.slice([splitIdx1, 0], [splitIdx2 - splitIdx1, -1]);
	const xTest = dataTensors.slice([splitIdx2, 0]);

	const yTrain = xTrain.clone();
	const yVal = xVal.clone();
	const yTest = xTest.clone();

	console.log(`Training set size: ${xTrain.shape[0]}`);
	console.log(`Validation set size: ${xVal.shape[0]}`);
	console.log(`Test set size: ${xTest.shape[0]}`);

	await trainModel(xTrain, yTrain, xVal, yVal, xTest, yTest);
})();
