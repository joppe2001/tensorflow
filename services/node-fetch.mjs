import fetch from 'node-fetch';
import { writeFileSync } from 'fs';
import cliProgress from 'cli-progress';
import { log } from 'console';
let animes = 0

const ageRatingMapping = {
  'G - All Ages': 0,
  'PG - Children': 0.2,
  'PG-13 - Teens 13 or older': 0.4,
  'R - 17+ (violence & profanity)': 0.6,
  'R+ - Mild Nudity': 0.8,
  'Rx - Hentai': 1
};

let uniqueGenres = [];
let uniquethemes = [];
let uniqueDemographics = [];

const minEpisodes = 0;
const maxEpisodes = 2000;
const minRank = 0;
const maxRank = 80000;
const minPopularity = 0;
const maxPopularity = 60000;

const hotEncodeAnime = (anime) => {
  return anime.map((a) => {
    const hotArray = Array(uniqueGenres.length).fill(0);
    const hotThemesArray = Array(uniquethemes.length).fill(0);
    const hotDemographicsArray = Array(uniqueDemographics.length).fill(0);
    a.genres.forEach((genre) => {
      const genreIndex = uniqueGenres.findIndex((ug) => ug === genre.mal_id);
      if (genreIndex !== -1) hotArray[genreIndex] = 1;
    });
    a.themes.forEach((theme) => {
      const themeIndex = uniquethemes.findIndex((ut) => ut === theme.mal_id);
      if (themeIndex !== -1) hotThemesArray[themeIndex] = 1;
    });
    a.demographics.forEach((demographic) => {
      const demographicIndex = uniqueDemographics.findIndex(
        (ud) => ud === demographic.mal_id
      );
      if (demographicIndex !== -1) hotDemographicsArray[demographicIndex] = 1;
    });

    const normalizedEpisodes =
      Math.floor(
        ((a.normalizedEpisodes - minEpisodes) / (maxEpisodes - minEpisodes)) *
          10
      ) / 10;
    const normalizedRank =
      Math.floor(
        (1 - (a.normalizedRank - minRank) / (maxRank - minRank)) * 10
      ) / 10;

    const normalizedPopularity =
      Math.floor(
        ((a.normalizedPopularity - minPopularity) /
          (maxPopularity - minPopularity)) *
          10
      ) / 10;

    return {
      title: a.title_english,
      hotEncodedGenres: hotArray,
      ageRating: ageRatingMapping[a.ageRating] || 0.5,
      score: Math.floor(a.score),
      normalizedEpisodes: normalizedEpisodes,
      normalizedRank: normalizedRank,
      normalizedPopularity: normalizedPopularity,
      hotEncodedThemes: hotThemesArray,
      hotEncodedDemographics: hotDemographicsArray
    };
  });
};

const getAnime = async (startId, endId) => {
  let anime = [];

  try {
    const existingData = JSON.parse(
      readFileSync('./hotEncodedAnime.json', 'utf8')
    );
    anime = existingData;
  } catch (error) {
    console.log('No existing data found, starting fresh.');
  }

  const progressBar = new cliProgress.SingleBar(
    {},
    cliProgress.Presets.shades_classic
  );
  progressBar.start(endId - startId + 1, 0);

  for (let i = startId; i <= endId; i++) {
    try {
      const response = await fetch(`https://api.jikan.moe/v4/anime/${i}`);
      if (response.status === 200) {
        const data = await response.json();
        const {
          title_english,
          genres,
          rating,
          type,
          aired,
          episodes,
          duration,
          rank,
          popularity,
          themes,
          demographics
        } = data.data || {};

        const year = aired?.prop?.from?.year;
        const durationInMin = parseInt(duration?.match(/\d+/)?.[0]);
        const yearIsValid = year !== undefined && year !== null && year >= 2000;

        const normalizedEpisodes = episodes * durationInMin;
        const normalizedRank = rank;
        const normalizedPopularity = popularity;

        if (
          title_english &&
          genres &&
          rating &&
          type !== 'Music' &&
          type !== 'Manga' &&
          yearIsValid &&
          normalizedEpisodes &&
          normalizedRank &&
          normalizedPopularity
        ) {
          anime.push({
            title_english,
            genres,
            ageRating: ageRatingMapping[rating] || 0.5,
            score: Math.floor(data.data.score),
            normalizedEpisodes,
            normalizedRank,
            normalizedPopularity,
            themes,
            demographics
          });

          genres.forEach((genre) => {
            if (!uniqueGenres.includes(genre.mal_id)) {
              uniqueGenres.push(genre.mal_id);
            }
          });
          themes.forEach((theme) => {
            if (!uniquethemes.includes(theme.mal_id)) {
              uniquethemes.push(theme.mal_id);
            }
          });
          demographics.forEach((demographic) => {
            if (!uniqueDemographics.includes(demographic.mal_id)) {
              uniqueDemographics.push(demographic.mal_id);
            }
          });


          const hotEncodedAnime = hotEncodeAnime(anime);
          writeFileSync(
            './hotEncodedAnime.json',
            JSON.stringify(hotEncodedAnime, null, 2)
          );
          animes++
          log(`Added ${title_english} to the database. Total animes: ${animes}`);
        }
      }
      progressBar.increment();
      await new Promise((resolve) => setTimeout(resolve, 1010)); // Rate-limiting
    } catch (error) {
      console.error(`Failed at ID ${i}: ${error}`);
    }
  }

  progressBar.stop();
  console.log('Data processing complete. Check out your hotEncodedAnime.json!');
};

getAnime(50000, 80000);
