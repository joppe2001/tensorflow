import * as tf from "@tensorflow/tfjs";
import { findSimilarAnimes } from "#imports";

export const trainModel = async (animeData) => {
	console.log("Train model started");

	const normalizedData = animeData.map((d) => ({
		...d,
		ageRating: d.ageRating / 10.0,
	}));

	const features = normalizedData.map(
		(d) => tf.tensor([...d.hotEncodedGenres, d.ageRating]) // Adding new features
	);

	const model = tf.sequential();

	model.add(
		tf.layers.dense({
			units: 64,
			activation: "relu",
			inputShape: [features[0].shape[0]],
		})
	);
	model.add(tf.layers.dense({ units: 32, activation: "relu" }));
	model.add(
		tf.layers.dense({ units: features[0].shape[0], activation: "sigmoid" })
	);

	model.compile({
		optimizer: tf.train.adam(),
		loss: "meanSquaredError",
	});

	const xTrain = tf.stack(features);
	const yTrain = tf.stack(features);

	const history = await model.fit(xTrain, yTrain, {
		epochs: 800,
		batchSize: 1500,
	});

	console.log("Training complete");
	console.log("Epochs:", history.epoch[history.epoch.length - 1]);
	console.log(
		"Last Loss Value:",
		history.history.loss[history.epoch.length - 1]
	);

	if (process.client) {
		await model.save("localstorage://anime-recommender");
	} else if (process.server) {
		await model.save("file://./public/anime-recommender");
	}
};

export const getRecommendation = async (animeData, animeName) => {
	if (process.client) {
		var loadedModel = await tf.loadLayersModel(
			"localstorage://anime-recommender"
		);
	} else if (process.server) {
		var loadedModel = await tf.loadLayersModel(
			"file://./public/anime-recommender/model.json"
		);
	}

	const chosenAnime = animeData.find((anime) => anime.title === animeName);
	if (!chosenAnime) {
		console.error(`Anime "${animeName}" not found in data.`);
		return [];
	}

	const chosenFeatures = tf.tensor([
		...chosenAnime.hotEncodedGenres,
		chosenAnime.ageRating / 10.0,
	]);

	const prediction = loadedModel.predict(chosenFeatures.reshape([1, -1]));
	const predictionArray = await prediction.array();
	const similarAnimes = findSimilarAnimes(predictionArray[0], animeData);

	console.log("Recommended Animes:", similarAnimes);
	return similarAnimes;
};
