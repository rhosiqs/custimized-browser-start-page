<template>
  <div class="glass-card widget-container weather-widget">
    <div class="widget-title">
      <v-icon>mdi-weather-partly-cloudy</v-icon>
      Weather
    </div>

    <!-- Loading State -->
    <div v-if="weather.loading" class="weather-loading">
      <v-progress-circular indeterminate color="primary" size="32" width="3" />
    </div>

    <!-- Error State -->
    <div v-else-if="weather.error" class="weather-error">
      <v-icon color="warning" size="28">mdi-alert-circle-outline</v-icon>
      <p>{{ weather.error }}</p>
      <v-btn size="small" variant="tonal" color="primary" @click="fetchWeather">
        Retry
      </v-btn>
    </div>

    <!-- Weather Data -->
    <div v-else class="weather-content">
      <div class="weather-current">
        <div class="weather-main">
          <v-icon :size="48" class="weather-icon">
            {{ getWeatherIcon(weather.current.weatherCode) }}
          </v-icon>
          <div class="weather-temp">
            {{ Math.round(weather.current.temp) }}°C
          </div>
        </div>
        <div class="weather-details">
          <div class="weather-description">
            {{ getWeatherDescription(weather.current.weatherCode) }}
          </div>
          <div class="weather-city" v-if="weather.city">
            <v-icon size="14">mdi-map-marker</v-icon>
            {{ weather.city }}
          </div>
          <div class="weather-meta">
            <span>
              <v-icon size="14">mdi-water-percent</v-icon>
              {{ weather.current.humidity }}%
            </span>
            <span>
              <v-icon size="14">mdi-weather-windy</v-icon>
              {{ weather.current.windSpeed }} km/h
            </span>
          </div>
        </div>
      </div>

      <!-- Daily Forecast -->
      <div class="weather-forecast" v-if="weather.daily.length">
        <div
          v-for="(day, idx) in weather.daily.slice(0, 5)"
          :key="idx"
          class="forecast-day"
        >
          <div class="forecast-label">{{ getDayLabel(idx) }}</div>
          <v-icon size="20">{{ getWeatherIcon(day.weatherCode) }}</v-icon>
          <div class="forecast-temps">
            <span class="temp-high">{{ Math.round(day.maxTemp) }}°</span>
            <span class="temp-low">{{ Math.round(day.minTemp) }}°</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useWeather } from '../../composables/useWeather.js'

const { weather, fetchWeather, getWeatherIcon, getWeatherDescription } = useWeather()

function getDayLabel(index) {
  if (index === 0) return 'Today'
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const date = new Date()
  date.setDate(date.getDate() + index)
  return days[date.getDay()]
}
</script>

<style scoped>
.weather-widget {
  min-height: 180px;
}

.weather-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 120px;
}

.weather-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
  padding: 16px 0;
}

.weather-error p {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
}

.weather-current {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 16px;
}

.weather-main {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.weather-icon {
  color: #FFC107;
  filter: drop-shadow(0 0 8px rgba(255, 193, 7, 0.4));
}

.weather-temp {
  font-size: 2rem;
  font-weight: 300;
  letter-spacing: -0.02em;
  line-height: 1;
}

.weather-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.weather-description {
  font-size: 0.95rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
}

.weather-city {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
  display: flex;
  align-items: center;
  gap: 4px;
}

.weather-meta {
  display: flex;
  gap: 14px;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 4px;
}

.weather-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.weather-forecast {
  display: flex;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.forecast-day {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex: 1;
}

.forecast-label {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(255, 255, 255, 0.45);
}

.forecast-temps {
  display: flex;
  gap: 4px;
  font-size: 0.75rem;
}

.temp-high {
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
}

.temp-low {
  color: rgba(255, 255, 255, 0.35);
}
</style>
