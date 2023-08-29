let tf;

if (process.server) {
  tf = require('@tensorflow/tfjs-node');
} else {
  // Import the browser version or any other behavior you need on the client
  tf = require('@tensorflow/tfjs');
}
//make sure this works on server side
export const trainModel = async () => {
  console.log('Train model started');
  // Fetch JSON data from server
  const response = await fetch('http://localhost:3000/animeWithGenres.json');
  const rawData = await response.json();
  console.log('Data fetched. Now training...');
  const normalizedData = rawData.map((d) => ({
    ...d,
    ageRating: d.ageRating / 10.0
  }));

  const features = normalizedData.map((d) =>
    tf.tensor([...d.hotEncodedGenres, d.ageRating])
  );

  const model = tf.sequential();

  model.add(
    tf.layers.dense({
      units: 64,
      activation: 'relu',
      inputShape: [features[0].shape[0]]
    })
  );
  model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
  model.add(
    tf.layers.dense({ units: features[0].shape[0], activation: 'sigmoid' })
  );

  model.compile({
    optimizer: tf.train.adam(),
    loss: 'meanSquaredError'
  });

  const xTrain = tf.stack(features);
  const yTrain = tf.stack(features);

  const history = await model.fit(xTrain, yTrain, {
    epochs: 50,
    batchSize: 10
  });

  console.log('Training complete', history);

  // Save the model to local storage
  if (process.client) {
    await model.save('localstorage://anime-recommender');
  } else if (process.server) {
    await model.save('file://./public/anime-recommender');
  }

  const predictions = model.predict(xTrain);
};

// Call the function and catch any errors
trainModel().catch(console.error);
