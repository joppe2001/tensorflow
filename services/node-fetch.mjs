import fetch from 'node-fetch';
import { writeFileSync } from 'fs';

const baseUrl = 'https://api.jikan.moe/v4/';

const getAnime = async (startId, endId) => {
  let anime = [];
  let allGenres = [];
  let uniqueGenres = [];
  let animeWithHotEncodedGenres = [];

  for (let i = startId; i <= endId; i++) {
    try {
      const response = await fetch(`${baseUrl}anime/${i}`);
      await new Promise((resolve) => setTimeout(resolve, 1010));

      if (response.status === 200) {
        const data = await response.json();
        if (data && data.data && data.data.genres) {
          const animeData = {
            title: data.data.title,
            genres: data.data.genres,
            ageRating: data.data.rating // assuming the API provides it like this
          };
          anime.push(animeData);
          allGenres.push(...animeData.genres);
        }
      }
    } catch (error) {
      console.error(`Failed to fetch data for anime ID ${i}: ${error}`);
    }
  }

  uniqueGenres = allGenres.filter(
    (value, index, self) =>
      self.findIndex((t) => JSON.stringify(t) === JSON.stringify(value)) ===
      index
  );

  // Mapping for age ratings to numerical values
  const ageRatingMapping = {
    'G - All Ages': 0,
    'PG - Children': 1,
    'PG-13 - Teens 13 or older': 2,
    'R - 17+ (violence & profanity)': 3,
    'R+ - Mild Nudity': 4,
    'Rx - Hentai': 5
  };

  animeWithHotEncodedGenres = anime.map((a) => {
    let hotArray = new Array(uniqueGenres.length).fill(0);
    a.genres.forEach((genre) => {
      const genreIndex = uniqueGenres.findIndex(
        (ug) => ug.mal_id === genre.mal_id
      );
      if (genreIndex !== -1) {
        hotArray[genreIndex] = 1;
      }
    });
    const numericalAgeRating = ageRatingMapping[a.ageRating] || -1; // default to -1 if unknown
    return {
      title: a.title,
      hotEncodedGenres: hotArray,
      ageRating: numericalAgeRating // replace with numerical value
    };
  });

  // writeFileSync('anime.json', JSON.stringify(uniqueGenres, null, 2));
  writeFileSync(
    'animeWithGenres.json',
    JSON.stringify(animeWithHotEncodedGenres, null, 2)
  );
  console.log(
    'Anime, their hot-encoded genres, and age ratings have been written to animeWithGenres.json'
  );
};

getAnime(1, 1000);
