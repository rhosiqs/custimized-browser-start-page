<template>
  <div class="search-widget-container">
    <v-text-field
      ref="searchInputRef"
      v-model="searchQuery"
      variant="solo"
      rounded="pill"
      class="glass-search"
      hide-details
      @keydown.enter="performSearch"
      placeholder="Search the web..."
      bg-color="rgba(30, 30, 30, 0.5)"
    >
      <template #prepend-inner>
        <v-icon color="rgba(255,255,255,0.6)">mdi-magnify</v-icon>
      </template>

      <template #append-inner>
        <v-menu location="bottom end" transition="scale-transition">
          <template #activator="{ props }">
            <v-btn v-bind="props" icon variant="text" size="small" color="white">
              <v-icon>{{ currentEngineIcon }}</v-icon>
            </v-btn>
          </template>
          <v-list bg-color="rgba(20, 20, 35, 0.95)" class="glass-menu" rounded="lg">
            <v-list-item
              v-for="engine in engines"
              :key="engine.id"
              @click="setEngine(engine.id)"
              :active="settings.search.engine === engine.id"
            >
              <template #prepend>
                <v-icon :icon="engine.icon" size="20" />
              </template>
              <v-list-item-title>{{ engine.name }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </template>
    </v-text-field>

    <div v-if="settings.search.showAIShortcuts" class="ai-shortcuts">
      <v-chip
        v-for="ai in aiShortcuts"
        :key="ai.name"
        size="small"
        variant="outlined"
        class="ai-chip"
        @click="window.open(ai.url, '_blank')"
      >
        <v-icon start size="14">{{ ai.icon }}</v-icon>
        {{ ai.name }}
      </v-chip>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useSettings } from '../../composables/useSettings.js'

const { settings, updateSettings } = useSettings()

const searchQuery = ref('')
const searchInputRef = ref(null)

const engines = [
  { id: 'google', name: 'Google', icon: 'mdi-google', url: 'https://www.google.com/search?q=' },
  { id: 'bing', name: 'Bing', icon: 'mdi-microsoft-bing', url: 'https://www.bing.com/search?q=' },
  { id: 'duckduckgo', name: 'DuckDuckGo', icon: 'mdi-duck', url: 'https://duckduckgo.com/?q=' },
  { id: 'yahoo', name: 'Yahoo', icon: 'mdi-yahoo', url: 'https://search.yahoo.com/search?p=' },
]

const currentEngineIcon = computed(() => {
  const engine = engines.find(e => e.id === settings.search.engine)
  return engine ? engine.icon : 'mdi-google'
})

function setEngine(id) {
  updateSettings('search.engine', id)
}

function performSearch() {
  const q = searchQuery.value.trim()
  if (!q) return
  const engine = engines.find(e => e.id === settings.search.engine)
  if (engine) {
    window.open(engine.url + encodeURIComponent(q), '_blank')
    searchQuery.value = ''
  }
}

const aiShortcuts = [
  { name: 'ChatGPT', icon: 'mdi-robot-outline', url: 'https://chat.openai.com/' },
  { name: 'Claude', icon: 'mdi-head-lightbulb-outline', url: 'https://claude.ai/' },
  { name: 'Gemini', icon: 'mdi-creation', url: 'https://gemini.google.com/' },
  { name: 'Perplexity', icon: 'mdi-brain', url: 'https://www.perplexity.ai/' },
]

function handleGlobalKeydown(e) {
  if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
    e.preventDefault()
    const input = searchInputRef.value?.$el?.querySelector('input')
    if (input) input.focus()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
})
</script>

<style scoped>
.search-widget-container {
  width: 100%;
  max-width: 680px;
  margin: 0 auto;
  padding: 0 16px;
}

.glass-search :deep(.v-field) {
  background-color: rgba(255, 255, 255, 0.06) !important;
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.glass-search:focus-within :deep(.v-field) {
  border-color: rgba(108, 99, 255, 0.4);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 0 0 20px rgba(108, 99, 255, 0.15);
}

.glass-search :deep(.v-field__input) {
  color: white !important;
}

.glass-search :deep(.v-field__input::placeholder) {
  color: rgba(255, 255, 255, 0.35) !important;
}

.glass-menu {
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.ai-shortcuts {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 14px;
  flex-wrap: wrap;
}

.ai-chip {
  background: rgba(255, 255, 255, 0.04) !important;
  border-color: rgba(255, 255, 255, 0.12) !important;
  color: rgba(255, 255, 255, 0.7) !important;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.78rem !important;
}

.ai-chip:hover {
  background: rgba(255, 255, 255, 0.1) !important;
  border-color: rgba(108, 99, 255, 0.4) !important;
  transform: translateY(-1px);
}
</style>
