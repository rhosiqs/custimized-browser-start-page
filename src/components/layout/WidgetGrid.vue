<template>
  <v-container fluid class="widget-grid-container">
    <!-- Clock -->
    <div v-if="settings.widgetVisibility.clock" class="widget-section clock-section">
      <ClockWidget />
    </div>

    <!-- Search -->
    <div v-if="settings.widgetVisibility.search" class="widget-section search-section">
      <SearchWidget />
    </div>

    <!-- Bookmarks -->
    <div v-if="settings.widgetVisibility.bookmarks" class="widget-section bookmarks-section">
      <BookmarksWidget />
    </div>

    <!-- Cards Row -->
    <v-row class="widget-cards-row" justify="center">
      <!-- Weather -->
      <v-col
        v-if="settings.widgetVisibility.weather"
        cols="12" sm="6" md="4" lg="3"
      >
        <WeatherWidget />
      </v-col>

      <!-- News -->
      <v-col
        v-if="settings.widgetVisibility.news"
        cols="12" sm="6" md="4" lg="5"
      >
        <NewsWidget />
      </v-col>

      <!-- Notes -->
      <v-col
        v-if="settings.widgetVisibility.notes"
        cols="12" sm="6" md="4" lg="4"
      >
        <NotesWidget />
      </v-col>
    </v-row>

    <!-- Second Row -->
    <v-row class="widget-cards-row" justify="center">
      <!-- Planner -->
      <v-col
        v-if="settings.widgetVisibility.planner"
        cols="12" sm="6" md="4" lg="4"
      >
        <PlannerWidget />
      </v-col>

      <!-- Daily Brief -->
      <v-col
        v-if="settings.widgetVisibility.dailyBrief"
        cols="12" sm="6" md="4" lg="4"
      >
        <DailyBriefWidget />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { useSettings } from '../../composables/useSettings.js'
import ClockWidget from '../widgets/ClockWidget.vue'
import SearchWidget from '../widgets/SearchWidget.vue'
import BookmarksWidget from '../widgets/BookmarksWidget.vue'
import WeatherWidget from '../widgets/WeatherWidget.vue'
import NewsWidget from '../widgets/NewsWidget.vue'
import NotesWidget from '../widgets/NotesWidget.vue'
import PlannerWidget from '../widgets/PlannerWidget.vue'
import DailyBriefWidget from '../widgets/DailyBriefWidget.vue'

const { settings } = useSettings()
</script>

<style scoped>
.widget-grid-container {
  max-width: 1400px;
  padding: 0 24px 60px;
}

.widget-section {
  display: flex;
  justify-content: center;
  margin-bottom: 12px;
}

.clock-section {
  margin-top: 20px;
  margin-bottom: 4px;
}

.search-section {
  margin-bottom: 28px;
}

.bookmarks-section {
  margin-bottom: 32px;
}

.widget-cards-row {
  margin-bottom: 16px;
}

@media (max-width: 600px) {
  .widget-grid-container {
    padding: 0 12px 40px;
  }

  .clock-section {
    margin-top: 8px;
  }
}
</style>
