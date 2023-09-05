import * as tf from '@tensorflow/tfjs-node';
import fs from 'fs/promises';

const genreList = [
  'Action', 'Adventure', 'Avant Garde', 'Award Winning', 'Boys Love',
  'Comedy', 'Drama', 'Fantasy', 'Girls Love', 'Gourmet', 'Horror', 'Mystery',
  'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural', 'Suspense',
  'ecchi', 'erotica'
];

function extractDuration(str) {
  const durationValue = str === undefined || str === 'Unknown' ? '20 min' : str;
  const match = durationValue.match(/\d+/); // Find the first sequence of digits
  return match ? parseInt(match[0], 10) : 0;
}

function ratingToInt(rating) {
  const ratingMap = {
    'PG-13 - Teens 13 or older': 1,
    'PG - Children': 2,
    'R - 17+ (violence & profanity)': 3,
    'G - All Ages': 4,
    'R+ - Mild Nudity': 5,
    'Rx - Hentai': 6,
  };
  return ratingMap[rating] || 0;
}
const oneHotEncodeScore = (score) => {
  const classes = 6;
  const index = scoreToClass(score);
  return Array(classes)
    .fill(0)
    .map((_, i) => (i === index ? 1 : 0));
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

  const splitData = (data, trainSize, valSize) => {
  const shuffled = shuffleArray([...data]);
  const trainEnd = Math.floor(trainSize * shuffled.length);
  const valEnd = trainEnd + Math.floor(valSize * shuffled.length);
  return {
    train: shuffled.slice(0, trainEnd),
    val: shuffled.slice(trainEnd, valEnd),
    test: shuffled.slice(valEnd)
  };
};

const shuffleArray = (array) => {
	let currentIndex = array.length,
	  randomIndex;
  
	while (currentIndex !== 0) {
	  randomIndex = Math.floor(Math.random() * currentIndex);
	  currentIndex--;
  
	  [array[currentIndex], array[randomIndex]] = [
		array[randomIndex],
		array[currentIndex]
	  ];
	}
  
	return array;
  };

function oneHotEncodeGenre(genreStr) {
  return genreList.map((genre) => (genreStr.includes(genre) ? 1 : 0));
}

async function trainModel() {
  const animeData = await loadData();
  if (!animeData || !animeData.length) {
    console.error('Anime data is empty or not an array!');
    return;
  }

  console.log('Train model started');

  const tensors = animeData.map((d) => {
    // Handle missing or undefined values with default values
    const episodes = d.episodes || 0;
    const duration = d.duration || 'Unknown';
    const status = d.status || '';
    const airing = d.airing || '';
    const rating = d.rating || '';
    const rank = d.rank || 0;
    const popularity = d.popularity || 0;
    const genre = d.genre || ''; // Make sure genre is a string

    const featuresTensor = tf.tensor([
      episodes * extractDuration(duration),
      status === 'Finished Airing' ? 1 : 0,
      airing !== 'False' ? 0 : 1,
      ratingToInt(rating),
      rank,
      popularity,
      ...oneHotEncodeGenre(genre)
    ]);

    return {
      features: featuresTensor,
      label: tf.tensor(oneHotEncodeScore(d.score))
    };
  });

  const splitSizes = { train: 0.7, val: 0.15 };
  const { train, val, test } = splitData(tensors, splitSizes.train, splitSizes.val);

  const model = tf.sequential();
  model.add(tf.layers.dense({ units: 128, activation: 'relu', inputShape: [train[0].features.shape[0]] }));
  model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 6, activation: 'softmax' }));

  model.compile({
    optimizer: tf.train.adam(0.0005),
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy']
  });

  const xTrain = tf.stack(train.map((item) => item.features));
  const yTrain = tf.stack(train.map((item) => item.label));
  const xVal = tf.stack(val.map((item) => item.features));
  const yVal = tf.stack(val.map((item) => item.label));

  try {
    const history = await model.fit(xTrain, yTrain, {
      epochs: 200,
      batchSize: 400,
      validationData: [xVal, yVal]
    });

    console.log('Training complete');
    console.log('Epochs:', history.epoch[history.epoch.length - 1]);
    console.log('Last Loss Value:', history.history.loss[history.epoch.length - 1]);

    await model.save('file://../public/anime-recommender');
    console.log('Model saved to ./public/anime-recommender.');
  } catch (error) {
    console.error('Error occurred during training:', error);
  }
}

async function loadData() {
  const data = await fs.readFile('../public/csvjson.json', 'utf-8');
  return JSON.parse(data);
}

(async () => {
  await trainModel();
})();
