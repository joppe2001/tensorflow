import * as tf from '@tensorflow/tfjs';
import { findSimilarAnimes } from '#imports';

export const getRecommendation = async (animeData, animeName) => {
  const loadedModel = await tf.loadLayersModel('/anime-recommender/model.json');
  console.log(
    'Model loaded. Input shape expected:',
    loadedModel.inputs[0].shape
  );

  const chosenAnime = animeData.find((anime) => anime.title === animeName);
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
    ...chosenAnime.hotEncodedThemes,
    ...chosenAnime.hotEncodedDemographics
  ]);

  const prediction = loadedModel.predict(chosenFeatures.reshape([1, -1]));
  const predictionArray = await prediction.array();
  const similarAnimes = findSimilarAnimes(
    predictionArray[0],
    animeData,
    animeName
  );

  console.log('Recommended Animes:', similarAnimes);
  return similarAnimes;
};
