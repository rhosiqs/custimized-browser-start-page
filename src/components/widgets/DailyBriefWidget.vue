<template>
  <div class="glass-card widget-container daily-brief-widget">
    <div class="widget-title">
      <v-icon>mdi-text-box-outline</v-icon>
      Daily Brief
      <v-spacer />
      <v-btn
        icon
        variant="text"
        size="x-small"
        @click="fetchBrief"
        :loading="loading"
      >
        <v-icon size="16">mdi-refresh</v-icon>
      </v-btn>
    </div>

    <div v-if="loading" class="brief-loading">
      <div v-for="i in 3" :key="i" class="brief-skeleton shimmer"></div>
    </div>

    <div v-else-if="briefItems.length" class="brief-list">
      <div
        v-for="(item, idx) in briefItems"
        :key="idx"
        class="brief-item"
      >
        <div class="brief-bullet" :style="{ backgroundColor: bulletColors[idx % bulletColors.length] }"></div>
        <div class="brief-content">
          <div class="brief-headline">{{ item.title }}</div>
          <div class="brief-summary" v-if="item.description">{{ item.description }}</div>
        </div>
      </div>
    </div>

    <div v-else class="brief-empty">
      <v-icon size="32" color="rgba(255,255,255,0.15)">mdi-text-box-check-outline</v-icon>
      <p>Configure News API key in Settings to see your daily brief</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useNews } from '../../composables/useNews.js'

const { news, fetchNews } = useNews()

const loading = ref(false)
const briefItems = ref([])

const bulletColors = ['#6C63FF', '#00D9FF', '#FF6B9D', '#4CAF50', '#FFC107']

async function fetchBrief() {
  loading.value = true
  try {
    await fetchNews('general')
    // Take the top articles and condense them
    briefItems.value = news.articles.slice(0, 5).map(article => ({
      title: article.title,
      description: article.description?.slice(0, 120) || '',
    }))
  } catch (e) {
    briefItems.value = []
  } finally {
    loading.value = false
  }
}

onMounted(fetchBrief)
</script>

<style scoped>
.daily-brief-widget {
  max-height: 400px;
  display: flex;
  flex-direction: column;
}

.brief-loading {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.brief-skeleton {
  height: 48px;
  border-radius: 10px;
}

.brief-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  overflow-y: auto;
  flex: 1;
}

.brief-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.brief-bullet {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-top: 7px;
  flex-shrink: 0;
}

.brief-content {
  flex: 1;
}

.brief-headline {
  font-size: 0.88rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.35;
}

.brief-summary {
  font-size: 0.78rem;
  color: rgba(255, 255, 255, 0.45);
  margin-top: 2px;
  line-height: 1.4;
}

.brief-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px 0;
  text-align: center;
}

.brief-empty p {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.3);
  max-width: 200px;
}
</style>
