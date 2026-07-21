<template>
  <div class="bookmarks-wrapper glass-surface">
    <div class="bookmarks-grid">
      <div
        v-for="bookmark in bookmarks"
        :key="bookmark.id"
        class="bookmark-item"
        @click="openBookmark(bookmark.url)"
        @contextmenu.prevent="openEditDialog(bookmark)"
      >
        <div class="bookmark-icon-wrapper">
          <img
            :src="getFavicon(bookmark.url)"
            :alt="bookmark.name"
            class="bookmark-icon"
            loading="lazy"
            @error="(e) => e.target.src = fallbackIcon"
          />
        </div>
        <div class="bookmark-name">{{ bookmark.name }}</div>
      </div>

      <!-- Add Button -->
      <div class="bookmark-item add-item" @click="openAddDialog">
        <div class="bookmark-icon-wrapper add-icon-wrapper">
          <v-icon size="24" color="rgba(255,255,255,0.5)">mdi-plus</v-icon>
        </div>
        <div class="bookmark-name">Add</div>
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

function getFavicon(url) {
  try {
    const domain = new URL(url).hostname
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
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

  // Auto-prepend https if missing
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
.bookmarks-wrapper {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px 24px;
}

.bookmarks-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: center;
}

.bookmark-item {
  width: 72px;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.bookmark-item:hover {
  transform: scale(1.08);
}

.bookmark-icon-wrapper {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 6px;
  transition: all 0.2s ease;
  overflow: hidden;
}

.bookmark-item:hover .bookmark-icon-wrapper {
  background: rgba(255, 255, 255, 0.14);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.bookmark-icon {
  width: 28px;
  height: 28px;
  object-fit: contain;
}

.add-icon-wrapper {
  border: 2px dashed rgba(255, 255, 255, 0.15);
  background: transparent;
}

.add-item:hover .add-icon-wrapper {
  border-color: rgba(108, 99, 255, 0.4);
  background: rgba(108, 99, 255, 0.08);
}

.bookmark-name {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}
</style>
