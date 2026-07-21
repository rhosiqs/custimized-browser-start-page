<template>
  <div class="clock-widget">
    <div class="time-container">
      <span class="time-main">{{ formattedTimeOnly }}</span>
      <span class="time-ampm" v-if="ampmText">{{ ampmText }}</span>
    </div>
    <div class="date-display" v-if="settings.clock.showDate">{{ formattedDate }}</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useSettings } from '../../composables/useSettings.js'

const { settings } = useSettings()

const currentTime = ref(new Date())
let timer = null

onMounted(() => {
  timer = setInterval(() => {
    currentTime.value = new Date()
  }, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

const formattedTimeOnly = computed(() => {
  const is24h = settings.clock.format24h
  const showSec = settings.clock.showSeconds
  let hours = currentTime.value.getHours()
  const minutes = currentTime.value.getMinutes().toString().padStart(2, '0')
  const seconds = currentTime.value.getSeconds().toString().padStart(2, '0')

  if (!is24h) {
    hours = hours % 12 || 12
  }

  const h = hours.toString()
  return showSec ? `${h}:${minutes}:${seconds}` : `${h}:${minutes}`
})

const ampmText = computed(() => {
  if (settings.clock.format24h) return ''
  return currentTime.value.getHours() >= 12 ? 'PM' : 'AM'
})

const formattedDate = computed(() => {
  return currentTime.value.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
})
</script>

<style scoped>
.clock-widget {
  text-align: right;
  user-select: none;
  color: #ffffff;
  padding-right: 12px;
}

.time-container {
  display: flex;
  align-items: baseline;
  justify-content: flex-end;
  gap: 4px;
}

.time-main {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-weight: 300;
  font-size: 48px;
  line-height: 1;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
  letter-spacing: -0.02em;
}

.time-ampm {
  font-size: 18px;
  font-weight: 400;
  opacity: 0.9;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
}

.date-display {
  font-size: 0.85rem;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.85);
  margin-top: 2px;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);
}

@media (max-width: 768px) {
  .clock-widget {
    text-align: center;
    padding-right: 0;
  }
  .time-container {
    justify-content: center;
  }
  .time-main {
    font-size: 38px;
  }
}
</style>
