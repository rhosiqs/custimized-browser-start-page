<template>
  <v-app-bar
    class="navbar px-4"
    flat
    height="56"
    :style="{
      background: 'transparent',
      backdropFilter: 'none',
      boxShadow: 'none',
    }"
  >
    <!-- Logo & Title -->
    <template #prepend>
      <div class="navbar-brand" @click="$emit('go-home')">
        <!-- 3D Multicolored stack cube logo SVG -->
        <svg class="brand-logo" width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 4L4 12L20 20L36 12L20 4Z" fill="#4285F4"/>
          <path d="M4 12L20 20V36L4 28V12Z" fill="#EA4335"/>
          <path d="M36 12L20 20V36L36 28V12Z" fill="#FBBC05"/>
          <path d="M20 20L36 12V28L20 36V20Z" fill="#34A853" opacity="0.85"/>
        </svg>
        <span class="brand-title">Best Homepage Ever</span>
      </div>
    </template>

    <v-spacer />

    <!-- Top Right Actions -->
    <template #append>
      <div class="nav-actions">
        <v-btn
          class="btn-make-homepage"
          rounded="pill"
          size="small"
          color="#3b82f6"
          variant="flat"
          @click="showHomepageGuide = true"
        >
          MAKE THIS MY HOMEPAGE
        </v-btn>

        <v-btn
          class="btn-login"
          rounded="pill"
          size="small"
          variant="outlined"
          color="white"
          @click="showLoginModal = true"
        >
          <v-icon start size="16">mdi-account-outline</v-icon>
          LOGIN
        </v-btn>

        <v-btn
          icon
          variant="text"
          size="small"
          class="nav-icon-btn"
          @click="toggleThemeMode"
        >
          <v-icon size="18">{{ isDark ? 'mdi-weather-night' : 'mdi-white-balance-sunny' }}</v-icon>
          <v-tooltip activator="parent" location="bottom">Toggle Theme</v-tooltip>
        </v-btn>

        <v-btn
          icon
          variant="text"
          size="small"
          class="nav-icon-btn"
          @click="$emit('open-modal', 'planner')"
        >
          <v-icon size="18">mdi-calendar-month-outline</v-icon>
          <v-tooltip activator="parent" location="bottom">Calendar</v-tooltip>
        </v-btn>

        <v-btn
          icon
          variant="text"
          size="small"
          class="nav-icon-btn"
          @click="$emit('open-settings')"
        >
          <v-icon size="18">mdi-cog-outline</v-icon>
          <v-tooltip activator="parent" location="bottom">Settings</v-tooltip>
        </v-btn>
      </div>
    </template>
  </v-app-bar>

  <!-- Make Homepage Instructions Dialog -->
  <v-dialog v-model="showHomepageGuide" max-width="480">
    <v-card rounded="xl" class="guide-dialog px-2 py-2">
      <v-card-title class="d-flex justify-space-between align-center px-4 pt-3">
        <span class="font-weight-bold text-h6 text-white">Make This Your Homepage</span>
        <v-btn icon variant="text" size="small" @click="showHomepageGuide = false">
          <v-icon color="white">mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-card-text class="px-4 text-body-2 text-grey-lighten-2">
        <p class="mb-3">To set this page as your default start page or new tab:</p>
        <ol class="pl-4 mb-4">
          <li class="mb-2">Copy the page URL: <code class="bg-grey-darken-3 px-2 py-1 rounded">http://localhost:5173</code></li>
          <li class="mb-2">Open your browser settings (Chrome/Edge/Firefox).</li>
          <li class="mb-2">Go to <b>On Startup</b> or <b>New Tab Page</b> settings.</li>
          <li>Select <b>Open a specific page</b> and paste the URL.</li>
        </ol>
      </v-card-text>
      <v-card-actions class="px-4 pb-3 justify-end">
        <v-btn color="primary" variant="flat" rounded="lg" @click="copyUrl">
          <v-icon start size="16">mdi-content-copy</v-icon>
          Copy URL
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Login Modal Dialog -->
  <v-dialog v-model="showLoginModal" max-width="400">
    <v-card rounded="xl" class="guide-dialog px-2 py-2">
      <v-card-title class="d-flex justify-space-between align-center px-4 pt-3">
        <span class="font-weight-bold text-h6 text-white">Sign In</span>
        <v-btn icon variant="text" size="small" @click="showLoginModal = false">
          <v-icon color="white">mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-card-text class="px-4 pt-2">
        <v-text-field
          v-model="loginEmail"
          label="Email Address"
          variant="outlined"
          rounded="lg"
          density="comfortable"
          hide-details
          class="mb-3"
        />
        <v-text-field
          v-model="loginPassword"
          label="Password"
          type="password"
          variant="outlined"
          rounded="lg"
          density="comfortable"
          hide-details
          class="mb-4"
        />
        <v-btn block color="primary" size="large" rounded="lg" class="mb-3" @click="doLogin">
          Sign In
        </v-btn>
        <v-btn block variant="outlined" color="white" rounded="lg" @click="showLoginModal = false">
          Continue as Guest
        </v-btn>
      </v-card-text>
    </v-card>
  </v-dialog>

  <!-- Snackbar Notification -->
  <v-snackbar v-model="snackbar.show" :timeout="2500" color="success" rounded="pill">
    {{ snackbar.text }}
  </v-snackbar>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useSettings } from '../../composables/useSettings.js'

defineEmits(['open-settings', 'open-modal', 'go-home'])

const { settings, updateSettings } = useSettings()

const showHomepageGuide = ref(false)
const showLoginModal = ref(false)
const loginEmail = ref('')
const loginPassword = ref('')
const isDark = ref(true)

const snackbar = reactive({
  show: false,
  text: '',
})

function toggleThemeMode() {
  isDark.value = !isDark.value
  const newBg = isDark.value ? '#0a0a1a' : '#f8fafc'
  updateSettings('background', { type: 'color', value: newBg })
  snackbar.text = isDark.value ? 'Switched to Dark Mode' : 'Switched to Light Mode'
  snackbar.show = true
}

function copyUrl() {
  navigator.clipboard.writeText(window.location.href)
  snackbar.text = 'URL copied to clipboard!'
  snackbar.show = true
  showHomepageGuide.value = false
}

function doLogin() {
  if (!loginEmail.value) return
  snackbar.text = `Welcome back, ${loginEmail.value}!`
  snackbar.show = true
  showLoginModal.value = false
}
</script>

<style scoped>
.navbar {
  z-index: 100;
}

.navbar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding-left: 4px;
}

.brand-logo {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4));
}

.brand-title {
  font-size: 1.35rem;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -0.01em;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-make-homepage {
  font-weight: 700 !important;
  font-size: 0.72rem !important;
  letter-spacing: 0.04em !important;
  padding: 0 14px !important;
  height: 32px !important;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4) !important;
}

.btn-login {
  font-weight: 700 !important;
  font-size: 0.72rem !important;
  letter-spacing: 0.04em !important;
  border-color: rgba(255, 255, 255, 0.4) !important;
  height: 32px !important;
}

.nav-icon-btn {
  color: rgba(255, 255, 255, 0.85) !important;
}

.nav-icon-btn:hover {
  color: #ffffff !important;
}

.guide-dialog {
  background: rgba(15, 23, 42, 0.98) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.15);
}
</style>
