import { readFileSync, writeFileSync } from "fs";

const rawData = readFileSync('../public/filteredJson2.json', 'utf8');
const animeList = JSON.parse(rawData);

// Create a Set to capture unique genres across all animes.
let genresSet = new Set();

// Add each anime's genres to the Set.
for (const anime of animeList) {
    for (const genre of anime.genre) {
        genresSet.add(genre);
    }
}

// Convert the Set to an array.
const uniqueGenres = Array.from(genresSet);

const ageRatingMapping = {
  'G - All Ages': 0,
  'PG - Children': 0.2,
  'PG-13 - Teens 13 or older': 0.4,
  'R - 17+ (violence & profanity)': 0.6,
  'R+ - Mild Nudity': 0.8,
  'Rx - Hentai': 1
};

const normalize = (value, min, max) => (value - min) / (max - min);
const episodesMax = Math.max(...animeList.map(anime => anime.episodes));
const episodesMin = Math.min(...animeList.map(anime => anime.episodes));
const rankMax = Math.max(...animeList.map(anime => anime.rank));
const rankMin = Math.min(...animeList.map(anime => anime.rank));
const popularityMax = Math.max(...animeList.map(anime => anime.popularity));
const popularityMin = Math.min(...animeList.map(anime => anime.popularity));

const processedAnimeList = animeList.map(d => {
    // One-hot encode the anime's genres against the uniqueGenres list.
    const hotEncodedGenres = uniqueGenres.map(g => d.genre.includes(g) ? 1 : 0)

    return {
        ...d,
        hotEncodedGenres: hotEncodedGenres,
        normalizedEpisodes: normalize(d.episodes, episodesMin, episodesMax),
        normalizedRank: normalize(d.rank, rankMin, rankMax),
        normalizedPopularity: normalize(d.popularity, popularityMin, popularityMax),
        // Convert age rating using the provided mapping.
        ageRating: ageRatingMapping[d.ageRating] || 0  // defaulting to 0 if not found in mapping
    };
});

writeFileSync('../public/hotEncodedAnime.json', JSON.stringify(processedAnimeList, null, 2));
