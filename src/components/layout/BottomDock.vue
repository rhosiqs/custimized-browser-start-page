<template>
  <div class="bottom-dock-bar">
    <!-- Left Tool Icons with Hover Popout Flyouts -->
    <div class="dock-left-tools">
      <div
        v-for="tool in tools"
        :key="tool.id"
        class="tool-item-wrapper"
        @mouseenter="activeTool = tool.id"
        @mouseleave="activeTool = null"
      >
        <!-- Flyout Menu Popup -->
        <Transition name="flyout">
          <div v-if="activeTool === tool.id" class="flyout-menu">
            <div class="flyout-header">
              <v-icon size="16" :color="tool.iconColor">{{ tool.icon }}</v-icon>
              <span>{{ tool.title }}</span>
            </div>
            <div class="flyout-grid">
              <a
                v-for="link in tool.links"
                :key="link.name"
                :href="link.url"
                target="_blank"
                rel="noopener"
                class="flyout-link"
              >
                <v-icon size="16" class="link-icon">{{ link.icon || 'mdi-open-in-new' }}</v-icon>
                <span>{{ link.name }}</span>
              </a>
            </div>
          </div>
        </Transition>

        <!-- Tool Button Icon -->
        <button class="tool-btn" :class="{ active: activeTool === tool.id }">
          <v-icon size="18">{{ tool.icon }}</v-icon>
        </button>
      </div>
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
import { ref } from 'vue'

defineEmits(['open-modal'])

const activeTool = ref(null)

const tools = [
  {
    id: 'tools',
    title: 'Utilities & Tools',
    icon: 'mdi-wrench-outline',
    iconColor: '#3b82f6',
    links: [
      { name: 'Calculator', icon: 'mdi-calculator', url: 'https://www.google.com/search?q=calculator' },
      { name: 'Speed Test', icon: 'mdi-speedometer', url: 'https://fast.com' },
      { name: 'Translate', icon: 'mdi-translate', url: 'https://translate.google.com' },
      { name: 'Unit Converter', icon: 'mdi-swap-vertical', url: 'https://www.google.com/search?q=unit+converter' },
      { name: 'Notepad', icon: 'mdi-note-edit-outline', url: 'https://editpad.org' },
      { name: 'Timer', icon: 'mdi-timer-outline', url: 'https://timer.onlineclock.net' },
    ]
  },
  {
    id: 'folder',
    title: 'Categories & Folders',
    icon: 'mdi-folder-outline',
    iconColor: '#f59e0b',
    links: [
      { name: 'Favorites', icon: 'mdi-star-outline', url: '#' },
      { name: 'Social', icon: 'mdi-account-group-outline', url: '#' },
      { name: 'Media & Streaming', icon: 'mdi-play-circle-outline', url: '#' },
      { name: 'Shopping', icon: 'mdi-shopping-outline', url: '#' },
      { name: 'Work & Tools', icon: 'mdi-briefcase-outline', url: '#' },
      { name: 'News & Media', icon: 'mdi-newspaper', url: '#' },
    ]
  },
  {
    id: 'chat',
    title: 'Social & Chat',
    icon: 'mdi-message-outline',
    iconColor: '#8b5cf6',
    links: [
      { name: 'Discord', icon: 'mdi-discord', url: 'https://discord.com' },
      { name: 'WhatsApp', icon: 'mdi-whatsapp', url: 'https://web.whatsapp.com' },
      { name: 'Telegram', icon: 'mdi-paper-plane-outline', url: 'https://web.telegram.org' },
      { name: 'Reddit', icon: 'mdi-reddit', url: 'https://reddit.com' },
      { name: 'Twitter / X', icon: 'mdi-twitter', url: 'https://twitter.com' },
      { name: 'Instagram', icon: 'mdi-instagram', url: 'https://instagram.com' },
    ]
  },
  {
    id: 'google',
    title: 'Google Apps',
    icon: 'mdi-google',
    iconColor: '#4285F4',
    links: [
      { name: 'Google Drive', icon: 'mdi-folder-google-drive', url: 'https://drive.google.com' },
      { name: 'Google Docs', icon: 'mdi-file-document-outline', url: 'https://docs.google.com' },
      { name: 'Google Sheets', icon: 'mdi-file-table-outline', url: 'https://sheets.google.com' },
      { name: 'Google Maps', icon: 'mdi-map-marker', url: 'https://maps.google.com' },
      { name: 'Google Photos', icon: 'mdi-image-outline', url: 'https://photos.google.com' },
      { name: 'Gmail', icon: 'mdi-email-outline', url: 'https://mail.google.com' },
    ]
  },
  {
    id: 'travel',
    title: 'Travel & Flights',
    icon: 'mdi-airplane',
    iconColor: '#06b6d4',
    links: [
      { name: 'Google Flights', icon: 'mdi-airplane-takeoff', url: 'https://www.google.com/travel/flights' },
      { name: 'Airbnb', icon: 'mdi-home-city-outline', url: 'https://airbnb.com' },
      { name: 'Booking.com', icon: 'mdi-bed-outline', url: 'https://booking.com' },
      { name: 'Kayak', icon: 'mdi-compass-outline', url: 'https://kayak.com' },
      { name: 'Expedia', icon: 'mdi-bag-suitcase-outline', url: 'https://expedia.com' },
      { name: 'TripAdvisor', icon: 'mdi-map-outline', url: 'https://tripadvisor.com' },
    ]
  },
  {
    id: 'finance',
    title: 'Finance & Markets',
    icon: 'mdi-currency-usd',
    iconColor: '#10b981',
    links: [
      { name: 'Yahoo Finance', icon: 'mdi-chart-line', url: 'https://finance.yahoo.com' },
      { name: 'CoinMarketCap', icon: 'mdi-bitcoin', url: 'https://coinmarketcap.com' },
      { name: 'MarketWatch', icon: 'mdi-finance', url: 'https://marketwatch.com' },
      { name: 'Robinhood', icon: 'mdi-cash-multiple', url: 'https://robinhood.com' },
      { name: 'Bloomberg', icon: 'mdi-newspaper-variant', url: 'https://bloomberg.com' },
      { name: 'TradingView', icon: 'mdi-chart-candlestick', url: 'https://tradingview.com' },
    ]
  },
  {
    id: 'shop',
    title: 'Shopping',
    icon: 'mdi-cart-outline',
    iconColor: '#f97316',
    links: [
      { name: 'Amazon', icon: 'mdi-cart', url: 'https://amazon.com' },
      { name: 'eBay', icon: 'mdi-tag-outline', url: 'https://ebay.com' },
      { name: 'Walmart', icon: 'mdi-store-outline', url: 'https://walmart.com' },
      { name: 'Target', icon: 'mdi-target', url: 'https://target.com' },
      { name: 'AliExpress', icon: 'mdi-package-variant', url: 'https://aliexpress.com' },
      { name: 'Etsy', icon: 'mdi-palette-outline', url: 'https://etsy.com' },
    ]
  }
]
</script>

<style scoped>
.bottom-dock-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 48px;
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-top: 1px solid rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  z-index: 90;
}

.dock-left-tools {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tool-item-wrapper {
  position: relative;
}

.tool-btn {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  padding: 6px 8px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.tool-btn:hover,
.tool-btn.active {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.18);
}

/* Hover Flyout Popup Card */
.flyout-menu {
  position: absolute;
  bottom: 54px;
  left: 0;
  min-width: 220px;
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 14px;
  padding: 12px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5);
  z-index: 100;
  pointer-events: auto;
}

.flyout-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(255, 255, 255, 0.9);
  padding-bottom: 8px;
  margin-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.flyout-grid {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.flyout-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 8px;
  border-radius: 8px;
  text-decoration: none;
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.82rem;
  transition: all 0.15s ease;
}

.flyout-link:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
  transform: translateX(2px);
}

.link-icon {
  color: rgba(255, 255, 255, 0.6);
}

.flyout-link:hover .link-icon {
  color: #3b82f6;
}

/* Flyout Transitions */
.flyout-enter-active,
.flyout-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.flyout-enter-from,
.flyout-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.95);
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
  gap: 4px;
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
