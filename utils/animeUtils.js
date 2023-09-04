export const findSimilarAnimes = (prediction, animeDataArray, animeName) => {
	const episodeDurationWeight = 2;
	const statusWeight = 1;
	const airingWeight = 1;
	const ratingWeight = 2;
	const scoreWeight = 1;
	const rankWeight = 2;
	const popularityWeight = 1;
	const genreWeight = 3;

	const dists = animeDataArray.map((anime) => {
		const duration = parseInt(anime.duration.split(" ")[0]);
		const features = [
			anime.episodes * duration * episodeDurationWeight,
			(anime.status === "Finished Airing" ? 1 : 0) * statusWeight,
			(anime.airing === "True" ? 1 : 0) * airingWeight,
			ratingToInt(anime.rating) * ratingWeight,
			(anime.score / 10.0) * scoreWeight,
			anime.rank * rankWeight,
			anime.popularity * popularityWeight,
			...oneHotEncodeGenre(anime.genre).map((g) => g * genreWeight),
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
			`rank: ${animeDataArray[index].rank}`,
		]);
};

export const extractDuration = (str) => parseInt(str.split(" ")[0]);

export const ratingToInt = (rating) => {
	switch (rating) {
		case "PG-13 - Teens 13 or older":
			return 1;
		case "PG - Children":
			return 2;
		case "R - 17+ (violence & profanity)":
			return 3;
		case "G - All Ages":
			return 4;
		case "R+ - Mild Nudity":
			return 5;
		case "Rx - Hentai":
			return 6;
		default:
			return 0;
	}
};

export const oneHotEncodeGenre = (genreStr, genreList) =>
	genreList.map((genre) => (genreStr.includes(genre) ? 1 : 0));
