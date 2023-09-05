const fs = require('fs');

const rawData = fs.readFileSync("../public/csvjson.json", "utf8");
const animeList = JSON.parse(rawData);

const filteredAnimeList = animeList.filter(d => {
    const episodes = d.episodes || 0;
    const duration = d.duration || 'Unknown';
    const status = d.status || '';
    const airing = d.airing || '';
    const rating = d.rating || '';
    const rank = d.rank || 0;
    const popularity = d.popularity || 0;
    const genre = d.genre || ''; 

    // Check if the values are not in the default state
    return episodes !== 0 && 
           duration !== 'Unknown' && 
           status !== '' && 
           airing !== '' && 
           rating !== '' && 
           rank !== 0 && 
           popularity !== 0 && 
           genre !== '';
});

fs.writeFileSync("./filteredJson2.json", JSON.stringify(filteredAnimeList, null, 2));
