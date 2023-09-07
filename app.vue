<template>
	<NuxtLayout>
		<div class="container">
			<form @submit.prevent="getRecommended">
				<div class="input-container">
					<label for="anime">Anime recommender</label>
					<input type="text" id="anime" name="anime" v-model="anime" placeholder="Enter your favorite anime"
						@keydown="navigateSuggestions" />
				</div>
				<div v-if="suggestions.length" class="suggestions" ref="suggestionsContainer">
					<ul>
						<li v-for="(suggestedAnime, index) in suggestions" :key="index"
							:class="{ 'highlighted': index === highlightedIndex }"
							@click="selectSuggestion(suggestedAnime)">
							{{ suggestedAnime }}
						</li>
					</ul>
				</div>
				<button type="submit" :disabled="loading">Get Recommendation</button>
				<p v-if="loading">Training model, please wait...</p>
				<div v-if="recommended && !loading" class="recommendation-container">
					<h2>Recommended:</h2>
					<ul v-for="(show, index) in recommended" :key="show[index]">
						<li class="recommendation-container__small">
							<h2 class="title">{{ show[0] }}</h2>
							<div class="score-rank">
								<p>{{ show[1] }}</p>
								<p>{{ show[2] }}</p>
							</div>
						</li>
					</ul>
				</div>
			</form>
		</div>
	</NuxtLayout>
</template>
  
<script setup>
import { getRecommendation } from "./services/tensorFlowOps.js";

const anime = ref("");
const recommended = ref([]);
const loading = ref(false);
const suggestions = ref([]);
const highlightedIndex = ref(-1);
const suggestionsContainer = ref(null);

watch(anime, fetchAndSetSuggestions);

async function fetchAnimeData() {
	const response = await fetch("/hotEncodedAnime.json");
	return response.json();
}

async function fetchAndSetSuggestions(newVal) {
	const normalizedNewVal = newVal.charAt(0).toUpperCase() + newVal.slice(1);
	anime.value = normalizedNewVal;

	try {
		const animeData = await fetchAnimeData();
		const filteredAnime = animeData.filter(animeObj => {
			const titleToCheck = animeObj.title_english !== "" ? animeObj.title_english : animeObj.title;
			return typeof titleToCheck === 'string' &&
				(titleToCheck.toLowerCase().includes(normalizedNewVal.toLowerCase()) || titleToCheck.includes(newVal));
		});

		// Sort to prioritize exact matches
		filteredAnime.sort((a, b) => {
			const titleA = a.title_english || a.title;
			const titleB = b.title_english || b.title;

			if (titleA.toLowerCase() === normalizedNewVal.toLowerCase()) return -1;
			if (titleB.toLowerCase() === normalizedNewVal.toLowerCase()) return 1;

			return 0;
		});

		if (normalizedNewVal) {
			suggestions.value = filteredAnime
				.slice(0, 10)
				.map(animeObj => animeObj.title_english || animeObj.title)
				.filter(Boolean);  // This will filter out any empty string titles.
		} else {
			suggestions.value = [];
		}
	} catch (error) {
		console.error("Error fetching and processing data:", error);
	}
}


const navigateSuggestions = (event) => {
	switch (event.key) {
		case "ArrowDown":
			highlightedIndex.value = Math.min(highlightedIndex.value + 1, suggestions.value.length - 1);
			break;
		case "ArrowUp":
			highlightedIndex.value = Math.max(highlightedIndex.value - 1, 0);
			break;
		case "Enter":
			if (highlightedIndex.value !== -1) {
				selectSuggestion(suggestions.value[highlightedIndex.value]);
			}
			break;
	}
	scrollHighlightedIntoView();
};

const selectSuggestion = (suggestedAnime) => {
	anime.value = suggestedAnime;
	suggestions.value = [];
	highlightedIndex.value = -1;
};

async function getRecommended() {
	if (loading.value) {
		console.log("Model still training, cannot get recommendations yet.");
		return;
	}
	try {
		const animeData = await fetchAnimeData();
		const recommendation = await getRecommendation(animeData, anime.value);
		recommended.value = recommendation;
	} catch (error) {
		console.error("Training failed", error);
	}
}

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
		container.scrollTop = itemTop;
	} else if (itemBottom > containerBottom) {
		container.scrollTop = itemBottom - container.clientHeight;
	}
};

const closeSuggestions = () => {
	suggestions.value = [];
};

function clickedInsideSuggestions(event) {
	let targetElement = event.target;
	while (targetElement != null) {
		if (targetElement === suggestionsContainer.value) return true;
		targetElement = targetElement.parentElement;
	}
	return false;
}

function handleDocumentClick(event) {
	if (!clickedInsideSuggestions(event)) {
		closeSuggestions();
	}
}

onMounted(() => {
	document.addEventListener('click', handleDocumentClick);
});

onBeforeUnmount(() => {
	document.removeEventListener('click', handleDocumentClick);
});

</script>


<style lang="scss">
body {
	background-color: #f4f4f4;
	color: #333;
	font-family: Roboto, sans-serif;

	.container {
		form {
			background-color: #fff;
			border-radius: 8px;
			box-shadow: 0 2px 5px #0000001a;
			display: flex;
			flex-direction: column;
			margin: 50px auto;
			max-width: 500px;
			padding: 20px;
			position: relative;

			.input-container {
				display: flex;
				flex-direction: column;
				gap: 10px;

				label {
					font-weight: 500;
					margin-bottom: 10px;
				}

				input {
					border: 0.5px solid #e0e0e0;
					border-radius: 4px;
					font-size: 14px;
					padding: 10px 15px;
					margin-bottom: 15px;
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

				ul {
					list-style-type: none;
					margin: 0;
					padding: 0;

					li {
						background-color: #fff;
						cursor: pointer;
						padding: 10px;

						&hover {
							background-color: #f0f0f0;
						}

						&.highlighted {
							background-color: #e0e0e0;
						}
					}
				}
			}

			button {
				background-color: #007bff;
				border: none;
				border-radius: 4px;
				color: #fff;
				cursor: pointer;
				padding: 10px 15px;
				transition: background-color .3s;

				&:hover {
					background-color: red;
				}

				&:disabled {
					background-color: #e0e0e0;
					cursor: not-allowed;
				}
			}

			.recommendation-container {

				p,
				ul {
					margin-top: 15px;
				}

				ul {
					border: 1px solid #e0e0e0;
					list-style-type: none;
					padding: 0 25px;
					border-radius: 10px;

					li {
						border-bottom: 1px solid #e0e0e0;
						display: flex;
						justify-content: space-between;
						align-items: center;
						padding: 10px 0;

						.title {
							flex-basis: 60%;
							font-size: 1.2rem;
						}

						&:last-child {
							border-bottom: none;
						}

						.score-rank {
							text-align: center;
							text-decoration: underline;
						}
					}
				}
			}
		}
	}
}


@media (max-width: 600px) {
	body {
		font-size: smaller;
	}

	.container form {
		margin: 20px 10px;
	}

	.recommendation-container {
		h2 {
			font-size: 18px;
		}

		ul {
			padding: 15px;
		}

		&__small {
			display: flex;
			justify-content: center;
			text-align: center;
			flex-direction: column;

			.score-rank {
				font-size: 1.0rem;
			}
		}
	}


}
</style>
  