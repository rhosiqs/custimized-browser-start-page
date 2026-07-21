<template>
  <div class="grid-layout">
    <!-- Top Right Clock Area -->
    <div class="top-clock-area" v-if="settings.widgetVisibility.clock">
      <ClockWidget />
    </div>

    <!-- Center Hero Section (Search & Bookmarks) -->
    <div class="center-hero-section">
      <!-- Search Bar & Floating Categories -->
      <div class="search-container" v-if="settings.widgetVisibility.search">
        <SearchWidget />
      </div>

      <!-- Floating App Bookmarks Grid -->
      <div class="bookmarks-container" v-if="settings.widgetVisibility.bookmarks">
        <BookmarksWidget />
      </div>
    </div>

    <!-- Modals for Widgets (Opened via Footer Pills / Left Dock) -->
    <v-dialog v-model="activeModal.notes" max-width="500">
      <NotesWidget />
    </v-dialog>

    <v-dialog v-model="activeModal.planner" max-width="500">
      <PlannerWidget />
    </v-dialog>

    <v-dialog v-model="activeModal.dailyBrief" max-width="600">
      <DailyBriefWidget />
    </v-dialog>

    <v-dialog v-model="activeModal.weather" max-width="450">
      <WeatherWidget />
    </v-dialog>

    <v-dialog v-model="activeModal.news" max-width="600">
      <NewsWidget />
    </v-dialog>
  </div>
</template>

<script setup>
import { reactive, watch } from 'vue'
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

const activeModal = reactive({
  notes: false,
  planner: false,
  dailyBrief: false,
  weather: false,
  news: false,
})

watch(() => props.requestedModal, (newVal) => {
  if (newVal === 'notes') activeModal.notes = true
  if (newVal === 'planner') activeModal.planner = true
  if (newVal === 'dailyBrief') activeModal.dailyBrief = true
  if (newVal === 'weather') activeModal.weather = true
  if (newVal === 'news') activeModal.news = true
})
</script>

<style scoped>
.grid-layout {
  position: relative;
  width: 100%;
  min-height: calc(100vh - 110px);
  display: flex;
  flex-direction: column;
}

.top-clock-area {
  position: absolute;
  top: 10px;
  right: 40px;
  z-index: 10;
}

.center-hero-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: 80px;
  gap: 30px;
  padding: 0 20px;
}

.search-container {
  width: 100%;
}

.bookmarks-container {
  width: 100%;
}
</style>
