export const findSimilarAnimes = (prediction, animeDataArray, animeName) => {
  // Set the weights for genre and age rating
  const genreWeight = 1; // Feel free to change
  const ageWeight = 1; // Feel free to change,
  const scoreWeight = 1; // Feel free to change
  const themeWeight = 10; // Feel free to change
  const demographicWeight = 5; // Feel free to change

  const dists = animeDataArray.map((anime) => {
    const features = [
      ...anime.hotEncodedGenres.map((genre) => genre * genreWeight),
      (anime.ageRating / 10.0) * ageWeight,
      (anime.score / 10.0) * scoreWeight,
      ...anime.hotEncodedThemes.map((theme) => theme * themeWeight),
      ...anime.hotEncodedDemographics.map(
        (demographic) => demographic * demographicWeight
      ),
    ];

    let sum = 0;
    for (let i = 0; i < features.length; i++) {
      sum += (features[i] - prediction[i]) ** 2;
    }

    return Math.sqrt(sum);
  });
  const sortedIndices = dists
    .map((_, index) => index)
    .sort((a, b) => dists[a] - dists[b]);
    
  const filteredIndices = sortedIndices.filter(
    (index) => animeDataArray[index].title !== animeName
  );

  return filteredIndices
    .slice(0, 5)
    .map((index) => [
      animeDataArray[index].title,
      `score: ${animeDataArray[index].score}`,
      `rank: ${animeDataArray[index].normalizedRank}`,
    ]); // Changed from top 20 to top 5
};
