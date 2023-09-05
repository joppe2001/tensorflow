export const findSimilarAnimes = (prediction, animeDataArray, animeName) => {
  const episodeDurationWeight = 1;
  const statusWeight = 1;
  const airingWeight = 1;
  const ratingWeight = 1;
  const scoreWeight = 1;
  const rankWeight = 10;
  const popularityWeight = 1;
  const genreWeight = 1;

  const dists = animeDataArray.map((anime) => {
    const duration = parseInt(anime.duration.split(' ')[0]);
    const features = [
      anime.episodes * duration * episodeDurationWeight,
      (anime.status === 'Finished Airing' ? 1 : 0) * statusWeight,
      (anime.airing === 'True' ? 1 : 0) * airingWeight,
      ratingToInt(anime.rating) * ratingWeight,
      (anime.score / 10.0) * scoreWeight,
      anime.rank * rankWeight,
      anime.popularity * popularityWeight,
      ...oneHotEncodeGenre(anime.genre).map((g) => g * genreWeight)
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
    (index) => animeDataArray[index].title_english !== animeName
  );

  return filteredIndices
    .slice(0, 5)
    .map((index) => [
      animeDataArray[index].title,
      `score: ${animeDataArray[index].score}`,
      `rank: ${animeDataArray[index].rank}`
    ]);
};

export const extractDuration = (str) => {
  const durationValue = str === undefined || str === 'Unknown' ? '20 min' : str;

  const match = durationValue.match(/\d+/); // Find the first sequence of digits

  return match ? parseInt(match[0], 10) : 0;
};

export function ratingToInt(rating) {
  switch (rating) {
    case 'PG-13 - Teens 13 or older':
      return 1;
    case 'PG - Children':
      return 2;
    case 'R - 17+ (violence & profanity)':
      return 3;
    case 'G - All Ages':
      return 4;
    case 'R+ - Mild Nudity':
      return 5;
    case 'Rx - Hentai':
      return 6;
    default:
      return 0;
  }
}

export function oneHotEncodeGenre(genreStr) {
  const genreList = [
    'Action',
    'Adventure',
    'Avant Garde',
    'Award Winning',
    'Boys Love',
    'Comedy',
    'Drama',
    'Fantasy',
    'Girls Love',
    'Gourmet',
    'Horror',
    'Mystery',
    'Romance',
    'Sci-Fi',
    'Slice of Life',
    'Sports',
    'Supernatural',
    'Suspense',
    'ecchi',
    'erotica'
  ];

  if (typeof genreStr !== 'string') {
    // console.error('genreStr is not a valid string.');
    return [];
  }

  if (!genreStr.trim()) {
    // Empty or whitespace-only genreStr, return an array of 0s
    return Array.from({ length: genreList.length }, () => 0);
  }

  return genreList.map((genre) => (genreStr.includes(genre) ? 1 : 0));
}
