import fetch from "node-fetch";
import { readFileSync, writeFileSync } from "fs";
import cliProgress from "cli-progress";

const baseUrl = "https://api.jikan.moe/v4/";

const hotEncodeAnime = (anime, uniqueGenres, ageRatingMapping) => {
  return anime.map((a) => {
    let hotArray = new Array(uniqueGenres.length).fill(0);
    a.genres.forEach((genre) => {
      const genreIndex = uniqueGenres.findIndex(
        (ug) => ug.mal_id === genre.mal_id
      );
      if (genreIndex !== -1) {
        hotArray[genreIndex] = 1;
      }
    });
    const numericalAgeRating = ageRatingMapping[a.ageRating] || -1;
    return {
      title: a.title,
      hotEncodedGenres: hotArray,
      ageRating: numericalAgeRating,
    };
  });
};

const unhotEncodeAnime = (hotEncodedAnime, uniqueGenres, ageRatingMapping) => {
  return hotEncodedAnime.map((a) => {
    let genres = [];
    a.hotEncodedGenres.forEach((value, index) => {
      if (value === 1) {
        genres.push(uniqueGenres[index]);
      }
    });
    const ageRating = Object.keys(ageRatingMapping).find(
      (key) => ageRatingMapping[key] === a.ageRating
    ) || 'Unknown';
    return {
      title: a.title,
      genres,
      ageRating
    };
  });
};

const getAnime = async (startId, endId) => {
  let anime = [];
  let allGenres = [];
  let uniqueGenres = [];
  const ageRatingMapping = {
    "G - All Ages": 0,
    "PG - Children": 1,
    "PG-13 - Teens 13 or older": 2,
    "R - 17+ (violence & profanity)": 3,
    "R+ - Mild Nudity": 4,
    "Rx - Hentai": 5,
  };

  const progressBar = new cliProgress.SingleBar(
    {},
    cliProgress.Presets.shades_classic
  );
  progressBar.start(endId - startId + 1, 0);

  for (let i = startId; i <= endId; i++) {
    try {
      const response = await fetch(`${baseUrl}anime/${i}`);
      if (response.status === 200) {
        const data = await response.json();
        if (data.data && data.data.title && data.data.genres && data.data.rating) {
          const animeData = {
            title: data.data.title,
            genres: data.data.genres,
            ageRating: data.data.rating,
          };
          anime.push(animeData);
          allGenres.push(...animeData.genres);
        }

        uniqueGenres = allGenres.filter(
          (value, index, self) =>
            self.findIndex(
              (t) => JSON.stringify(t) === JSON.stringify(value)
            ) === index
        );

        const hotEncodedAnime = hotEncodeAnime(anime, uniqueGenres, ageRatingMapping);
        writeFileSync(
          "partial_hotencoded_anime.json",
          JSON.stringify(hotEncodedAnime, null, 2)
        );
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
      progressBar.increment();
    } catch (error) {
      console.error(`Failed to fetch data for anime ID ${i}: ${error}`);
    }
  }

  progressBar.stop();

  const hotEncodedAnime = hotEncodeAnime(anime, uniqueGenres, ageRatingMapping);
  writeFileSync(
    "./animeWithGenres.json",
    JSON.stringify(hotEncodedAnime, null, 2)
  );

  const unhotEncodedAnime = unhotEncodeAnime(hotEncodedAnime, uniqueGenres, ageRatingMapping);
  writeFileSync(
    "../public/animeWithUnhotEncodedGenres.json",
    JSON.stringify(unhotEncodedAnime, null, 2)
  );

  console.log(
    "Anime, their hot-encoded genres, and age ratings have been written to animeWithGenres.json"
  );
};

getAnime(31681, 32281);
