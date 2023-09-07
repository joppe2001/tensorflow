import * as tf from '@tensorflow/tfjs';
import { findSimilarAnimes } from '#imports';

export const getRecommendation = async (animeData, animeName) => {
  const loadedModel = await tf.loadLayersModel('/anime-recommender/model.json');
  console.log(
    'Model loaded. Input shape expected:',
    loadedModel.inputs[0].shape
  );


  const chosenAnime = animeData.find((anime) => (anime.title_english || anime.title) === animeName);
  if (!chosenAnime) {
    console.error(`Anime "${animeName}" not found in data.`);
    return [];
  }

  const chosenFeatures = tf.tensor([
    ...chosenAnime.hotEncodedGenres,
    chosenAnime.ageRating,
    chosenAnime.score,
    chosenAnime.normalizedEpisodes,
    chosenAnime.normalizedRank,
    chosenAnime.normalizedPopularity,
  ]);

  const prediction = loadedModel.predict(chosenFeatures.reshape([1, -1]));
  const predictionArray = await prediction.array();
  const invertedPredictionArray = predictionArray[0].map(score => 1 - score);  // Assuming scores are between 0 and 1
  const similarAnimes = findSimilarAnimes(
    invertedPredictionArray,
    animeData,
    animeName
  );
  
  return similarAnimes;
};
