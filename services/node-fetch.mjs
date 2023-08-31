import fetch from 'node-fetch';
import { writeFileSync } from 'fs';
import cliProgress from 'cli-progress';

const ageRatingMapping = {
  'G - All Ages': 0,
  'PG - Children': 0.2,
  'PG-13 - Teens 13 or older': 0.4,
  'R - 17+ (violence & profanity)': 0.6,
  'R+ - Mild Nudity': 0.8,
  'Rx - Hentai': 1
};

let uniqueGenres = [];

const hotEncodeAnime = (anime) => {
  return anime.map((a) => {
    const hotArray = Array(uniqueGenres.length).fill(0);
    a.genres.forEach((genre) => {
      const genreIndex = uniqueGenres.findIndex((ug) => ug === genre.mal_id);
      if (genreIndex !== -1) hotArray[genreIndex] = 1;
    });
    return {
      title: a.title,
      hotEncodedGenres: hotArray,
      ageRating: ageRatingMapping[a.ageRating] || 0.5, // Default to average if undefined
      score: Math.floor(a.score)
    };
  });
};

const getAnime = async (startId, endId) => {
  let anime = [];
  
  // Read existing data if it exists
  try {
    const existingData = JSON.parse(fs.readFileSync('./hotEncodedAnime.json', 'utf8'));
    anime = existingData;
  } catch (error) {
    console.log('No existing data found, starting fresh.');
  }

  const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  progressBar.start(endId - startId + 1, 0);

  for (let i = startId; i <= endId; i++) {
    try {
      const response = await fetch(`https://api.jikan.moe/v4/anime/${i}`);
      if (response.status === 200) {
        const data = await response.json();
        if (data.data && data.data.title && data.data.genres && data.data.rating && (data.data.type !== 'manga') && (data.data.aired.prop.from.year >= 2000 && !undefined && !null)) {
          anime.push({
            title: data.data.title,
            genres: data.data.genres,
            ageRating: data.data.rating,
            score: data.data.score
          });

          data.data.genres.forEach((genre) => {
            if (!uniqueGenres.includes(genre.mal_id)) {
              uniqueGenres.push(genre.mal_id);
            }
          });
          
          // Save after every anime
          const hotEncodedAnime = hotEncodeAnime(anime);
          writeFileSync('./hotEncodedAnime.json', JSON.stringify(hotEncodedAnime, null, 2));
        }
      }
      progressBar.increment();
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Rate-limiting
    } catch (error) {
      console.error(`Failed at ID ${i}: ${error}`);
    }
  }

  progressBar.stop();
  console.log('Data processing complete. Check out your hotEncodedAnime.json!');
};

getAnime(2318, 40000);  // Change the range as per your requirement
