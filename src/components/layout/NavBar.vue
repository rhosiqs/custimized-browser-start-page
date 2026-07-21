<template>
  <v-app-bar
    class="navbar px-4"
    flat
    height="64"
    :style="{
      background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0) 100%)',
      backdropFilter: 'none',
      borderBottom: 'none',
    }"
  >
    <!-- Logo & Title -->
    <template #prepend>
      <div class="navbar-brand">
        <!-- Multicolored stack logo SVG matching BHE -->
        <svg class="brand-logo" width="36" height="36" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 4L4 12L20 20L36 12L20 4Z" fill="#4285F4"/>
          <path d="M4 12L20 20V36L4 28V12Z" fill="#EA4335"/>
          <path d="M36 12L20 20V36L36 28V12Z" fill="#FBBC05"/>
          <path d="M20 20L36 12V28L20 36V20Z" fill="#34A853" opacity="0.8"/>
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
          <v-icon size="20">mdi-weather-night</v-icon>
          <v-tooltip activator="parent" location="bottom">Toggle Theme</v-tooltip>
        </v-btn>

        <v-btn icon variant="text" size="small" class="nav-icon-btn">
          <v-icon size="20">mdi-calendar-month-outline</v-icon>
          <v-tooltip activator="parent" location="bottom">Calendar</v-tooltip>
        </v-btn>

        <v-btn
          icon
          variant="text"
          size="small"
          class="nav-icon-btn"
          @click="$emit('open-settings')"
        >
          <v-icon size="20">mdi-cog-outline</v-icon>
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
  gap: 12px;
  cursor: pointer;
}

.brand-logo {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.brand-title {
  font-size: 1.4rem;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -0.01em;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-make-homepage {
  font-weight: 700 !important;
  font-size: 0.75rem !important;
  letter-spacing: 0.04em !important;
  padding: 0 16px !important;
  height: 34px !important;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4) !important;
}

.btn-login {
  font-weight: 700 !important;
  font-size: 0.75rem !important;
  letter-spacing: 0.04em !important;
  border-color: rgba(255, 255, 255, 0.4) !important;
  height: 34px !important;
}

.nav-icon-btn {
  color: rgba(255, 255, 255, 0.85) !important;
}

.nav-icon-btn:hover {
  color: #ffffff !important;
}
</style>
