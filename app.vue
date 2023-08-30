<template>
  <NuxtLayout>
    <form action="submit" @submit.prevent="getRecommended">
      <label for="anime">Anime</label>
      <input type="text" id="anime" name="anime" v-model="anime" />
      <button type="submit" :disabled="loading">Get Recommendation</button>
      <p v-if="loading">Training model, please wait...</p>
      <p v-if="recommended && !loading">Recommended: {{ recommended }}</p>
    </form>
  </NuxtLayout>
</template>

<script setup>
import { onMounted, watch, ref } from 'vue';
import { trainModel, getRecommendation } from './services/tensorFlowOps.js'

const anime = ref('');
const recommended = ref('');
const loading = ref(false);

const ignoreWords = ["of", "the", "and", "in", "on", "at", "or", "by", "no", "wa"];

watch(anime, (newAnime) => {
  const words = newAnime.split(" ");
  const capitalizedWords = words.map((word, index) => {
    if (index === 0 || !ignoreWords.includes(word.toLowerCase())) {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    } else {
      return word.toLowerCase();
    }
  });
  anime.value = capitalizedWords.join(" ");
}, { immediate: true });

const getRecommended = async () => {
  if (loading.value) {
    console.log("Model still training, cannot get recommendations yet.");
    return;
  }
  try {
    // Load anime data
    const response = await fetch('/animeWithGenres.json');
    const animeData = await response.json();

    // Get a recommendation
    const recommendation = await getRecommendation(animeData, anime.value);
    console.log("Recommendation", recommendation);
    recommended.value = recommendation;
  } catch (error) {
    console.error("Training failed", error);
  }
};
</script>
