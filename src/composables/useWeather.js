import { reactive } from 'vue';
import axios from 'axios';

// App-wide singleton reactive state
const weather = reactive({
  current: {
    temp: null,
    humidity: null,
    windSpeed: null,
    weatherCode: null,
    description: '',
    icon: ''
  },
  daily: [],
  city: '',
  loading: false,
  error: null
});

let isInitialized = false;
const DEFAULT_LOCATION = { lat: 25.0330, lon: 121.5654 }; // Taipei

export function useWeather() {
  const getWeatherIcon = (code) => {
    if (code === 0) return 'mdi-weather-sunny';
    if (code >= 1 && code <= 3) return 'mdi-weather-partly-cloudy';
    if (code === 45 || code === 48) return 'mdi-weather-fog';
    if (code >= 51 && code <= 55) return 'mdi-weather-partly-rainy';
    if (code >= 61 && code <= 65) return 'mdi-weather-rainy';
    if (code >= 71 && code <= 75) return 'mdi-weather-snowy';
    if (code >= 80 && code <= 82) return 'mdi-weather-pouring';
    if (code >= 95 && code <= 99) return 'mdi-weather-lightning';
    return 'mdi-weather-cloudy'; // Fallback
  };

  const getWeatherDescription = (code) => {
    if (code === 0) return 'Clear sky';
    if (code >= 1 && code <= 3) return 'Partly cloudy';
    if (code === 45 || code === 48) return 'Foggy';
    if (code >= 51 && code <= 55) return 'Drizzle';
    if (code >= 61 && code <= 65) return 'Rain';
    if (code >= 71 && code <= 75) return 'Snow';
    if (code >= 80 && code <= 82) return 'Showers';
    if (code >= 95 && code <= 99) return 'Thunderstorm';
    return 'Unknown'; // Fallback
  };

  const fetchCityName = async (lat, lon) => {
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
      );
      if (response.data && response.data.address) {
        const address = response.data.address;
        weather.city = address.city || address.town || address.village || address.country || 'Unknown Location';
      }
    } catch (err) {
      console.error('Error fetching city name:', err);
      weather.city = 'Unknown Location';
    }
  };

  const fetchWeatherData = async (lat, lon) => {
    weather.loading = true;
    weather.error = null;
    try {
      const response = await axios.get(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto`
      );
      
      const data = response.data;
      const currentCode = data.current.weather_code;
      
      weather.current = {
        temp: data.current.temperature_2m,
        humidity: data.current.relative_humidity_2m,
        windSpeed: data.current.wind_speed_10m,
        weatherCode: currentCode,
        description: getWeatherDescription(currentCode),
        icon: getWeatherIcon(currentCode)
      };

      weather.daily = data.daily.time.map((time, index) => {
        const code = data.daily.weather_code[index];
        return {
          date: time,
          maxTemp: data.daily.temperature_2m_max[index],
          minTemp: data.daily.temperature_2m_min[index],
          weatherCode: code,
          description: getWeatherDescription(code),
          icon: getWeatherIcon(code)
        };
      });

      // Reverse geocoding for city name
      await fetchCityName(lat, lon);
    } catch (err) {
      console.error('Error fetching weather data:', err);
      weather.error = 'Failed to load weather data.';
    } finally {
      weather.loading = false;
    }
  };

  const fetchWeather = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeatherData(position.coords.latitude, position.coords.longitude);
        },
        (err) => {
          console.warn('Geolocation denied or failed. Using default location.', err);
          fetchWeatherData(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lon);
        }
      );
    } else {
      console.warn('Geolocation not supported by browser. Using default location.');
      fetchWeatherData(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lon);
    }
  };

  // Initialize once
  if (!isInitialized) {
    fetchWeather();
    isInitialized = true;
  }

  return {
    weather,
    fetchWeather,
    getWeatherIcon,
    getWeatherDescription
  };
}
