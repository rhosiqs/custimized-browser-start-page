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
      <div class="navbar-brand">
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
        >
          MAKE THIS MY HOMEPAGE
        </v-btn>

        <v-btn
          class="btn-login"
          rounded="pill"
          size="small"
          variant="outlined"
          color="white"
        >
          <v-icon start size="16">mdi-logout-variant</v-icon>
          LOGIN
        </v-btn>

        <v-btn icon variant="text" size="small" class="nav-icon-btn">
          <v-icon size="18">mdi-weather-night</v-icon>
          <v-tooltip activator="parent" location="bottom">Dark Mode</v-tooltip>
        </v-btn>

        <v-btn icon variant="text" size="small" class="nav-icon-btn">
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
</template>

<script setup>
defineEmits(['open-settings'])
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
</style>
