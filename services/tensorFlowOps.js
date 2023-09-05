import * as tf from '@tensorflow/tfjs';
import { findSimilarAnimes } from '#imports';
import { extractDuration, ratingToInt, oneHotEncodeGenre } from '../composables/animeUtils';

export const getRecommendation = async (animeData, animeName) => {
  const loadedModel = await tf.loadLayersModel('/anime-recommender/model.json');
  console.log('Model loaded. Input shape expected:', loadedModel.inputs[0].shape);

  const chosenAnime = animeData.find((anime) => {
    const title = anime.title_english;
    if (typeof title === "string") {
      return title.toLowerCase() === animeName.toLowerCase();
    }
    return false;
  });

  
  if (!chosenAnime) {
    console.error(`Anime "${animeName}" not found in data.`);
    return [];
  }
  
  const chosenFeatures = tf.tensor([
    chosenAnime.episodes * extractDuration(chosenAnime.duration),
    chosenAnime.status === "Finished Airing" ? 1 : 0,
    chosenAnime.airing === "True" ? 1 : 0,
    ratingToInt(chosenAnime.rating),
    chosenAnime.score,
    chosenAnime.rank,
    chosenAnime.popularity,
    ...oneHotEncodeGenre(chosenAnime.genre)
  ]);
  

  const prediction = loadedModel.predict(chosenFeatures.reshape([1, -1]));
  const predictionArray = await prediction.array();
  const similarAnimes = findSimilarAnimes(predictionArray[0], animeData, animeName);

  console.log('Recommended Animes:', similarAnimes);
  return similarAnimes;
};