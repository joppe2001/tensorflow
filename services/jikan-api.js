const baseUrl = 'https://api.jikan.moe/v4/';

export const getAnime = async (id) => {
  const response = await fetch(`${baseUrl}anime/${id}`);
  const data = await response.json();
  return data;
};


export const getAnimeCharacters = async (id) => {
  const response = await fetch(`${baseUrl}anime/${id}/characters`);
  const data = await response.json();
  return data;
};

export const getAnimeEpisodes = async (id) => {
  const response = await fetch(`${baseUrl}anime/${id}/episodes`);
  const data = await response.json();
  return data;
};

export const getAnimeNews = async (id) => {
  const response = await fetch(`${baseUrl}anime/${id}/news`);
  const data = await response.json();
  return data;
};

export const getAnimePictures = async (id) => {
  const response = await fetch(`${baseUrl}anime/${id}/pictures`);
  const data = await response.json();
  return data;
};

export const getAnimeVideos = async (id) => {
  const response = await fetch(`${baseUrl}anime/${id}/videos`);
  const data = await response.json();
  return data;
};
export const getAnimeRecommendations = async (id) => {
  const response = await fetch(`${baseUrl}anime/${id}/recommendations`);
  const data = await response.json();
  return data;
};
