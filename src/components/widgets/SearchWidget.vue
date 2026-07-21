<template>
  <div class="search-widget-container">
    <!-- White Pill Search Input Bar -->
    <div class="search-bar-wrapper">
      <div class="search-bar">
        <!-- Google 'G' icon on left -->
        <svg class="search-g-icon" width="22" height="22" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
        </svg>

        <input
          ref="searchInputRef"
          v-model="searchQuery"
          type="text"
          class="search-input-field"
          placeholder="Search"
          @keydown.enter="performSearch"
        />

        <div class="search-actions">
          <!-- Voice mic icon -->
          <button class="icon-btn" title="Voice search">
            <v-icon size="20" color="#6b7280">mdi-microphone</v-icon>
          </button>

          <!-- AI Engine Dropdown Chip -->
          <v-menu location="bottom end" transition="scale-transition">
            <template #activator="{ props }">
              <div v-bind="props" class="ai-select-chip">
                <v-icon size="16" color="#3b82f6">mdi-wand-wave</v-icon>
                <span>{{ selectedAi }}</span>
                <v-icon size="16" color="#6b7280">mdi-chevron-down</v-icon>
              </div>
            </template>
            <v-list class="ai-menu-list" rounded="xl" elevation="4">
              <v-list-item
                v-for="ai in aiOptions"
                :key="ai.name"
                @click="selectAiOption(ai)"
                :active="selectedAi === ai.name"
              >
                <template #prepend>
                  <v-icon :icon="ai.icon" size="18" color="#3b82f6" />
                </template>
                <v-list-item-title>{{ ai.name }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </div>
      </div>
    </div>

    <!-- Category Floating Navigation Bar -->
    <div class="category-floating-bar">
      <div class="cat-tabs">
        <button
          v-for="cat in categories"
          :key="cat"
          class="cat-tab"
          :class="{ active: activeCategory === cat }"
          @click="activeCategory = cat"
        >
          {{ cat }}
        </button>
      </div>

      <div class="cat-actions">
        <button class="cat-action-btn" title="More options">
          <v-icon size="16">mdi-dots-vertical</v-icon>
        </button>
        <button class="cat-action-btn" title="Reorder">
          <v-icon size="16">mdi-swap-horizontal</v-icon>
        </button>
        <button class="cat-action-btn" title="Hide/Show">
          <v-icon size="16">mdi-eye-off-outline</v-icon>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const searchQuery = ref('')
const searchInputRef = ref(null)
const selectedAi = ref('ChatGPT')
const activeCategory = ref('ALL')

const categories = ['ALL', 'SHOP', 'SPORTS', 'FOR ME', 'FUN', 'TOOLS']

const aiOptions = [
  { name: 'ChatGPT', icon: 'mdi-robot-outline', url: 'https://chat.openai.com/' },
  { name: 'Claude', icon: 'mdi-head-lightbulb-outline', url: 'https://claude.ai/' },
  { name: 'Gemini', icon: 'mdi-creation', url: 'https://gemini.google.com/' },
  { name: 'Perplexity', icon: 'mdi-brain', url: 'https://www.perplexity.ai/' },
]

function selectAiOption(ai) {
  selectedAi.value = ai.name
  window.open(ai.url, '_blank')
}

function performSearch() {
  const q = searchQuery.value.trim()
  if (!q) return
  window.open('https://www.google.com/search?q=' + encodeURIComponent(q), '_blank')
  searchQuery.value = ''
}

function handleGlobalKeydown(e) {
  if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
    e.preventDefault()
    if (searchInputRef.value) searchInputRef.value.focus()
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
  max-width: 620px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* White Pill Search Input */
.search-bar-wrapper {
  width: 100%;
}

.search-bar {
  width: 100%;
  height: 52px;
  background: #ffffff !important;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  padding: 0 16px 0 20px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
  transition: all 0.2s ease;
}

.search-bar:focus-within {
  box-shadow: 0 6px 30px rgba(0, 0, 0, 0.4);
}

.search-g-icon {
  flex-shrink: 0;
  margin-right: 12px;
}

.search-input-field {
  flex: 1;
  border: none !important;
  outline: none !important;
  background: transparent !important;
  font-size: 1.05rem !important;
  color: #1f2937 !important;
  font-family: system-ui, -apple-system, sans-serif !important;
  box-shadow: none !important;
  padding: 0 !important;
}

.search-input-field::placeholder {
  color: #6b7280 !important;
}

.search-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 50%;
  transition: background 0.15s ease;
}

.icon-btn:hover {
  background: rgba(0, 0, 0, 0.06);
}

.ai-select-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1px solid #bfdbfe;
  border-radius: 9999px;
  padding: 4px 12px;
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 500;
  color: #2563eb;
  background: #ffffff;
  transition: all 0.15s ease;
  user-select: none;
}

.ai-select-chip:hover {
  background: #eff6ff;
  border-color: #93c5fd;
}

.ai-menu-list {
  background: rgba(255, 255, 255, 0.98) !important;
  backdrop-filter: blur(16px);
}

/* Category Floating Navigation Bar */
.category-floating-bar {
  margin-top: 18px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 9999px;
  padding: 4px 10px 4px 6px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.cat-tabs {
  display: flex;
  align-items: center;
  gap: 4px;
}

.cat-tab {
  background: transparent;
  border: none;
  outline: none;
  padding: 6px 14px;
  border-radius: 9999px;
  font-size: 0.76rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.95);
  cursor: pointer;
  letter-spacing: 0.05em;
  transition: all 0.15s ease;
}

.cat-tab:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
}

.cat-tab.active {
  background: #ffffff;
  color: #111827;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.cat-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-left: 6px;
  padding-left: 6px;
  border-left: 1px solid rgba(255, 255, 255, 0.25);
}

.cat-action-btn {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.cat-action-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
}
</style>
