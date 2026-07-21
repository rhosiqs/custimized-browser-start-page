<template>
  <v-app :style="backgroundStyle">
    <!-- Background overlay for contrast -->
    <div class="background-overlay"></div>

    <!-- Top Header Navigation Bar -->
    <NavBar @open-settings="showSettings = true" />

    <!-- Left Action Dock -->
    <LeftDock @open-modal="handleOpenModal" />

    <!-- Main Content Area -->
    <v-main class="main-content">
      <WidgetGrid :requestedModal="modalToOpen" />
    </v-main>

    <!-- Bottom Translucent Footer Dock -->
    <BottomDock @open-modal="handleOpenModal" />

    <!-- Settings Drawer -->
    <SettingsDrawer v-model="showSettings" />
  </v-app>
</template>

<script setup>
import { ref, computed } from 'vue'
import NavBar from './components/layout/NavBar.vue'
import LeftDock from './components/layout/LeftDock.vue'
import BottomDock from './components/layout/BottomDock.vue'
import WidgetGrid from './components/layout/WidgetGrid.vue'
import SettingsDrawer from './components/settings/SettingsDrawer.vue'
import { useSettings } from './composables/useSettings.js'

const { settings } = useSettings()

const showSettings = ref(false)
const modalToOpen = ref('')

function handleOpenModal(type) {
  modalToOpen.value = ''
  setTimeout(() => {
    modalToOpen.value = type
  }, 10)
}

// Background style
const backgroundStyle = computed(() => {
  const bg = settings.background
  if (!bg) return { background: '#0a0a1a' }

  if (bg.type === 'color') {
    return { background: bg.value || '#0a0a1a' }
  } else if (bg.type === 'image' && bg.value) {
    return {
      background: `url('${bg.value}') no-repeat center center fixed`,
      backgroundSize: 'cover',
    }
  }
  return { background: '#0a0a1a' }
})
</script>

<style scoped>
.background-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.15);
  pointer-events: none;
  z-index: 0;
}

.main-content {
  position: relative;
  z-index: 1;
  padding-bottom: 60px;
}
</style>
