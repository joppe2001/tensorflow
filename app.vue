<template>
	<NuxtLayout>
		<div class="container">
			<form @submit.prevent="getRecommended">
				<div class="input-container">
					<label for="anime">Anime</label>
					<input type="text" id="anime" name="anime" v-model="anime" placeholder="Enter your favorite anime"
						@keydown="navigateSuggestions" />
				</div>
				<div class="suggestions" v-if="suggestions.length" ref="suggestionsContainer">
					<ul>
						<li v-for="(suggestedAnime, index) in suggestions" :key="index"
							:class="{ 'highlighted': index === highlightedIndex }"
							@click="selectSuggestion(suggestedAnime, index)">
							{{ suggestedAnime }}
						</li>
					</ul>
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
const suggestions = ref([]);
const highlightedIndex = ref(-1); // Track currently highlighted suggestion

const suggestionsContainer = ref(null);

const navigateSuggestions = (event) => {
	switch (event.key) {
		case "ArrowDown":
			if (highlightedIndex.value < suggestions.value.length - 1) {
				highlightedIndex.value++;
			}
			break;
		case "ArrowUp":
			if (highlightedIndex.value > 0) {
				highlightedIndex.value--;
			}
			break;
		case "Enter":
			if (highlightedIndex.value !== -1) {
				selectSuggestion(suggestions.value[highlightedIndex.value]);
			}
			break;
		default:
			break;
	}

	// After updating the highlightedIndex, scroll to the item if it's out of view
	scrollHighlightedIntoView();
};

const scrollHighlightedIntoView = () => {
	const container = suggestionsContainer.value;
	if (!container) return;

	const items = container.querySelectorAll('li');
	const currentItem = items[highlightedIndex.value];
	if (!currentItem) return;

	const containerTop = container.scrollTop;
	const containerBottom = containerTop + container.clientHeight;
	const itemTop = currentItem.offsetTop;
	const itemBottom = itemTop + currentItem.clientHeight;

	if (itemTop < containerTop) {
		// Item is above the view, scroll up
		container.scrollTop = itemTop;
	} else if (itemBottom > containerBottom) {
		// Item is below the view, scroll down
		container.scrollTop = itemBottom - container.clientHeight;
	}
};

const selectSuggestion = (suggestedAnime, index) => {
	anime.value = suggestedAnime;
	suggestions.value = []; // clear suggestions after selecting
	highlightedIndex.value = -1; // reset highlighted index
};

watch(anime, async (newVal) => {
	// set first letter to uppercase
	anime.value = newVal.charAt(0).toUpperCase() + newVal.slice(1);
	try {
		if (newVal) {
			const response = await fetch("/hotEncodedAnime.json");
			const animeData = await response.json();

			// Filter animeData to get titles that include the newVal
			suggestions.value = animeData.filter(animeObj => animeObj.title.includes(newVal)).map(animeObj => animeObj.title).slice(0, 10); // display top 5 matches
		} else {
			suggestions.value = []; // clear suggestions if input is empty
		}
	} catch (error) {
		console.error("Error fetching and processing data:", error);
	}
});



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
	position: relative;
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

.score,
.rank {
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

.suggestions {
	border: 1px solid #e0e0e0;
	border-radius: 4px;
	box-shadow: 0 2px 5px #0000001a;
	max-height: 200px;
	overflow-y: auto;
	position: absolute;
	top: 100px;
	right: 0;
	width: 100%;
}

.suggestions ul {
	list-style-type: none;
	margin: 0;
	padding: 0;
}

.suggestions li {
	background-color: #fff;
	cursor: pointer;
	padding: 10px;
}

.suggestions li:hover {
	background-color: #f0f0f0;
}

.suggestions li.highlighted {
	background-color: #e0e0e0;
}
</style>