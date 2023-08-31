import * as tf from "@tensorflow/tfjs-node";

const trainModel = async (animeData) => {
	console.log("Train model started");

	const features = animeData.map(
		(d) => tf.tensor([...d.hotEncodedGenres, d.ageRating, d.score])
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
		epochs: 1200,
		batchSize: 1500,
	});

	console.log("Training complete");
	console.log("Epochs:", history.epoch[history.epoch.length - 1]);
	console.log(
		"Last Loss Value:",
		history.history.loss[history.epoch.length - 1]
	);

	if (process.client) {
		await model.save('file://./public/anime-recommender');
		console.log("Model saved to local storage.");
	} else if (process.server) {
		await model.save("file://./public/anime-recommender");
		console.log("Model saved to ./public/anime-recommender.");
	}

};