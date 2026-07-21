<template>
  <div class="clock-widget">
    <div class="greeting">{{ greeting }}</div>
    <div class="time-display">{{ formattedTime }}</div>
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

const formattedTime = computed(() => {
  const is24h = settings.clock.format24h
  const showSec = settings.clock.showSeconds
  let hours = currentTime.value.getHours()
  const minutes = currentTime.value.getMinutes().toString().padStart(2, '0')
  const seconds = currentTime.value.getSeconds().toString().padStart(2, '0')

  let suffix = ''
  if (!is24h) {
    suffix = hours >= 12 ? ' PM' : ' AM'
    hours = hours % 12 || 12
  }

  const h = hours.toString().padStart(2, '0')
  return showSec ? `${h}:${minutes}:${seconds}${suffix}` : `${h}:${minutes}${suffix}`
})

const formattedDate = computed(() => {
  return currentTime.value.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
})

const greeting = computed(() => {
  const hour = currentTime.value.getHours()
  if (hour >= 5 && hour < 12) return 'Good Morning'
  if (hour >= 12 && hour < 18) return 'Good Afternoon'
  return 'Good Evening'
})
</script>

<style scoped>
.clock-widget {
  text-align: center;
  padding: 16px 24px;
  user-select: none;
}

.greeting {
  font-size: 1.2rem;
  font-weight: 300;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 4px;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.15);
}

.time-display {
  font-family: 'Inter', sans-serif;
  font-weight: 200;
  font-size: 72px;
  line-height: 1;
  color: #fff;
  text-shadow: 0 0 30px rgba(255, 255, 255, 0.2), 0 0 60px rgba(108, 99, 255, 0.15);
  letter-spacing: -0.02em;
}

.date-display {
  font-size: 0.95rem;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.55);
  margin-top: 8px;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.1);
}

@media (max-width: 600px) {
  .time-display {
    font-size: 48px;
  }
}
</style>
