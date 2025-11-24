# Theme Toggle Location & Dark Mode Guide

## 🎨 Where is the Theme Toggle?

The theme toggle is located in the **sticky navbar at the top**, on the **far left side**.

### Visual Location:
```
┌────────────────────────────────────────────────────────────┐
│  [🌙]  Electron App    Home  Features  Settings    v1.0.0  │  ← Navbar
└────────────────────────────────────────────────────────────┘
   ↑
   Theme Toggle Button (far left)
```

### How to Use:
1. **Look at the top-left corner** of the window
2. **Click the sun/moon icon button** (shows sun in light mode, moon in dark mode)
3. **Select your preference:**
   - ☀️ **Light** - Force light mode
   - 🌙 **Dark** - Force dark mode
   - 🖥️ **System** - Follow your OS preference (Windows dark mode setting)

---

## 🌓 Theme Modes Explained

### Light Mode
- Bright background
- Dark text
- Perfect for daytime use
- Default if system preference is light

### Dark Mode
- Dark background (#2E2E2E ish)
- Light text
- Easy on the eyes in low light
- Teal/green accents remain vibrant

### System Mode (Default)
- Automatically matches Windows dark/light mode
- Changes when you change Windows settings
- Best for users who switch modes regularly

---

## 🎯 How Theme Works

### 1. Theme Persists
Your choice is saved to the **SQLite database** in the `app_settings` table:
- Key: `app-theme`
- Value: `light`, `dark`, or `system`
- Survives app restarts

### 2. System Detection
When set to "System", the app checks:
```
Windows Settings → Personalization → Colors → Choose your color
```
- If Windows is in dark mode → App shows dark
- If Windows is in light mode → App shows light

### 3. Real-time Updates
- Changes apply instantly (no reload needed)
- Smooth transitions between themes
- All components update simultaneously

---

## 🔧 Theme Colors in Use

### Light Mode (Default)
```
Background: White/Very Light Gray
Text: Dark Gray/Black
Primary: Teal/Green (#8ED1A8 ish)
Cards: White
Borders: Light Gray
```

### Dark Mode
```
Background: Dark Gray (#2E2E2E)
Text: Light Gray/White
Primary: Darker Teal (#6FAA8E ish)
Cards: Slightly Lighter Gray
Borders: Dark Gray
```

---

## 🎨 Using Theme in Your Components

### Always Use Theme Variables

**✅ Correct** (uses theme):
```tsx
<div className="bg-background text-foreground">
  <div className="border border-border bg-card p-4">
    <h2 className="text-card-foreground">Title</h2>
    <p className="text-muted-foreground">Subtitle</p>
  </div>
</div>
```

**❌ Wrong** (hardcoded colors):
```tsx
<div className="bg-white text-black">
  <div className="border-gray-200 bg-gray-50 p-4">
    <h2 className="text-gray-900">Title</h2>
    <p className="text-gray-500">Subtitle</p>
  </div>
</div>
```

### Key Theme Classes

| Element | Light Mode Class | Usage |
|---------|-----------------|-------|
| **Backgrounds** | | |
| Main background | `bg-background` | App/page background |
| Card background | `bg-card` | Card, panel backgrounds |
| Muted background | `bg-muted` | Subtle backgrounds |
| **Text** | | |
| Primary text | `text-foreground` | Main content text |
| Card text | `text-card-foreground` | Text on cards |
| Muted text | `text-muted-foreground` | Subtitles, descriptions |
| Primary color | `text-primary` | Brand color text |
| **Borders** | | |
| Standard border | `border-border` | All borders |
| Input border | `border-input` | Form inputs |
| **Special** | | |
| Primary accent | `bg-primary` | Buttons, highlights |
| Destructive | `bg-destructive` | Delete, errors |

---

## 🧪 Testing Theme

### Quick Test Steps:
1. Start the app: `pnpm dev`
2. Find theme toggle (top-left corner)
3. Click it and select different modes
4. Verify:
   - ✅ Background changes color
   - ✅ Text remains readable
   - ✅ Borders are visible
   - ✅ Cards have distinct backgrounds
   - ✅ Primary color (teal/green) shows correctly

### Test Checklist:
- [ ] Theme toggle visible in navbar (far left)
- [ ] Can click and see dropdown menu
- [ ] Light mode looks good
- [ ] Dark mode looks good
- [ ] System mode works (matches Windows)
- [ ] Theme persists after closing/reopening app
- [ ] All text is readable in both modes
- [ ] All borders are visible in both modes
- [ ] Cards stand out from background in both modes

---

## 🐛 Troubleshooting

### "I don't see the theme toggle"
**Solution:** The toggle is a small button with a sun/moon icon at the very top-left of the navbar. Look for:
- In light mode: ☀️ Sun icon
- In dark mode: 🌙 Moon icon

### "Dark mode isn't working"
**Possible causes:**
1. Component is using hardcoded colors (fix: use theme variables)
2. Theme toggle not clicked (default is "system" mode)
3. App needs rebuild: `pnpm build && pnpm dev`

### "Some parts don't change color"
**Fix:** Update component to use theme classes:
```tsx
// Before
<div className="bg-white text-black">

// After
<div className="bg-background text-foreground">
```

### "Theme doesn't persist"
**Check:**
1. Database is working: Check the database demo
2. Theme setting is being saved: Look for `app-theme` in settings

---

## 📍 Theme Toggle Location (Detailed)

```
Navbar Component:
├── [Theme Toggle] ← FAR LEFT (first element)
├── "Electron App" (logo/brand)
├── Home | Features | Settings (center nav)
└── v1.0.0 (version, far right)
```

**In code** (`src/renderer/src/components/Navbar.tsx`):
```tsx
<nav className="sticky top-0...">
  <div className="container flex...">
    {/* Theme Toggle on far left */}
    <div className="mr-4 flex">
      <ThemeToggle />  ← HERE!
    </div>
    {/* Rest of navbar... */}
  </div>
</nav>
```

---

## 🎯 Quick Access

**Keyboard shortcut:** None (yet - can be added)

**Mouse:** Click the sun/moon icon at top-left of navbar

**Touch:** Tap the sun/moon icon at top-left of navbar

---

## 📚 Related Files

- **Theme Provider:** `src/renderer/src/components/ThemeProvider.tsx`
- **Theme Toggle:** `src/renderer/src/components/ThemeToggle.tsx`
- **Navbar:** `src/renderer/src/components/Navbar.tsx`
- **Theme CSS:** `src/renderer/src/index.css`
- **App Entry:** `src/renderer/src/App.tsx`

---

**Theme Version:** 1.0.0  
**Last Updated:** November 24, 2025  
**Status:** ✅ Fully Functional

