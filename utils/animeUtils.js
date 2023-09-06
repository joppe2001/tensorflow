export const findSimilarAnimes = (prediction, animeDataArray, animeName) => {

  const dists = animeDataArray.map((anime) => {
    const features = [
      ...anime.hotEncodedGenres,
      anime.ageRating,
      anime.score,
      anime.normalizedEpisodes,
      anime.normalizedRank,
      anime.normalizedPopularity
    ];

    let sum = 0;
    for (let i = 0; i < features.length; i++) {
      sum += (features[i] - prediction[i]) ** 2;
    }

    return Math.sqrt(sum);
  });

  const sortedIndices = dists
    .map((_, index) => index)
    .sort((a, b) => dists[b] - dists[a]);

  const filteredIndices = sortedIndices.filter(
    (index) => animeDataArray[index].title_english !== animeName
  );

  return filteredIndices
    .slice(0, 5)
    .map((index) => [
      animeDataArray[index].title_english || animeDataArray[index].title,
      `score: ${(animeDataArray[index].score * 10).toFixed(2)}%`,
      `rank: ${animeDataArray[index].normalizedRank.toFixed(2)}`,
      `popularity: ${animeDataArray[index].normalizedPopularity.toFixed(2)}`
    ]);
};
