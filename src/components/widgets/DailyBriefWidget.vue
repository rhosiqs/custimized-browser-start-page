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
const bulletColors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']

const defaultBriefItems = [
  { title: 'Global Tech & AI Innovations', description: 'Next-generation web standards and browser tools are accelerating productivity workflows worldwide.' },
  { title: 'Market Highlights & Growth Insights', description: 'Major index benchmarks maintain momentum as tech adoption surges across sectors.' },
  { title: 'Daily Focus & Mindfulness', description: 'Break tasks into manageable 25-minute sprints to optimize daily output and mental clarity.' },
  { title: 'Cybersecurity Best Practices', description: 'Ensure multi-factor authentication is enabled for all primary personal and team accounts.' },
  { title: 'Weather & Travel Trends', description: 'Favorable seasonal weather patterns continue across major business hubs.' }
]

async function fetchBrief() {
  loading.value = true
  try {
    await fetchNews('general')
    if (news.articles && news.articles.length > 0) {
      briefItems.value = news.articles.slice(0, 5).map(article => ({
        title: article.title,
        description: article.description?.slice(0, 120) || '',
      }))
    } else {
      briefItems.value = defaultBriefItems
    }
  } catch (e) {
    briefItems.value = defaultBriefItems
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
  font-weight: 600;
  color: #ffffff;
  line-height: 1.35;
}

.brief-summary {
  font-size: 0.78rem;
  color: rgba(255, 255, 255, 0.75);
  margin-top: 3px;
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
