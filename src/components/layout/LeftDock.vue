<template>
  <div class="left-dock">
    <button
      class="dock-circle-btn bg-pink"
      title="Maps"
      @click="$emit('open-modal', 'maps')"
    >
      <v-icon color="white" size="22">mdi-map-marker-outline</v-icon>
    </button>

    <button
      class="dock-circle-btn bg-yellow"
      title="Weather"
      @click="$emit('open-modal', 'weather')"
    >
      <v-icon color="#333333" size="22">mdi-weather-sunny</v-icon>
    </button>

    <button
      class="dock-circle-btn bg-green"
      title="News"
      @click="$emit('open-modal', 'news')"
    >
      <v-icon color="white" size="22">mdi-newspaper-variant-outline</v-icon>
    </button>
  </div>
</template>

<script setup>
defineEmits(['open-modal'])
</script>

<style scoped>
.left-dock {
  position: fixed;
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 16px;
  z-index: 90;
}

.dock-circle-btn {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3);
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.dock-circle-btn:hover {
  transform: scale(1.12);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
}

.bg-pink {
  background: #ff6b6b;
}

.bg-yellow {
  background: #fde047;
}

.bg-green {
  background: #4ade80;
}
</style>
