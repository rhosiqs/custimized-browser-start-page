<template>
  <div class="bottom-dock-bar">
    <!-- Left Tool Icons -->
    <div class="dock-left-tools">
      <button class="tool-btn" title="Tools"><v-icon size="18">mdi-wrench-outline</v-icon></button>
      <button class="tool-btn" title="Folder"><v-icon size="18">mdi-folder-outline</v-icon></button>
      <button class="tool-btn" title="Chat"><v-icon size="18">mdi-message-outline</v-icon></button>
      <button class="tool-btn" title="Google"><v-icon size="18">mdi-google</v-icon></button>
      <button class="tool-btn" title="Travel"><v-icon size="18">mdi-airplane</v-icon></button>
      <button class="tool-btn" title="Finance"><v-icon size="18">mdi-currency-usd</v-icon></button>
      <button class="tool-btn" title="Shopping"><v-icon size="18">mdi-cart-outline</v-icon></button>
    </div>

    <!-- Right Feature Pills & Utility Icons -->
    <div class="dock-right-pills">
      <button class="dock-pill" @click="$emit('open-modal', 'snippets')">SNIPPETS</button>
      <button class="dock-pill" @click="$emit('open-modal', 'notes')">NOTES</button>
      <button class="dock-pill" @click="$emit('open-modal', 'planner')">PLANNER</button>
      <button class="dock-pill highlight-pill" @click="$emit('open-modal', 'dailyBrief')">DAILY BRIEF</button>
      <button class="dock-link">DISCLOSURES</button>

      <div class="util-icons">
        <button class="tool-btn"><v-icon size="16">mdi-share-variant-outline</v-icon></button>
        <button class="tool-btn"><v-icon size="16">mdi-bullhorn-outline</v-icon></button>
        <button class="tool-btn"><v-icon size="16">mdi-help-circle-outline</v-icon></button>
        <button class="tool-btn"><v-icon size="16">mdi-dots-vertical</v-icon></button>
      </div>
    </div>

    <!-- Floating FAB plus button in bottom right -->
    <button class="fab-btn" title="Add" @click="$emit('open-modal', 'add')">
      <v-icon color="white" size="24">mdi-plus</v-icon>
    </button>
  </div>
</template>

<script setup>
defineEmits(['open-modal'])
</script>

<style scoped>
.bottom-dock-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 48px;
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  z-index: 90;
}

.dock-left-tools {
  display: flex;
  align-items: center;
  gap: 14px;
}

.tool-btn {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.tool-btn:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.15);
}

.dock-right-pills {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dock-pill {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 9999px;
  padding: 4px 14px;
  font-size: 0.72rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  letter-spacing: 0.05em;
  transition: all 0.15s ease;
}

.dock-pill:hover {
  background: rgba(255, 255, 255, 0.25);
  color: #ffffff;
}

.highlight-pill {
  border-color: rgba(249, 115, 22, 0.6);
  color: #fb923c;
}

.highlight-pill:hover {
  background: rgba(249, 115, 22, 0.2);
  color: #fdba74;
}

.dock-link {
  background: transparent;
  border: none;
  font-size: 0.7rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  letter-spacing: 0.04em;
  margin-right: 6px;
}

.dock-link:hover {
  color: #ffffff;
}

.util-icons {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* FAB button */
.fab-btn {
  position: absolute;
  right: 24px;
  bottom: 24px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #3b82f6;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.5);
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.fab-btn:hover {
  transform: scale(1.1);
  background: #2563eb;
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.6);
}
</style>
