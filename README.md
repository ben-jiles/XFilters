# XFilters
![XFilters](https://img.shields.io/badge/XFilters-v1.0-blue?logo=googlechrome)
![License](https://img.shields.io/github/license/ben-jiles/XFilters?color=blue)
![Chrome](https://img.shields.io/badge/Chrome-Extension-green)

> **Powerful, real-time tweet filtering for X.com**  
> Hide, blur, or highlight posts using **regex**, **user**, **time**, and **action**.  
> Block profanity, spam, or politics —ily — **no page refresh needed**.

---

## Screenshots

| Blur | Highlight |
|-----------|----------|
| ![Blur Mode](screenshots/blur.png) | ![Highlight Mode](screenshots/highlight.png) |

> *Blurred words reveal on hover. Highlighted tweets glow with black text (dark mode safe).*

---

## Features

| Feature | Description |
|-------|-----------|
| **Hide Tweet** | Remove unwanted posts completely |
| **Blur Words** | Blur matched text (reveal on hover) |
| **Highlight Tweet** | Yellow glow + black text (dark mode safe) |
| **Regex Filtering** | Full regex support (`\bword\b`) |
| **User Filter** | Only apply to specific users (`@elonmusk`) |
| **Quiet Hours** | Time-based filtering |
| **One-Click Profanity** | Pre-built filter for 10 common words |
| **Import/Export** | Backup & share rules |
| **No Refresh** | Works on scroll, timeline, and single tweets |

---

## Installation

1. **Download** the repo:  
   ```bash
   git clone https://github.com/ben-jiles/XFilters.git
2. Open Chrome → chrome://extensions
3. Enable Developer mode (top right)
4. Click "Load unpacked" → Select the XFilters folder
5. Done! Open X.com → Click the XFilters icon


## How to Use

1. Click the XFilters icon in Chrome toolbar
2. Click "Add Rule"
3. Fill:
- Regex: \bsing\b
- Action: Blur or Highlight
4. Save → Done!

## Profanity Filter
Click "Load Profanity" → Instant 10-word filter (blur by default)

## Tech Stack

- Manifest V3
- Vanilla JS (no frameworks)
- Chrome Storage API
- MutationObserver (real-time DOM)
- Regex (gi flags)


## License
MIT License – Free to use, modify, and distribute.

## Privacy Policy
I don't collect any of your data. I don't want it.

## Author
Ben Jiles - @BenSJiles


XFilters – Clean your timeline, your way.
