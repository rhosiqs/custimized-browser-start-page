<template>
  <div class="glass-card widget-container news-widget">
    <div class="widget-title">
      <v-icon>mdi-newspaper-variant-outline</v-icon>
      News
    </div>

    <!-- Category Chips -->
    <div class="news-categories">
      <v-chip
        v-for="cat in categories"
        :key="cat.value"
        :variant="news.category === cat.value ? 'flat' : 'outlined'"
        :color="news.category === cat.value ? 'primary' : undefined"
        size="small"
        class="category-chip"
        @click="changeCategory(cat.value)"
      >
        {{ cat.label }}
      </v-chip>
    </div>

    <!-- Loading -->
    <div v-if="news.loading" class="news-loading">
      <div v-for="i in 4" :key="i" class="news-skeleton shimmer"></div>
    </div>

    <!-- Error -->
    <div v-else-if="news.error" class="news-error">
      <v-icon color="warning" size="24">mdi-alert-circle-outline</v-icon>
      <p>{{ news.error }}</p>
      <v-btn
        v-if="!settings.newsApiKey"
        size="small"
        variant="tonal"
        color="primary"
        @click="$emit('open-settings')"
      >
        Set API Key
      </v-btn>
    </div>

    <!-- Articles -->
    <div v-else class="news-list">
      <a
        v-for="(article, idx) in news.articles.slice(0, 6)"
        :key="idx"
        :href="article.url"
        target="_blank"
        rel="noopener noreferrer"
        class="news-item"
      >
        <div class="news-item-content">
          <div class="news-item-title">{{ article.title }}</div>
          <div class="news-item-meta">
            <span class="news-source">{{ typeof article.source === 'string' ? article.source : (article.source?.name || 'Unknown') }}</span>
            <span class="news-time">{{ formatTime(article.publishedAt) }}</span>
          </div>
        </div>
        <img
          v-if="article.urlToImage"
          :src="article.urlToImage"
          :alt="article.title"
          class="news-item-image"
          loading="lazy"
          @error="(e) => e.target.style.display = 'none'"
        />
      </a>

      <div v-if="!news.articles.length" class="news-empty">
        <v-icon size="32" color="rgba(255,255,255,0.2)">mdi-newspaper-remove</v-icon>
        <p>No articles available</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useNews } from '../../composables/useNews.js'
import { useSettings } from '../../composables/useSettings.js'

const { news, changeCategory } = useNews()
const { settings } = useSettings()

defineEmits(['open-settings'])

const categories = [
  { label: 'General', value: 'general' },
  { label: 'Tech', value: 'technology' },
  { label: 'Business', value: 'business' },
  { label: 'Sports', value: 'sports' },
  { label: 'Science', value: 'science' },
  { label: 'Health', value: 'health' },
]

function formatTime(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHrs = Math.floor(diffMs / 3600000)

  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHrs < 24) return `${diffHrs}h ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
</script>

<style scoped>
.news-widget {
  max-height: 520px;
  display: flex;
  flex-direction: column;
}

.news-categories {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.category-chip {
  cursor: pointer;
  font-size: 0.72rem !important;
  border-color: rgba(255, 255, 255, 0.12) !important;
}

.news-loading {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.news-skeleton {
  height: 56px;
  border-radius: 10px;
}

.news-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px 0;
  text-align: center;
}

.news-error p {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
}

.news-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
  flex: 1;
}

.news-item {
  display: flex;
  gap: 12px;
  padding: 10px 8px;
  border-radius: 10px;
  text-decoration: none;
  color: inherit;
  transition: background 0.2s ease;
}

.news-item:hover {
  background: rgba(255, 255, 255, 0.06);
}

.news-item-content {
  flex: 1;
  min-width: 0;
}

.news-item-title {
  font-size: 0.85rem;
  font-weight: 500;
  line-height: 1.35;
  color: rgba(255, 255, 255, 0.9);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.news-item-meta {
  display: flex;
  gap: 10px;
  margin-top: 4px;
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.4);
}

.news-source {
  font-weight: 600;
  color: rgba(108, 99, 255, 0.8);
}

.news-item-image {
  width: 64px;
  height: 48px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
}

.news-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px 0;
}

.news-empty p {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.3);
}
</style>
