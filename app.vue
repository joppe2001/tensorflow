<template>
  <NuxtLayout>
    <form action="submit" @submit.prevent="getRecommended">
      <label for="anime">Anime</label>
      <input type="text" id="anime" name="anime" v-model="anime" />
      <button type="submit">Get Recommendation</button>
      <p v-if="recommended">Recommended: {{ recommended }}</p>
    </form>
  </NuxtLayout>
</template>

<script setup>
import { onMounted } from 'vue';
import { trainModel, getRecommendation } from '../services/tensorflowOps';

const anime = ref('');
const recommended = ref('');

onMounted(async () => {
  console.log("Component Mounted"); 
  try {
    // Load anime data
    const response = await fetch('/animeWithGenres.json');
    const animeData = await response.json();

    // Train the model
    await trainModel(animeData);
    console.log("Model trained");
  } catch (error) {
    console.error("Training failed", error);
  }
});

const getRecommended = async () => {
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
}


</script>
