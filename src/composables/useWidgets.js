import { ref, watch } from 'vue';

const STORAGE_KEY = 'BHE_WIDGETS';

const DEFAULT_BOOKMARKS = [
  { id: '1', name: 'Google', url: 'https://google.com', icon: 'mdi-google', category: 'General' },
  { id: '2', name: 'YouTube', url: 'https://youtube.com', icon: 'mdi-youtube', category: 'Media' },
  { id: '3', name: 'Gmail', url: 'https://mail.google.com', icon: 'mdi-gmail', category: 'General' },
  { id: '4', name: 'Reddit', url: 'https://reddit.com', icon: 'mdi-reddit', category: 'Social' },
  { id: '5', name: 'GitHub', url: 'https://github.com', icon: 'mdi-github', category: 'Development' },
  { id: '6', name: 'Twitter', url: 'https://twitter.com', icon: 'mdi-twitter', category: 'Social' },
  { id: '7', name: 'Wikipedia', url: 'https://wikipedia.org', icon: 'mdi-wikipedia', category: 'General' },
  { id: '8', name: 'Amazon', url: 'https://amazon.com', icon: 'mdi-shopping', category: 'Shopping' }
];

// App-wide singleton ref state
const bookmarks = ref([]);
let isInitialized = false;

export function useWidgets() {
  const loadBookmarks = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        bookmarks.value = JSON.parse(stored);
      } else {
        bookmarks.value = JSON.parse(JSON.stringify(DEFAULT_BOOKMARKS));
      }
    } catch (e) {
      console.error('Failed to load bookmarks from localStorage', e);
      bookmarks.value = JSON.parse(JSON.stringify(DEFAULT_BOOKMARKS));
    }
  };

  const saveBookmarks = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks.value));
    } catch (e) {
      console.error('Failed to save bookmarks to localStorage', e);
    }
  };

  const addBookmark = ({ name, url, icon, category }) => {
    const id = Date.now().toString();
    bookmarks.value.push({ id, name, url, icon, category });
  };

  const removeBookmark = (id) => {
    bookmarks.value = bookmarks.value.filter(b => b.id !== id);
  };

  const updateBookmark = (id, updates) => {
    const index = bookmarks.value.findIndex(b => b.id === id);
    if (index !== -1) {
      bookmarks.value[index] = { ...bookmarks.value[index], ...updates };
    }
  };

  const getBookmarksByCategory = (category) => {
    return bookmarks.value.filter(b => b.category === category);
  };

  // Initialize once
  if (!isInitialized) {
    loadBookmarks();
    watch(bookmarks, () => {
      saveBookmarks();
    }, { deep: true });
    isInitialized = true;
  }

  return {
    bookmarks,
    addBookmark,
    removeBookmark,
    updateBookmark,
    getBookmarksByCategory
  };
}
