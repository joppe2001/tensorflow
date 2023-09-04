<template>
	<NuxtLayout>
		<div class="container">
			<form @submit.prevent="getRecommended">
				<div class="input-container">
					<label for="anime">Anime</label>
					<input type="text" id="anime" name="anime" v-model="anime" placeholder="Enter your favorite anime" />
				</div>

				<button type="submit" :disabled="loading">
					Get Recommendation
				</button>

				<p v-if="loading">Training model, please wait...</p>

				<div v-if="recommended && !loading" class="recommendation-container">
					<h2>Recommended:</h2>
					<ul>
						<li v-for="show in recommended" :key="show[0]">
							<strong class="title">{{ show[0] }}</strong>
							<span class="score">{{ show[1] }}</span>
							<span class="rank">{{ show[2] }}</span>
						</li>
					</ul>
				</div>

			</form>
		</div>
	</NuxtLayout>
</template>
  
<script setup>
import { getRecommendation } from "./services/tensorFlowOps.js";
import { ref } from 'vue';

const anime = ref("");
const recommended = ref([]);
const loading = ref(false);

const getRecommended = async () => {
	if (loading.value) {
		console.log("Model still training, cannot get recommendations yet.");
		return;
	}
	try {
		const response = await fetch("/hotEncodedAnime.json");
		const animeData = await response.json();

		const recommendation = await getRecommendation(animeData, anime.value);
		console.log("Recommendation", recommendation);
		recommended.value = recommendation;
	} catch (error) {
		console.error("Training failed", error);
	}
};
</script>

<style>
body {
	background-color: #f4f4f4;
	color: #333;
	font-family: Roboto, sans-serif;
}

.container form {
	background-color: #fff;
	border-radius: 8px;
	box-shadow: 0 2px 5px #0000001a;
	display: flex;
	flex-direction: column;
	margin: 50px auto;
	max-width: 400px;
	padding: 20px;
}

.input-container {
	display: flex;
	flex-direction: column;
	gap: 10px;
}

.input-container label {
	font-weight: 500;
	margin-bottom: 10px;
}

.input-container input {
	border: 1px solid #e0e0e0;
	border-radius: 4px;
	font-size: 14px;
	padding: 10px 15px;
	margin-bottom: 15px;
}

button {
	background-color: #007bff;
	border: none;
	border-radius: 4px;
	color: #fff;
	cursor: pointer;
	padding: 10px 15px;
	transition: background-color .3s;
}

button:hover {
	background-color: #0056b3;
}

button:disabled {
	background-color: #e0e0e0;
	cursor: not-allowed;
}

p {
	margin-top: 15px;
}

.recommendation-container ul {
	border-top: 1px solid #e0e0e0;
	list-style-type: none;
	margin-top: 15px;
	padding: 0;
}

.recommendation-container li {
	border-bottom: 1px solid #e0e0e0;
	padding: 10px 0;
}

.recommendation-container li:last-child {
	border-bottom: none;
}

.recommendation-container ul {
    border-top: 1px solid #e0e0e0;
    list-style-type: none;
    margin-top: 15px;
    padding: 0;
}

.recommendation-container li {
    border-bottom: 1px solid #e0e0e0;
    display: flex;
    justify-content: space-between;
    padding: 10px 0;
}

.recommendation-container li:last-child {
    border-bottom: none;
}

.title {
    flex-basis: 60%;
    font-weight: 600;
}

.score, .rank {
    flex-basis: 20%;
    text-align: right;
}

@media (max-width: 600px) {
	.container form {
		margin: 20px auto;
	}
	.recommendation-container h2 {
		font-size: 18px;
	}
}

</style>