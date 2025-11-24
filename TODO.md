# Feature Implementation TODO

## Priority 1: Bug Fixes
- [x] Fix streak calculation bug - streak should break after missing a day
  - ✅ Fixed: Streak now properly breaks if most recent completion was more than 1 day ago
  - ✅ Updated streak calculation to check consecutive days from most recent completion backwards

## Priority 2: Core Features
- [x] Add calendar heatmap to Progress page showing completion history
  - ✅ Already existed and is working
- [x] Implement skip/rest day feature - allow skipping without breaking streak
  - ✅ Added `skipped_at` field to `user_challenges` table
  - ✅ Updated streak calculation to account for skipped days (they don't break streak but don't count)
  - ✅ Added skip API endpoint (`POST /api/complete/skip`)
  - ✅ Added skip button to Today page
- [x] Add milestone badges system (first week, 10 completions, 30-day streak, etc.)
  - ✅ Added `badges` JSON field to `user_stats` table
  - ✅ Implemented badge checking logic in `StatsService.checkAndAwardBadges()`
  - ✅ Created Badges component with emoji icons
  - ✅ Added badges section to Progress page
  - ✅ Badges: First Step, First Week, Ten/Thirty/Fifty/Hundred Completions, Week Warrior, Month Master, Streak Starter, Streak Champion
- [x] Add simple insights to Progress page (weekly completions, longest streak, etc.)
  - ✅ Added insights section showing: Total Completions, This Week, Avg per Week, Best Day

## Priority 3: Enhanced Features
- [x] Implement Comfort Intelligence v1.3 - smarter challenge assignment based on comfort level
  - ✅ Recent-weighted comfort score calculation (last 7 days get full weight, older completions decay)
  - ✅ Inactivity decay (comfort score reduces after 7+ days of inactivity, max 30% reduction)
  - ✅ Automatic difficulty decrease after 3 missed days (reduces by 20 points, or 10 if only 1 completion)
  - ✅ Enhanced category variety (avoids last 3 days' categories, not just yesterday)
- [x] Improve empty states across all pages with friendly messages
  - ✅ Journal page: Added encouraging message with icon
  - ✅ Wins page: Added friendly empty state with icon
  - ✅ Progress page: Improved empty state with icon and encouraging copy
  - ✅ Today page: Added loading/empty state
- [x] Add PWA support (manifest, service worker, offline queue)
  - ✅ Created web app manifest with app metadata and icons
  - ✅ Created service worker for offline support and caching
  - ✅ Registered service worker in main.tsx
  - ✅ Added PWA meta tags to index.html
  - ✅ App is now installable on mobile and desktop

## Implementation Notes

### Streak Fix
- Need to ensure streak only counts consecutive days from most recent completion
- Should break streak if there's a gap of more than 1 day
- Consider timezone handling

### Calendar Heatmap
- Show last 365 days (or configurable period)
- Color intensity based on completion status
- Click to see details for that day

### Skip/Rest Day
- Add "Skip Today" button on Today page
- Store skipped days in database
- Don't break streak for skipped days
- Maybe limit skips per week/month?

### Milestone Badges
- Track: first_completion, first_week, ten_completions, thirty_day_streak, etc.
- Store in user_stats or separate badges table
- Display on Progress page
- Celebrate when earned

### Simple Insights
- "You've completed X challenges this week"
- "Your longest streak is Y days"
- "You're on a X-day streak!"
- "Best completion day: Monday" (or whatever)

### Comfort Intelligence
- Adjust challenge difficulty based on recent completions
- Avoid same category 2 days in a row
- Gentle catch-up if user misses days
- Backend logic, minimal UI changes

### Empty States
- Friendly messages when no data
- Encouraging copy
- Clear CTAs

### PWA Support
- Web app manifest
- Service worker for offline support
- Install prompt
- Offline queue for completions
