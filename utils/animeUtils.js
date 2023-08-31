export const findSimilarAnimes = (prediction, animeDataArray) => {
  // Set the weights for genre and age rating
  const genreWeight = 10;  // Feel free to change
  const ageWeight = 1;     // Feel free to change
  
  const dists = animeDataArray.map((anime) => {
    // Apply weights to the features
    const features = [
      ...anime.hotEncodedGenres.map(genre => genre * genreWeight),
      anime.ageRating / 10.0 * ageWeight
    ];

    let sum = 0;
    for (let i = 0; i < features.length; i++) {
      sum += (features[i] - prediction[i]) ** 2;
    }

    return Math.sqrt(sum);
  });

  const sortedIndices = dists.map((val, index) => index).sort((a, b) => dists[a] - dists[b]);
  return sortedIndices.slice(0, 5).map((index) => animeDataArray[index].title);  // Changed from top 20 to top 5
};
