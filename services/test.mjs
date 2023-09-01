import * as tf from '@tensorflow/tfjs-node';
import fs from 'fs/promises';

const normalizeTensor = (tensor) => {
  const min = tensor.min();
  const max = tensor.max();
  return tensor.sub(min).div(max.sub(min));
};

const trainModel = async (animeData) => {
  console.log("Train model started");

  const features = animeData.map(
    (d) => tf.tensor([
      ...d.hotEncodedGenres, 
      d.ageRating, 
      d.score, 
      d.normalizedEpisodes, 
      d.normalizedRank, 
      d.normalizedPopularity,
      ...d.hotEncodedThemes,
      ...d.hotEncodedDemographics,
    ])
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
    epochs: 50,
    batchSize: 100,
  });

  console.log("Training complete");
  console.log(history)
  console.log("Epochs:", history.epoch[history.epoch.length - 1]);
  console.log(
    "Last Loss Value:",
    history.history.loss[history.epoch.length - 1]
  );

  await model.save("file://../public/anime-recommender");
  console.log("Model saved to ./public/anime-recommender.");
};

const readFile = async () => {
  const data = await fs.readFile('../public/hotEncodedAnime.json', 'utf-8');
  return JSON.parse(data);
};

(async () => {
  const animeData = await readFile();
  await trainModel(animeData);
})();
