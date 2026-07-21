<template>
  <v-app-bar
    class="navbar"
    flat
    density="comfortable"
    :style="{
      background: 'rgba(255, 255, 255, 0.04)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
    }"
  >
    <template #prepend>
      <div class="navbar-brand">
        <v-icon class="brand-icon" size="28" color="#6C63FF">mdi-rocket-launch</v-icon>
        <span class="brand-text">StartPage</span>
      </div>
    </template>

    <v-spacer />

    <template #append>
      <v-btn
        icon
        variant="text"
        size="small"
        class="nav-btn"
        @click="$emit('open-settings')"
      >
        <v-icon size="22">mdi-cog-outline</v-icon>
        <v-tooltip activator="parent" location="bottom">Settings</v-tooltip>
      </v-btn>
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
  padding-left: 8px;
}

.brand-icon {
  filter: drop-shadow(0 0 8px rgba(108, 99, 255, 0.5));
}

.brand-text {
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, #6C63FF, #00D9FF);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.nav-btn {
  color: rgba(255, 255, 255, 0.6) !important;
  transition: color 0.2s ease;
}

.nav-btn:hover {
  color: rgba(255, 255, 255, 0.9) !important;
}
</style>
