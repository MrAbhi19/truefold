// RSS feed URLs
const feeds = {
  tech: 'https://techcrunch.com/feed/',
  general: 'https://feeds.bbci.co.uk/news/rss.xml',
  finance: 'http://rss.cnn.com/rss/edition_business.rss'
};

// Use a free RSS-to-JSON proxy (rss2json.com)
function getRssJsonUrl(rssUrl) {
  return `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
}

const leftColumn = document.getElementById('leftColumn'); // Tech
const centerColumn = document.getElementById('centerColumn'); // BBC
const rightColumn = document.getElementById('rightColumn'); // CNN

function extractImage(article) {
  // Try media:content, enclosure, thumbnail, or first image in description
  if (article['media:content'] && article['media:content'].url) return article['media:content'].url;
  if (article.enclosure && article.enclosure.link) return article.enclosure.link;
  if (article.thumbnail) return article.thumbnail;
  // Try to extract first image from description
  if (article.description) {
    const match = article.description.match(/<img[^>]+src=["']([^"'>]+)["']/i);
    if (match && match[1]) return match[1];
  }
  return 'https://via.placeholder.com/300x160?text=No+Image';
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date)) return '';
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

function createNewsCard(article, sourceName, showImage = true) {
  const card = document.createElement('div');
  card.className = 'news-card';
  card.innerHTML = `
    ${showImage ? `<img src="${extractImage(article)}" alt="news image" />` : ''}
    <h3><a href="${article.link}" target="_blank" rel="noopener noreferrer">${article.title}</a></h3>
    <p>${article.description ? article.description.replace(/<[^>]+>/g, '').slice(0, 120) + '...' : ''}</p>
    <div style="color:#888; font-size:0.95em; margin-bottom:0.2em;">${formatDate(article.pubDate)}</div>
    <small>Source: <a href="${article.link}" target="_blank">${sourceName}</a></small>
  `;
  return card;
}

// Infinite scroll state
let techIndex = 0;
let generalIndex = 0;
let financeIndex = 0;
let techItems = [];
let generalItems = [];
let financeItems = [];
const PAGE_SIZE = 6;

async function fetchFeedItems(rssUrl) {
  const res = await fetch(getRssJsonUrl(rssUrl));
  const data = await res.json();
  return data.items || [];
}

async function loadMore(column, items, index, sourceName, setIndex, pageSize = PAGE_SIZE, showImage = true) {
  const nextItems = items.slice(index, index + pageSize);
  nextItems.forEach(article => {
    column.appendChild(createNewsCard(article, sourceName, showImage));
  });
  setIndex(index + pageSize);
}

async function setupInfiniteScroll(column, items, index, sourceName, setIndex, fetchItems, showImage = true) {
  // Initial load
  await loadMore(column, items, index, sourceName, setIndex, PAGE_SIZE, showImage);
  column.addEventListener('scroll', async function onScroll() {
    if (column.scrollTop + column.clientHeight >= column.scrollHeight - 10) {
      if (index < items.length) {
        await loadMore(column, items, index, sourceName, setIndex, PAGE_SIZE, showImage);
      }
    }
  });
}

async function fetchAllFeedsInfinite() {
  leftColumn.innerHTML = '<p>Loading...</p>';
  centerColumn.innerHTML = '<p>Loading...</p>';
  rightColumn.innerHTML = '<p>Loading...</p>';
  techItems = await fetchFeedItems(feeds.tech);
  generalItems = await fetchFeedItems(feeds.general);
  financeItems = await fetchFeedItems(feeds.finance);
  techIndex = 0;
  generalIndex = 0;
  financeIndex = 0;
  leftColumn.innerHTML = '';
  centerColumn.innerHTML = '';
  rightColumn.innerHTML = '';
  setupInfiniteScroll(leftColumn, techItems, techIndex, 'TechCrunch', i => techIndex = i, fetchFeedItems, false);
  setupInfiniteScroll(centerColumn, generalItems, generalIndex, 'BBC News', i => generalIndex = i, fetchFeedItems, true);
  setupInfiniteScroll(rightColumn, financeItems, financeIndex, 'CNN Business', i => financeIndex = i, fetchFeedItems, false);
}

fetchAllFeedsInfinite();

// Category selector can be disabled or repurposed for RSS feeds if needed
const categoryBtn = document.getElementById('categoryBtn');
categoryBtn.addEventListener('click', () => {
  alert('Category selection is not available for RSS feeds.');
}); 