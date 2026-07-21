import { reactive, watch } from 'vue';
import axios from 'axios';
import { useSettings } from './useSettings';

// App-wide singleton reactive state
const news = reactive({
  articles: [],
  category: 'general',
  loading: false,
  error: null
});

let isInitialized = false;

export function useNews() {
  const { settings } = useSettings();

  const fetchNews = async (category = news.category) => {
    news.category = category;
    
    if (!settings.newsApiKey) {
      news.error = 'News API key is missing. Please configure it in settings.';
      news.articles = [];
      return;
    }

    news.loading = true;
    news.error = null;

    try {
      const response = await axios.get(
        `https://newsapi.org/v2/top-headlines?country=us&category=${category}&apiKey=${settings.newsApiKey}`
      );
      
      if (response.data && response.data.articles) {
        news.articles = response.data.articles.map(article => ({
          title: article.title,
          description: article.description,
          url: article.url,
          urlToImage: article.urlToImage,
          source: article.source?.name,
          publishedAt: article.publishedAt
        }));
      }
    } catch (err) {
      console.error('Error fetching news:', err);
      news.error = err.response?.data?.message || 'Failed to fetch news. Please check your API key and connection.';
      news.articles = [];
    } finally {
      news.loading = false;
    }
  };

  const changeCategory = (newCategory) => {
    fetchNews(newCategory);
  };

  // Initialize once
  if (!isInitialized) {
    // If the API key becomes available or changes, we can fetch news
    if (settings.newsApiKey) {
      fetchNews();
    }
    
    // Auto-fetch if key changes
    watch(() => settings.newsApiKey, (newKey) => {
      if (newKey) {
        fetchNews();
      } else {
        news.error = 'News API key is missing. Please configure it in settings.';
        news.articles = [];
      }
    });
    
    isInitialized = true;
  }

  return {
    news,
    fetchNews,
    changeCategory
  };
}
