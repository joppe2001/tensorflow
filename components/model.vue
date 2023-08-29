<template>
    <div>
        <button style="height: 100px;" @click="trainModel()">train model</button>
    </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { trainModel } from '../services/ai/tensorflow';

const trainModels = async () => {
    await trainModel();
}
</script>