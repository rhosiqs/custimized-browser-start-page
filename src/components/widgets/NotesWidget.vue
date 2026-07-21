<template>
  <div class="glass-card widget-container notes-widget">
    <div class="widget-title">
      <v-icon>mdi-note-text-outline</v-icon>
      Notes
      <v-spacer />
      <v-btn
        icon
        variant="text"
        size="x-small"
        @click="addNote"
      >
        <v-icon size="18">mdi-plus</v-icon>
      </v-btn>
    </div>

    <div class="notes-list" v-if="notes.length">
      <div
        v-for="note in notes"
        :key="note.id"
        class="note-card"
        :style="{ borderLeftColor: note.color }"
      >
        <textarea
          v-model="note.text"
          class="note-textarea"
          :placeholder="'Write something...'"
          rows="3"
          @input="saveNotes"
        ></textarea>
        <div class="note-footer">
          <span class="note-date">{{ formatDate(note.updatedAt) }}</span>
          <div class="note-actions">
            <v-btn
              icon
              variant="text"
              size="x-small"
              @click="cycleColor(note)"
            >
              <v-icon size="14" :color="note.color">mdi-circle</v-icon>
            </v-btn>
            <v-btn
              icon
              variant="text"
              size="x-small"
              @click="removeNote(note.id)"
            >
              <v-icon size="14">mdi-close</v-icon>
            </v-btn>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="notes-empty">
      <v-icon size="36" color="rgba(255,255,255,0.15)">mdi-note-plus-outline</v-icon>
      <p>Click + to add a note</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const STORAGE_KEY = 'BHE_NOTES'
const COLORS = ['#6C63FF', '#00D9FF', '#FF6B9D', '#4CAF50', '#FFC107', '#FF5252']

const notes = ref([])

function loadNotes() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (data) notes.value = JSON.parse(data)
  } catch (e) {
    // ignore
  }
}

function saveNotes() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes.value))
}

function addNote() {
  notes.value.unshift({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    text: '',
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })
  saveNotes()
}

function removeNote(id) {
  notes.value = notes.value.filter(n => n.id !== id)
  saveNotes()
}

function cycleColor(note) {
  const idx = COLORS.indexOf(note.color)
  note.color = COLORS[(idx + 1) % COLORS.length]
  saveNotes()
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

onMounted(loadNotes)
</script>

<style scoped>
.notes-widget {
  max-height: 420px;
  display: flex;
  flex-direction: column;
}

.notes-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  flex: 1;
}

.note-card {
  background: rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  padding: 12px;
  border-left: 3px solid #6C63FF;
  transition: background 0.2s ease;
}

.note-card:hover {
  background: rgba(255, 255, 255, 0.07);
}

.note-textarea {
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  resize: none;
  color: rgba(255, 255, 255, 0.85);
  font-family: 'Inter', sans-serif;
  font-size: 0.85rem;
  line-height: 1.5;
}

.note-textarea::placeholder {
  color: rgba(255, 255, 255, 0.25);
}

.note-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 6px;
}

.note-date {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.3);
}

.note-actions {
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.note-card:hover .note-actions {
  opacity: 1;
}

.notes-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px 0;
}

.notes-empty p {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.3);
}
</style>
