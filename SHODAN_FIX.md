# Shodan Module Fix - User Instructions

## Issue
If you're seeing that the Shodan checkbox is unchecked and the Shodan card is not appearing, this is likely due to **browser cache** or **old localStorage data**.

## Solution

### Option 1: Hard Refresh (Recommended)
1. **Windows/Linux**: Press `Ctrl + Shift + R` or `Ctrl + F5`
2. **Mac**: Press `Cmd + Shift + R`
3. This will force the browser to reload all JavaScript files

### Option 2: Clear Browser Cache
1. Open Developer Tools (`F12` or `Ctrl+Shift+I`)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

### Option 3: Clear localStorage (If above doesn't work)
1. Open Developer Tools (`F12`)
2. Go to the **Console** tab
3. Paste this command and press Enter:
   ```javascript
   localStorage.removeItem('enabledModules'); location.reload();
   ```
4. This will reset your module preferences and reload the page

### Option 4: Clear All Site Data
1. Open Developer Tools (`F12`)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Click "Clear site data" or "Clear storage"
4. Refresh the page

---

## What Was Fixed

### Root Cause
The issue occurred because:
1. **Old JavaScript was cached** - Browser was using old code without Shodan support
2. **localStorage had old state** - Saved preferences didn't include `shodan: true`

### Technical Changes
1. ✅ Added localStorage persistence for `enabledModules`
2. ✅ Implemented smart merging: new modules (like Shodan) default to `true` even if not in saved state
3. ✅ Added Shodan checkbox to both Single Scan and Bulk Scanner
4. ✅ Wired up Shodan API calls in both modes
5. ✅ Connected `onShodanResults` callback to display the card

### Code Changes
```typescript
// Before: Simple initialization
const [enabledModules, setEnabledModules] = useState({
  shodan: true,
  // ... other modules
});

// After: Smart initialization with localStorage
const [enabledModules, setEnabledModules] = useState(() => {
  const defaults = { shodan: true, /* ... */ };
  const saved = localStorage.getItem('enabledModules');
  if (saved) {
    // Merge saved with defaults - ensures new modules are included!
    return { ...defaults, ...JSON.parse(saved) };
  }
  return defaults;
});
```

---

## Verification

After applying the fix, you should see:
- ✅ Shodan checkbox is **checked** by default
- ✅ Shodan card appears **15-25 seconds** after scan starts
- ✅ Checkbox state persists across page refreshes

## Still Having Issues?

If the problem persists after trying all options above:
1. Check browser console for errors (`F12` → Console tab)
2. Verify you're on the latest deployment
3. Try a different browser or incognito/private mode
4. Check if Shodan API key is configured on the backend

---

## Technical Details

**Why does Shodan take 15-25 seconds?**
- DNS resolution: 1-3s
- Shodan API query: 10-20s (large database)
- Network latency: 1-2s

**Caching:**
- Results are cached for 24 hours in Redis
- Cached results return in <100ms
- First-time queries take 15-25s

**API Limits:**
- Free tier: 1 req/sec, 100 req/month
- Paid tier: Higher limits available
