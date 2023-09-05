const fs = require('fs');

const rawData = fs.readFileSync("../public/csvjson.json", "utf8");
const animeList = JSON.parse(rawData);

const filteredAnimeList = animeList.filter(
  (anime) => anime.episodes !== 0 && anime.genre !== "" && anime.duration !== "Uknown"
);

fs.writeFileSync("./filteredJson.json", JSON.stringify(filteredAnimeList, null, 2));
