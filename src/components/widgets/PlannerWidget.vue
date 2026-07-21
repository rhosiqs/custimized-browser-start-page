<template>
  <div class="glass-card widget-container planner-widget">
    <div class="widget-title">
      <v-icon>mdi-clipboard-check-outline</v-icon>
      Planner
      <v-spacer />
      <v-chip size="x-small" variant="tonal" color="primary" v-if="completedCount > 0">
        {{ completedCount }}/{{ tasks.length }}
      </v-chip>
    </div>

    <!-- Add Task -->
    <div class="add-task">
      <v-text-field
        v-model="newTask"
        placeholder="Add a task..."
        variant="plain"
        density="compact"
        hide-details
        class="task-input"
        @keydown.enter="addTask"
      >
        <template #prepend-inner>
          <v-icon size="18" color="rgba(255,255,255,0.3)">mdi-plus-circle-outline</v-icon>
        </template>
      </v-text-field>
    </div>

    <!-- Tasks List -->
    <div class="tasks-list" v-if="tasks.length">
      <TransitionGroup name="task-list">
        <div
          v-for="task in sortedTasks"
          :key="task.id"
          class="task-item"
          :class="{ completed: task.done }"
        >
          <v-checkbox
            v-model="task.done"
            hide-details
            density="compact"
            color="primary"
            class="task-checkbox"
            @update:modelValue="saveTasks"
          />
          <span class="task-text">{{ task.text }}</span>
          <v-btn
            icon
            variant="text"
            size="x-small"
            class="task-delete"
            @click="removeTask(task.id)"
          >
            <v-icon size="14">mdi-close</v-icon>
          </v-btn>
        </div>
      </TransitionGroup>

      <!-- Clear completed -->
      <v-btn
        v-if="completedCount > 0"
        variant="text"
        size="small"
        color="error"
        class="clear-btn"
        @click="clearCompleted"
      >
        <v-icon size="16" start>mdi-delete-outline</v-icon>
        Clear completed
      </v-btn>
    </div>

    <div v-else class="tasks-empty">
      <v-icon size="32" color="rgba(255,255,255,0.15)">mdi-clipboard-outline</v-icon>
      <p>No tasks yet</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const STORAGE_KEY = 'BHE_PLANNER'

const tasks = ref([])
const newTask = ref('')

const sortedTasks = computed(() => {
  return [...tasks.value].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1
    return b.createdAt - a.createdAt
  })
})

const completedCount = computed(() => tasks.value.filter(t => t.done).length)

function loadTasks() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (data) tasks.value = JSON.parse(data)
  } catch (e) {
    // ignore
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks.value))
}

function addTask() {
  const text = newTask.value.trim()
  if (!text) return

  tasks.value.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    text,
    done: false,
    createdAt: Date.now(),
  })
  newTask.value = ''
  saveTasks()
}

function removeTask(id) {
  tasks.value = tasks.value.filter(t => t.id !== id)
  saveTasks()
}

function clearCompleted() {
  tasks.value = tasks.value.filter(t => !t.done)
  saveTasks()
}

onMounted(loadTasks)
</script>

<style scoped>
.planner-widget {
  max-height: 420px;
  display: flex;
  flex-direction: column;
}

.add-task {
  margin-bottom: 12px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  padding: 4px 8px;
}

.task-input {
  font-size: 0.85rem;
}

.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
  flex: 1;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.task-item:hover {
  background: rgba(255, 255, 255, 0.04);
}

.task-checkbox {
  flex-shrink: 0;
}

.task-text {
  flex: 1;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.85);
  transition: all 0.3s ease;
}

.task-item.completed .task-text {
  text-decoration: line-through;
  color: rgba(255, 255, 255, 0.3);
}

.task-delete {
  opacity: 0;
  transition: opacity 0.2s ease;
}

.task-item:hover .task-delete {
  opacity: 1;
}

.clear-btn {
  margin-top: 8px;
  align-self: center;
}

.tasks-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px 0;
}

.tasks-empty p {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.3);
}

/* Transition */
.task-list-enter-active,
.task-list-leave-active {
  transition: all 0.3s ease;
}

.task-list-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.task-list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>
