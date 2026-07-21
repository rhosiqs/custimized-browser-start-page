<template>
  <div class="grid-layout">
    <!-- Top Right Clock Display (Positioned BELOW the header navbar) -->
    <div class="top-clock-area" v-if="settings.widgetVisibility.clock">
      <ClockWidget />
    </div>

    <!-- Center Hero Section (Search & Bookmarks) -->
    <div class="center-hero-section">
      <!-- Search Input Bar & Floating Category Tabs -->
      <div class="search-container" v-if="settings.widgetVisibility.search">
        <SearchWidget
          @filter-category="handleCategoryFilter"
          @toggle-reorder="reorderMode = !reorderMode"
          @toggle-bookmarks-visibility="showBookmarks = !showBookmarks"
        />
      </div>

      <!-- Floating App Bookmarks Grid -->
      <div class="bookmarks-container" v-if="settings.widgetVisibility.bookmarks">
        <BookmarksWidget
          ref="bookmarksWidgetRef"
          :activeCategory="activeCategory"
          :showBookmarks="showBookmarks"
          :reorderMode="reorderMode"
        />
      </div>
    </div>

    <!-- Modals for Features (Opened via Footer Pills / Left Dock / FAB) -->
    <v-dialog v-model="activeModal.notes" max-width="520">
      <v-card rounded="xl" class="modal-card">
        <v-card-title class="d-flex justify-space-between align-center px-6 pt-5 pb-2 text-white">
          <span class="font-weight-bold">Notes</span>
          <v-btn icon variant="text" size="small" @click="activeModal.notes = false">
            <v-icon color="white">mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text class="px-6 pb-6">
          <NotesWidget />
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="activeModal.planner" max-width="520">
      <v-card rounded="xl" class="modal-card">
        <v-card-title class="d-flex justify-space-between align-center px-6 pt-5 pb-2 text-white">
          <span class="font-weight-bold">Planner</span>
          <v-btn icon variant="text" size="small" @click="activeModal.planner = false">
            <v-icon color="white">mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text class="px-6 pb-6">
          <PlannerWidget />
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="activeModal.dailyBrief" max-width="640">
      <v-card rounded="xl" class="modal-card">
        <v-card-title class="d-flex justify-space-between align-center px-6 pt-5 pb-2 text-white">
          <span class="font-weight-bold">Daily Brief</span>
          <v-btn icon variant="text" size="small" @click="activeModal.dailyBrief = false">
            <v-icon color="white">mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text class="px-6 pb-6">
          <DailyBriefWidget />
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="activeModal.weather" max-width="480">
      <v-card rounded="xl" class="modal-card">
        <v-card-title class="d-flex justify-space-between align-center px-6 pt-5 pb-2 text-white">
          <span class="font-weight-bold">Weather</span>
          <v-btn icon variant="text" size="small" @click="activeModal.weather = false">
            <v-icon color="white">mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text class="px-6 pb-6">
          <WeatherWidget />
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="activeModal.news" max-width="640">
      <v-card rounded="xl" class="modal-card">
        <v-card-title class="d-flex justify-space-between align-center px-6 pt-5 pb-2 text-white">
          <span class="font-weight-bold">News</span>
          <v-btn icon variant="text" size="small" @click="activeModal.news = false">
            <v-icon color="white">mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text class="px-6 pb-6">
          <NewsWidget />
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="activeModal.maps" max-width="640">
      <v-card rounded="xl" class="modal-card">
        <v-card-title class="d-flex justify-space-between align-center px-6 pt-5 pb-2 text-white">
          <span class="font-weight-bold">Google Maps</span>
          <v-btn icon variant="text" size="small" @click="activeModal.maps = false">
            <v-icon color="white">mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text class="px-6 pb-6 text-center">
          <v-icon size="48" color="#3b82f6" class="mb-3">mdi-map-marker-radius</v-icon>
          <p class="text-body-1 text-white mb-4">Quick launch Google Maps in a new tab</p>
          <v-btn color="primary" rounded="lg" href="https://maps.google.com" target="_blank" rel="noopener">
            Open Google Maps
          </v-btn>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { useSettings } from '../../composables/useSettings.js'
import ClockWidget from '../widgets/ClockWidget.vue'
import SearchWidget from '../widgets/SearchWidget.vue'
import BookmarksWidget from '../widgets/BookmarksWidget.vue'
import WeatherWidget from '../widgets/WeatherWidget.vue'
import NewsWidget from '../widgets/NewsWidget.vue'
import NotesWidget from '../widgets/NotesWidget.vue'
import PlannerWidget from '../widgets/PlannerWidget.vue'
import DailyBriefWidget from '../widgets/DailyBriefWidget.vue'

const props = defineProps({
  requestedModal: String,
})

const { settings } = useSettings()

const bookmarksWidgetRef = ref(null)
const activeCategory = ref('ALL')
const showBookmarks = ref(true)
const reorderMode = ref(false)

const activeModal = reactive({
  notes: false,
  planner: false,
  dailyBrief: false,
  weather: false,
  news: false,
  maps: false,
})

function handleCategoryFilter(cat) {
  activeCategory.value = cat
}

watch(() => props.requestedModal, (newVal) => {
  if (newVal === 'notes') activeModal.notes = true
  if (newVal === 'planner') activeModal.planner = true
  if (newVal === 'dailyBrief') activeModal.dailyBrief = true
  if (newVal === 'weather') activeModal.weather = true
  if (newVal === 'news') activeModal.news = true
  if (newVal === 'maps') activeModal.maps = true
  if (newVal === 'add') {
    bookmarksWidgetRef.value?.openAddDialog()
  }
})
</script>

<style scoped>
.grid-layout {
  position: relative;
  width: 100%;
  min-height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
}

/* Clock is placed BELOW the 64px Navbar to eliminate collision */
.top-clock-area {
  position: absolute;
  top: 76px;
  right: 36px;
  z-index: 10;
}

.center-hero-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: 100px;
  gap: 28px;
  padding: 0 20px;
}

.search-container {
  width: 100%;
}

.bookmarks-container {
  width: 100%;
}

.modal-card {
  background: rgba(15, 23, 42, 0.96) !important;
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.15) !important;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6) !important;
}
</style>
