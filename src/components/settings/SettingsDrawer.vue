<template>
  <v-navigation-drawer
    :modelValue="modelValue"
    @update:modelValue="$emit('update:modelValue', $event)"
    location="right"
    temporary
    width="380"
    class="settings-drawer"
    :style="{
      background: 'rgba(15, 15, 30, 0.95)',
      backdropFilter: 'blur(30px)',
      WebkitBackdropFilter: 'blur(30px)',
    }"
  >
    <div class="settings-header">
      <h2 class="settings-title">Settings</h2>
      <v-btn
        icon
        variant="text"
        size="small"
        @click="$emit('update:modelValue', false)"
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </div>

    <v-divider class="mb-4" />

    <div class="settings-content">
      <!-- Clock Settings -->
      <div class="settings-section">
        <div class="section-title">
          <v-icon size="20">mdi-clock-outline</v-icon>
          Clock
        </div>
        <div class="setting-row">
          <span>24-hour format</span>
          <v-switch
            v-model="settings.clock.format24h"
            hide-details
            density="compact"
            color="primary"
            inset
          />
        </div>
        <div class="setting-row">
          <span>Show seconds</span>
          <v-switch
            v-model="settings.clock.showSeconds"
            hide-details
            density="compact"
            color="primary"
            inset
          />
        </div>
        <div class="setting-row">
          <span>Show date</span>
          <v-switch
            v-model="settings.clock.showDate"
            hide-details
            density="compact"
            color="primary"
            inset
          />
        </div>
      </div>

      <v-divider class="my-3" />

      <!-- Search Settings -->
      <div class="settings-section">
        <div class="section-title">
          <v-icon size="20">mdi-magnify</v-icon>
          Search
        </div>
        <div class="setting-row">
          <span>Default engine</span>
          <v-select
            v-model="settings.search.engine"
            :items="['google', 'bing', 'duckduckgo', 'yahoo']"
            hide-details
            density="compact"
            variant="outlined"
            rounded="lg"
            style="max-width: 140px;"
          />
        </div>
        <div class="setting-row">
          <span>Show AI shortcuts</span>
          <v-switch
            v-model="settings.search.showAIShortcuts"
            hide-details
            density="compact"
            color="primary"
            inset
          />
        </div>
      </div>

      <v-divider class="my-3" />

      <!-- Background Settings -->
      <div class="settings-section">
        <div class="section-title">
          <v-icon size="20">mdi-palette-outline</v-icon>
          Background
        </div>
        <BackgroundPicker />
      </div>

      <v-divider class="my-3" />

      <!-- News API Key -->
      <div class="settings-section">
        <div class="section-title">
          <v-icon size="20">mdi-key-outline</v-icon>
          News API
        </div>
        <v-text-field
          v-model="settings.newsApiKey"
          placeholder="Enter NewsAPI.org key"
          variant="outlined"
          density="compact"
          rounded="lg"
          hide-details
          type="password"
          class="mt-2"
        >
          <template #append-inner>
            <v-icon
              v-if="settings.newsApiKey"
              size="18"
              color="success"
            >mdi-check-circle</v-icon>
          </template>
        </v-text-field>
        <p class="api-hint">
          Get a free key at
          <a href="https://newsapi.org" target="_blank" rel="noopener">newsapi.org</a>
        </p>
      </div>

      <v-divider class="my-3" />

      <!-- Widget Visibility -->
      <div class="settings-section">
        <div class="section-title">
          <v-icon size="20">mdi-view-dashboard-outline</v-icon>
          Widgets
        </div>
        <div
          v-for="widget in widgetsList"
          :key="widget.key"
          class="setting-row"
        >
          <span>{{ widget.label }}</span>
          <v-switch
            v-model="settings.widgetVisibility[widget.key]"
            hide-details
            density="compact"
            color="primary"
            inset
          />
        </div>
      </div>

      <v-divider class="my-3" />

      <!-- Theme Colors -->
      <div class="settings-section">
        <div class="section-title">
          <v-icon size="20">mdi-brush-outline</v-icon>
          Theme Colors
        </div>
        <div class="color-row">
          <span>Primary</span>
          <input
            type="color"
            v-model="settings.theme.primaryColor"
            class="color-picker"
          />
        </div>
        <div class="color-row">
          <span>Accent</span>
          <input
            type="color"
            v-model="settings.theme.accentColor"
            class="color-picker"
          />
        </div>
      </div>

      <v-divider class="my-3" />

      <!-- Reset -->
      <div class="settings-section">
        <v-btn
          block
          variant="outlined"
          color="error"
          rounded="lg"
          @click="confirmReset"
        >
          <v-icon start>mdi-restore</v-icon>
          Reset All Settings
        </v-btn>
      </div>
    </div>

    <!-- Reset Confirmation Dialog -->
    <v-dialog v-model="showResetDialog" max-width="340">
      <v-card rounded="xl" class="reset-dialog">
        <v-card-title class="text-center pt-6">Reset Settings?</v-card-title>
        <v-card-text class="text-center">
          This will restore all settings to defaults. This cannot be undone.
        </v-card-text>
        <v-card-actions class="justify-center pb-5">
          <v-btn variant="text" @click="showResetDialog = false">Cancel</v-btn>
          <v-btn color="error" variant="flat" @click="doReset">Reset</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-navigation-drawer>
</template>

<script setup>
import { ref } from 'vue'
import { useSettings } from '../../composables/useSettings.js'
import BackgroundPicker from './BackgroundPicker.vue'

const props = defineProps({
  modelValue: Boolean,
})

defineEmits(['update:modelValue'])

const { settings, resetSettings } = useSettings()

const showResetDialog = ref(false)

const widgetsList = [
  { key: 'clock', label: 'Clock' },
  { key: 'search', label: 'Search Bar' },
  { key: 'bookmarks', label: 'Bookmarks' },
  { key: 'weather', label: 'Weather' },
  { key: 'news', label: 'News' },
  { key: 'notes', label: 'Notes' },
  { key: 'planner', label: 'Planner' },
  { key: 'dailyBrief', label: 'Daily Brief' },
]

function confirmReset() {
  showResetDialog.value = true
}

function doReset() {
  resetSettings()
  showResetDialog.value = false
}
</script>

<style scoped>
.settings-drawer {
  border-left: 1px solid rgba(255, 255, 255, 0.06) !important;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 20px 12px;
}

.settings-title {
  font-size: 1.3rem;
  font-weight: 700;
  background: linear-gradient(135deg, #6C63FF, #00D9FF);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.settings-content {
  padding: 0 20px 40px;
  overflow-y: auto;
}

.settings-section {
  padding: 8px 0;
}

.section-title {
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(255, 255, 255, 0.85);
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.setting-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}

.setting-row span {
  font-size: 0.88rem;
  font-weight: 500;
  color: #ffffff;
}

.color-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
}

.color-row span {
  font-size: 0.88rem;
  font-weight: 500;
  color: #ffffff;
}

.color-picker {
  width: 36px;
  height: 36px;
  border: 2px solid rgba(255, 255, 255, 0.25);
  border-radius: 10px;
  cursor: pointer;
  background: transparent;
  padding: 2px;
}

.color-picker::-webkit-color-swatch-wrapper {
  padding: 0;
}

.color-picker::-webkit-color-swatch {
  border: none;
  border-radius: 6px;
}

.api-hint {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.65);
  margin-top: 6px;
}

.api-hint a {
  color: #60a5fa;
  text-decoration: underline;
}

.api-hint a:hover {
  color: #93c5fd;
}

.reset-dialog {
  background: rgba(15, 23, 42, 0.98) !important;
  color: #ffffff !important;
}
</style>
