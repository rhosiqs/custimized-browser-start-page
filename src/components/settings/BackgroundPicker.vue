<template>
  <div class="background-picker">
    <!-- Background Type Selector -->
    <div class="bg-type-selector">
      <v-btn-toggle
        v-model="bgType"
        mandatory
        density="compact"
        rounded="lg"
        color="primary"
        class="bg-toggle"
      >
        <v-btn value="color" size="small">
          <v-icon start size="16">mdi-palette</v-icon>
          Color
        </v-btn>
        <v-btn value="image" size="small">
          <v-icon start size="16">mdi-image</v-icon>
          Image
        </v-btn>
      </v-btn-toggle>
    </div>

    <!-- Color Picker -->
    <div v-if="bgType === 'color'" class="bg-colors">
      <div class="color-grid">
        <div
          v-for="color in presetColors"
          :key="color"
          class="color-swatch"
          :style="{ backgroundColor: color }"
          :class="{ active: settings.background.value === color }"
          @click="setBackground('color', color)"
        >
          <v-icon
            v-if="settings.background.value === color && settings.background.type === 'color'"
            size="16"
            color="white"
          >mdi-check</v-icon>
        </div>
      </div>
      <div class="custom-color-row">
        <span class="custom-label">Custom:</span>
        <input
          type="color"
          :value="settings.background.type === 'color' ? settings.background.value : '#0a0a1a'"
          @input="setBackground('color', $event.target.value)"
          class="custom-color-input"
        />
      </div>
    </div>

    <!-- Image Upload -->
    <div v-else class="bg-image-section">
      <div
        class="upload-zone"
        @click="$refs.fileInput.click()"
        @dragover.prevent="dragOver = true"
        @dragleave="dragOver = false"
        @drop.prevent="handleDrop"
        :class="{ 'drag-over': dragOver }"
      >
        <v-icon size="32" color="rgba(255,255,255,0.3)">mdi-cloud-upload-outline</v-icon>
        <p>Click or drop an image here</p>
        <span class="upload-hint">Supports JPG, PNG, WebP</span>
      </div>
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        class="file-input"
        @change="handleFileSelect"
      />

      <!-- URL input -->
      <v-text-field
        v-model="imageUrl"
        placeholder="Or enter image URL..."
        variant="outlined"
        density="compact"
        rounded="lg"
        hide-details
        class="mt-3"
        @keydown.enter="setBackground('image', imageUrl)"
      >
        <template #append-inner>
          <v-btn
            icon
            variant="text"
            size="x-small"
            @click="setBackground('image', imageUrl)"
            :disabled="!imageUrl"
          >
            <v-icon size="18">mdi-check</v-icon>
          </v-btn>
        </template>
      </v-text-field>

      <!-- Current background preview -->
      <div
        v-if="settings.background.type === 'image' && settings.background.value"
        class="current-bg-preview"
      >
        <img :src="settings.background.value" alt="Current background" />
        <v-btn
          icon
          variant="flat"
          size="x-small"
          color="error"
          class="remove-bg-btn"
          @click="setBackground('color', '#0a0a1a')"
        >
          <v-icon size="16">mdi-close</v-icon>
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useSettings } from '../../composables/useSettings.js'

const { settings, updateSettings } = useSettings()

const bgType = computed({
  get: () => settings.background.type || 'color',
  set: (val) => {
    // Don't change value, just switch mode view
  }
})

const dragOver = ref(false)
const imageUrl = ref('')

const presetColors = [
  '#0a0a1a', '#1a1a2e', '#16213e', '#0f3460',
  '#1b1b3a', '#2d2d44', '#0d1b2a', '#1b263b',
  '#2b2d42', '#3d405b', '#14213d', '#023047',
  '#001219', '#0b090a', '#161a1d', '#1a1a2e',
  '#212529', '#343a40', '#495057', '#6c757d',
  '#264653', '#2a9d8f', '#e76f51', '#e63946',
  '#f4a261', '#457b9d', '#1d3557', '#780000',
]

function setBackground(type, value) {
  updateSettings('background', { type, value })
}

function handleFileSelect(event) {
  const file = event.target.files[0]
  if (file) processFile(file)
}

function handleDrop(event) {
  dragOver.value = false
  const file = event.dataTransfer.files[0]
  if (file && file.type.startsWith('image/')) {
    processFile(file)
  }
}

function processFile(file) {
  const reader = new FileReader()
  reader.onload = (e) => {
    setBackground('image', e.target.result)
  }
  reader.readAsDataURL(file)
}
</script>

<style scoped>
.background-picker {
  margin-top: 4px;
}

.bg-type-selector {
  margin-bottom: 14px;
}

.bg-toggle {
  width: 100%;
}

.bg-toggle .v-btn {
  flex: 1;
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}

.color-swatch {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 10px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.color-swatch:hover {
  transform: scale(1.1);
  border-color: rgba(255, 255, 255, 0.3);
}

.color-swatch.active {
  border-color: #6C63FF;
  box-shadow: 0 0 10px rgba(108, 99, 255, 0.4);
}

.custom-color-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.custom-label {
  font-size: 0.82rem;
  font-weight: 500;
  color: #ffffff;
}

.custom-color-input {
  width: 36px;
  height: 36px;
  border: 2px solid rgba(255, 255, 255, 0.25);
  border-radius: 10px;
  cursor: pointer;
  background: transparent;
  padding: 2px;
}

.custom-color-input::-webkit-color-swatch-wrapper {
  padding: 0;
}

.custom-color-input::-webkit-color-swatch {
  border: none;
  border-radius: 6px;
}

.upload-zone {
  border: 2px dashed rgba(255, 255, 255, 0.3);
  border-radius: 14px;
  padding: 28px 16px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.upload-zone:hover,
.upload-zone.drag-over {
  border-color: rgba(59, 130, 246, 0.7);
  background: rgba(59, 130, 246, 0.1);
}

.upload-zone p {
  font-size: 0.88rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
}

.upload-hint {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
}

.file-input {
  display: none;
}

.current-bg-preview {
  position: relative;
  margin-top: 12px;
  border-radius: 12px;
  overflow: hidden;
}

.current-bg-preview img {
  width: 100%;
  height: 100px;
  object-fit: cover;
  border-radius: 12px;
}

.remove-bg-btn {
  position: absolute;
  top: 6px;
  right: 6px;
}

.bg-image-section {
  /* No extra styles needed */
}
</style>
