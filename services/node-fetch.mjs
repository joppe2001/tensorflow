import fetch from 'node-fetch';
import { writeFileSync } from 'fs';
import cliProgress from 'cli-progress';

const baseUrl = 'https://api.jikan.moe/v4/';

const hotEncodeAnime = (anime, uniqueGenres, ageRatingMapping) => {
  return anime.map(a => {
    let hotArray = new Array(uniqueGenres.length).fill(0);
    a.genres.forEach(genre => {
      const genreIndex = uniqueGenres.findIndex(ug => ug.mal_id === genre.mal_id);
      if (genreIndex !== -1) {
        hotArray[genreIndex] = 1;
      }
    });
    const numericalAgeRating = ageRatingMapping[a.ageRating] || -1;
    return {
      title: a.title,
      hotEncodedGenres: hotArray,
      ageRating: numericalAgeRating,
      episodeCount: a.episodeCount,
    };
  });
};

const getAnime = async (startId, endId) => {
  let anime = [];
  let allGenres = [];
  let uniqueGenres = [];

  const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  progressBar.start(endId - startId + 1, 0);

  let requestCount = 0;

  for (let i = startId; i <= endId; i++) {
    try {
      const response = await fetch(`${baseUrl}anime/${i}`);
      const fullData = await fetch(`${baseUrl}anime/${i}/full`) // Fetching extended attributes
      requestCount++;

      if (response.status === 200) {
        const data = await response.json();
        const fulldata = await fullData.json();
        if (data.data && data.data.title && data.data.genres && data.data.rating) {
          const episodeCount = fulldata.data && fulldata.data.episodes ? fulldata.data.episodes : 0;
        
          const animeData = {
            title: data.data.title,
            genres: data.data.genres,
            ageRating: data.data.rating,
            episodeCount,  // Using the episodeCount variable
          };
          anime.push(animeData);
          allGenres.push(...animeData.genres);
        }
      
        uniqueGenres = allGenres.filter((value, index, self) =>
          self.findIndex(t => JSON.stringify(t) === JSON.stringify(value)) === index
        );

        const ageRatingMapping = {
          'G - All Ages': 0,
          'PG - Children': 1,
          'PG-13 - Teens 13 or older': 2,
          'R - 17+ (violence & profanity)': 3,
          'R+ - Mild Nudity': 4,
          'Rx - Hentai': 5
        };

        const partialHotEncodedAnime = hotEncodeAnime(anime, uniqueGenres, ageRatingMapping);
        writeFileSync('partial_hotencoded_anime.json', JSON.stringify(partialHotEncodedAnime, null, 2));
      }

      if (requestCount % 3 === 0) {
        await new Promise(resolve => setTimeout(resolve, 1010));
      }

      if (requestCount % 60 === 0) {
        await new Promise(resolve => setTimeout(resolve, 60000 - (3 * 1010)));
      }

      progressBar.increment();
    } catch (error) {
      console.error(`Failed to fetch data for anime ID ${i}: ${error}`);
    }
  }

  progressBar.stop();

  const ageRatingMapping = {
    'G - All Ages': 0,
    'PG - Children': 1,
    'PG-13 - Teens 13 or older': 2,
    'R - 17+ (violence & profanity)': 3,
    'R+ - Mild Nudity': 4,
    'Rx - Hentai': 5
  };

  const animeWithHotEncodedGenres = hotEncodeAnime(anime, uniqueGenres, ageRatingMapping);
  writeFileSync('animeWithGenres.json', JSON.stringify(animeWithHotEncodedGenres, null, 2));

  console.log('Anime, their hot-encoded genres, and age ratings have been written to animeWithGenres.json');
};

getAnime(1, 70);
