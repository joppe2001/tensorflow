import * as tf from '@tensorflow/tfjs-node';
import fs from 'fs/promises';

// Function to normalize a tensor
const normalizeTensor = (tensor) => {
  const min = tensor.min();
  const max = tensor.max();
  return tensor.sub(min).div(max.sub(min));
};

const trainModel = async (animeData) => {
  console.log("Train model started");

  // Get features and normalize them
  const features = animeData.map((d) => tf.tensor([
    ...d.hotEncodedGenres,
    d.ageRating,
    d.score,
    d.normalizedEpisodes,
    d.normalizedRank,
    d.normalizedPopularity,
    ...d.hotEncodedThemes,
    ...d.hotEncodedDemographics,
  ]));

  // Normalize tensors here (if needed)
  const normalizedFeatures = features.map(tensor => normalizeTensor(tensor));

  // Define the model
  const model = tf.sequential();

  // First Dense Layer
  model.add(tf.layers.dense({
    units: 64,
    activation: 'relu',
    kernelRegularizer: tf.regularizers.l2({ l2: 0.01 }),
    inputShape: [normalizedFeatures[0].shape[0]],
  }));

  // Second Dense Layer
  model.add(tf.layers.dense({
    units: 32,
    activation: 'tanh',
    kernelRegularizer: tf.regularizers.l2({ l2: 0.01 }),
  }));

  // Output Layer
  model.add(tf.layers.dense({
    units: normalizedFeatures[0].shape[0],
    activation: 'sigmoid',
  }));

  // Compile the model
  const optimizer = tf.train.adam(0.001);
  model.compile({
    optimizer: optimizer,
    loss: 'meanSquaredError',
  });

  // Prepare data for training
  const xTrain = tf.stack(normalizedFeatures);
  const yTrain = tf.stack(normalizedFeatures); // assuming autoencoder architecture

  // Train the model
  const history = await model.fit(xTrain, yTrain, {
    epochs: 100,  // increased epochs
    batchSize: 50,  // smaller batch size
  });

  // Logging
  console.log("Training complete");
  console.log("Epochs:", history.epoch[history.epoch.length - 1]);
  console.log("Last Loss Value:", history.history.loss[history.epoch.length - 1]);

  // Save the model
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
