<template>
  <v-app :style="backgroundStyle">
    <!-- Background overlay for readability -->
    <div class="background-overlay"></div>

    <NavBar
      @open-settings="showSettings = true"
    />

    <v-main class="main-content">
      <WidgetGrid />
    </v-main>

    <!-- Settings Drawer -->
    <SettingsDrawer
      v-model="showSettings"
    />

    <!-- Context Menu -->
    <Teleport to="body">
      <div
        v-if="contextMenu.show"
        class="context-menu"
        :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }"
        @click="contextMenu.show = false"
      >
        <div
          v-for="item in contextMenu.items"
          :key="item.label"
          class="context-menu-item"
          @click="item.action"
        >
          <v-icon size="18">{{ item.icon }}</v-icon>
          {{ item.label }}
        </div>
      </div>
    </Teleport>
  </v-app>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, provide, reactive } from 'vue'
import NavBar from './components/layout/NavBar.vue'
import WidgetGrid from './components/layout/WidgetGrid.vue'
import SettingsDrawer from './components/settings/SettingsDrawer.vue'
import { useSettings } from './composables/useSettings.js'

const { settings } = useSettings()

const showSettings = ref(false)

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

// Context menu
const contextMenu = reactive({
  show: false,
  x: 0,
  y: 0,
  items: [],
})

function showContextMenu(event, items) {
  event.preventDefault()
  contextMenu.x = event.clientX
  contextMenu.y = event.clientY
  contextMenu.items = items
  contextMenu.show = true
}

function hideContextMenu() {
  contextMenu.show = false
}

provide('contextMenu', { showContextMenu, hideContextMenu })

// Close context menu on click elsewhere
function onDocumentClick() {
  contextMenu.show = false
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
})

onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick)
})
</script>

<style scoped>
.background-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  pointer-events: none;
  z-index: 0;
}

.main-content {
  position: relative;
  z-index: 1;
  padding-top: 20px;
}
</style>
