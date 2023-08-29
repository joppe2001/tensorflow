// Find the most similar animes based on Euclidean distance
export const findSimilarAnimes = (prediction, animeDataArray) => {
  const maxEpisodeCount = Math.max(...animeDataArray.map(a => a.episodeCount || 0)); // Handle nulls or zeros

  const dists = animeDataArray.map((anime) => {
    const normalizedEpisodeCount = (anime.episodeCount || 0) / maxEpisodeCount;  // Handle nulls or zeros
    const features = [...anime.hotEncodedGenres, anime.ageRating / 10.0, normalizedEpisodeCount];
    
    let sum = 0;
    for (let i = 0; i < features.length; i++) {
      sum += (features[i] - prediction[i]) ** 2;
    }
    
    return Math.sqrt(sum);
  });

  const sortedIndices = dists.map((val, index) => index).sort((a, b) => dists[a] - dists[b]);
  return sortedIndices.slice(0, 5).map((index) => animeDataArray[index].title); // Return the top 5 most similar animes
};
