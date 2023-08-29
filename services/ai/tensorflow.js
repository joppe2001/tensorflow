import { trainModel, getRecommendation } from "../tensorFlowOps";

// Fetch your anime data
const fetchAnimeData = async () => {
  const response = await fetch('http://localhost:3000/animeWithGenres.json');
  return await response.json();
};

// Execute
const execute = async () => {
  const animeData = await fetchAnimeData();
  await trainModel(animeData);
  await getRecommendation(animeData);
};

execute().catch(console.error);
