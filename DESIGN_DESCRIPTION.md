# 🎨 Social Intelligence Hub - Design Description

## Overall Architecture
A modern **full-stack social media analytics dashboard** built with:
- **Frontend:** React + TypeScript + Vite with Recharts for data visualization
- **Backend:** FastAPI (Python) with CORS enabled for cross-origin requests
- **Styling:** Custom CSS with a professional dark/light theme combination

---

## Layout & Navigation

### Sidebar Navigation (Dark Theme)
- Fixed left sidebar (250px width) with dark gray background (#111827)
- Brand section with logo icon (indigo blue #6366f1) and "Social Intelligence Hub" title
- Main navigation with 5 key pages:
  - 📊 **Overview** - Main dashboard
  - 🌐 **Network** - User/platform relationship graph
  - 📋 **Data** - Live posts with filtering
  - 📈 **Timeline** - Time-series analysis
  - 💡 **Insights** - AI-powered analytics
- Bottom system status indicator with online dot badge
- Hover effects with smooth transitions

### Top Bar (White Background)
- Search functionality for posts/hashtags
- Breadcrumb navigation
- Refresh/Live toggle button
- User profile avatar and status
- Action icons for settings/notifications

---

## Key Pages & Components

### 1. Overview Page 
**Stat Cards Grid (4 columns)**
- Total Posts count
- Sentiment breakdown (Positive, Negative, Neutral)
- Platforms distribution
- Countries covered
- Each card has colored icon background (blue, green, red, purple)

**Dashboard Charts**
- **Sentiment Pie Chart:** Visual breakdown of positive/negative/neutral sentiment using green (#16a34a), red (#dc2626), and indigo (#6366f1)
- **Platform Bar Chart:** Distribution across social media platforms
- **Top Trends:** Hashtag rankings with counts and trend arrows
- **Countries:** Geographic distribution with progress bars

### 2. Network Page
- Circular force-directed graph visualization
- Inner ring: Platform nodes
- Outer ring: User/influencer nodes
- Node sizing by PageRank, Degree, or Engagement metrics
- Displays network statistics (total nodes, edges, top influencers)
- Interactive filters for network density

### 3. Data Page
- Live post explorer with pagination
- Filters:
  - Search bar (debounced 400ms)
  - Platform filter dropdown
  - Sentiment filter (All/Positive/Negative/Neutral)
- Post cards display:
  - User, Platform, Timestamp
  - Post text excerpt
  - Sentiment label with color coding
  - Engagement metrics (likes, retweets)
  - Country and hashtags

### 4. Timeline Page
- Area chart showing sentiment trends over time
- Granularity selector (day/week/month)
- Stacked view of positive/negative/neutral posts
- Time-series data for trend analysis

### 5. Insights Page
- AI-powered insights/summaries
- Q&A interface for custom queries
- Real-time insights from the backend
- Loading states with async handling

---

## Color Scheme & Typography

### Primary Colors:
- Indigo (#4f46e5, #6366f1) - Primary interactive elements
- Dark gray (#111827) - Sidebar
- White (#ffffff) - Cards and content areas
- Light gray (#f5f7fb) - Background

### Accent Colors:
- Green (#16a34a) - Positive sentiment
- Red (#dc2626) - Negative sentiment
- Purple (#9333ea, #6366f1) - Neutral/Tertiary elements

### Typography:
- Font: Inter, Arial, sans-serif
- Page headings: 27px, bold
- Card titles: 15px
- Body text: 13px
- Small labels: 10-11px

---

## Features

✅ **Live Auto-Refresh** - Polls backend every 10 seconds  
✅ **Responsive Charts** - Recharts with interactive tooltips  
✅ **Search & Filtering** - Real-time post search and multi-filter  
✅ **Error Handling** - User-friendly error messages with retry  
✅ **API-Driven** - All data from FastAPI backend  
✅ **Loading States** - Smooth loading screens  
✅ **Accessibility** - CORS configured, mobile-friendly structure  

---

## Data Flow

```
Backend (FastAPI)
  ├─ /api/analytics → Overview stats
  ├─ /api/network   → Network graph data
  ├─ /api/posts     → Live posts with filters
  ├─ /api/timeseries → Timeline data
  └─ /api/insights  → AI insights & Q&A

Frontend (React)
  ├─ Fetches on page load & live refresh
  ├─ Renders with Recharts
  ├─ Handles user filters & search
  └─ Displays real-time updates
```

---

## Technical Stack

### Frontend
- **React 19.2.8** - UI library
- **TypeScript 6.0.2** - Type safety
- **Vite 8.3.0** - Build tool
- **Recharts 3.10.1** - Chart library
- **ESLint 10.10.0** - Code linting

### Backend
- **FastAPI** - Python web framework
- **Uvicorn** - ASGI server
- **Pandas** - Data processing
- **NetworkX** - Network analysis
- **Pydantic** - Data validation

### Database
- CSV data source (social_media_sentiment.csv)
- In-memory caching with @lru_cache

---

## Key UI Components

### Navigation
- **Sidebar:** Fixed dark navigation with icon + label navigation items
- **Topbar:** Search bar, breadcrumbs, profile section
- **Filters:** Dropdown and button-based filtering
- **Pagination:** Post navigation with offset/limit

### Data Display
- **Stat Cards:** Summary metrics with color-coded icons
- **Charts:** Pie charts, bar charts, area charts from Recharts
- **Tables/Lists:** Trending hashtags, countries, posts
- **Network Visualization:** SVG-based graph with custom positioning
- **Error States:** User-friendly error messages with retry button
- **Loading States:** Skeleton screens and loading indicators

---

## API Integration

### Endpoints Called
1. `GET /api/analytics` - Main dashboard stats
2. `GET /api/network?max_users=30` - Network graph data
3. `GET /api/posts?limit=15&offset=0&search=&platform=All&sentiment=All` - Post list
4. `GET /api/timeseries?granularity=month` - Timeline data
5. `GET /api/insights` - AI insights
6. `GET /api/insights?q={query}` - Custom Q&A

### Request/Response Pattern
- All requests use AbortController for cancellation
- Debounced search (400ms delay)
- Live polling every 10 seconds
- Error handling with fallback messages

---

## Design System Highlights

- **Consistency:** Unified spacing, colors, and typography
- **Accessibility:** Clear contrast ratios, readable fonts
- **Responsiveness:** Flexible grid layouts
- **Interactivity:** Smooth transitions and hover states
- **Professional:** Clean, modern aesthetic
- **Data-Driven:** Focus on insights and analytics

This is a **production-ready analytics dashboard** with professional UI/UX, comprehensive data visualization, and a scalable architecture! 🚀
