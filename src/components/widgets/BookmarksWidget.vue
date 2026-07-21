<template>
  <div class="bookmarks-widget">
    <div class="bookmarks-grid">
      <div
        v-for="bookmark in bookmarks"
        :key="bookmark.id"
        class="bookmark-tile"
        @click="openBookmark(bookmark.url)"
        @contextmenu.prevent="openEditDialog(bookmark)"
      >
        <div class="tile-icon-box" :style="getTileStyle(bookmark)">
          <img
            v-if="useCustomIcon(bookmark.url)"
            :src="getCustomIcon(bookmark.url)"
            :alt="bookmark.name"
            class="tile-img"
          />
          <img
            v-else
            :src="getFavicon(bookmark.url)"
            :alt="bookmark.name"
            class="tile-img"
            @error="(e) => e.target.src = fallbackIcon"
          />
        </div>
      </div>

      <!-- Add Shortcut Button Tile -->
      <div class="bookmark-tile add-tile" @click="openAddDialog">
        <div class="tile-icon-box add-box">
          <v-icon size="24" color="rgba(255,255,255,0.7)">mdi-plus</v-icon>
        </div>
      </div>
    </div>

    <!-- Add/Edit Dialog -->
    <v-dialog v-model="dialogVisible" max-width="380">
      <v-card
        rounded="xl"
        :style="{
          background: 'rgba(15, 15, 30, 0.98)',
          backdropFilter: 'blur(30px)',
        }"
      >
        <v-card-title class="pt-5 px-5">
          {{ isEditing ? 'Edit Bookmark' : 'Add Bookmark' }}
        </v-card-title>
        <v-card-text class="px-5">
          <v-text-field
            v-model="formData.name"
            label="Name"
            variant="outlined"
            rounded="lg"
            density="comfortable"
            hide-details
            class="mb-3"
          />
          <v-text-field
            v-model="formData.url"
            label="URL"
            variant="outlined"
            rounded="lg"
            density="comfortable"
            hide-details
            placeholder="https://..."
          />
        </v-card-text>
        <v-card-actions class="px-5 pb-5">
          <v-btn
            v-if="isEditing"
            color="error"
            variant="text"
            @click="deleteCurrentBookmark"
          >
            Delete
          </v-btn>
          <v-spacer />
          <v-btn variant="text" @click="dialogVisible = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat" rounded="lg" @click="saveBookmark">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useWidgets } from '../../composables/useWidgets.js'

const { bookmarks, addBookmark, removeBookmark, updateBookmark } = useWidgets()

const fallbackIcon = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="%23333"/><text x="12" y="16" text-anchor="middle" fill="white" font-size="12">?</text></svg>'

const dialogVisible = ref(false)
const isEditing = ref(false)
const formData = ref({ id: null, name: '', url: '' })

// Preset icon colors matching BHE image 2 tile styling
function getTileStyle(bookmark) {
  const url = (bookmark.url || '').toLowerCase()
  if (url.includes('amazon')) return { background: '#ff9900' }
  if (url.includes('espn')) return { background: '#cc0000' }
  if (url.includes('gmail') || url.includes('mail.google')) return { background: '#ffffff' }
  if (url.includes('maps.google') || url.includes('google.com/maps')) return { background: '#ffffff' }
  if (url.includes('instagram')) return { background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)' }
  if (url.includes('netflix')) return { background: '#000000' }
  if (url.includes('reddit')) return { background: '#ff4500' }
  if (url.includes('wikipedia') || url.includes('wordle')) return { background: '#ffffff' }
  if (url.includes('youtube')) return { background: '#ff0000' }
  return { background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(10px)' }
}

function useCustomIcon(urlStr) {
  return false
}

function getCustomIcon(urlStr) {
  return ''
}

function getFavicon(url) {
  try {
    const domain = new URL(url).hostname
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
  } catch {
    return fallbackIcon
  }
}

function openBookmark(url) {
  window.open(url, '_blank')
}

function openAddDialog() {
  isEditing.value = false
  formData.value = { id: null, name: '', url: '' }
  dialogVisible.value = true
}

function openEditDialog(bookmark) {
  isEditing.value = true
  formData.value = { ...bookmark }
  dialogVisible.value = true
}

function saveBookmark() {
  const name = formData.value.name.trim()
  let url = formData.value.url.trim()
  if (!name || !url) return

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url
  }

  if (isEditing.value && formData.value.id) {
    updateBookmark(formData.value.id, { name, url })
  } else {
    addBookmark({ name, url })
  }
  dialogVisible.value = false
}

function deleteCurrentBookmark() {
  if (formData.value.id) {
    removeBookmark(formData.value.id)
  }
  dialogVisible.value = false
}
</script>

<style scoped>
.bookmarks-widget {
  width: 100%;
  max-width: 760px;
  margin: 0 auto;
}

.bookmarks-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: center;
  align-items: center;
}

.bookmark-tile {
  cursor: pointer;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.bookmark-tile:hover {
  transform: translateY(-4px) scale(1.06);
}

.tile-icon-box {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
  overflow: hidden;
}

.tile-img {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.add-box {
  background: rgba(255, 255, 255, 0.15) !important;
  backdrop-filter: blur(12px);
  border: 1px dashed rgba(255, 255, 255, 0.4);
}

.add-tile:hover .add-box {
  background: rgba(255, 255, 255, 0.25) !important;
}
</style>
