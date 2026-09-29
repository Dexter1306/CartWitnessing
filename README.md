# 🛒 Cart Witnessing Schedule Web App

An accessible, elderly-friendly, high-contrast digital schedule coordinator for public cart witnessing locations (L1 to L5) and two daily shifts (Morning & Afternoon).

## ✨ Features

- **Elderly Comfort Settings**:
  - 1-click text scaling (`Aa Normal`, `Aa+ Large`, `Aa++ Jumbo`).
  - Ultra High-Visibility Contrast mode (Yellow on Black / WCAG AAA compliant).
  - Touch-friendly large hit targets (minimum 58px height).
- **Keyman Coordinator Mode**:
  - 4-digit PIN authentication on a big visual keypad (Default PIN: `1234`).
  - Edit publisher assignments, phone contacts, and cart storage instructions.
  - Reset to sample demo data or clear shifts to mark as open.
- **Volunteer Self-Sign-Up**:
  - Open shifts feature a 1-tap "I Can Volunteer!" modal.
- **Assistive Utilities**:
  - 🔊 **Read Aloud**: Uses Web Speech API to read the day's schedule at a slow, clear pace.
  - 📲 **Copy WhatsApp Text**: Formats and copies a clean, markdown-formatted broadcast message.
  - 🖨️ **Print Sheet**: Dedicated print stylesheet tailored for congregation noticeboards.
- **Data Persistence**:
  - Automatic `localStorage` saving per date (`cart_schedule_YYYY-MM-DD`).

## 📁 File Structure

- `index.html` — HTML structure & semantic elements.
- `style.css` — High-contrast design tokens, responsive CSS grid, and themes.
- `app.js` — State management, speech synthesis, and schedule storage.
- `.nojekyll` — Direct static serving for GitHub Pages.

## 🚀 Live Demo on GitHub Pages

1. Fork or clone this repository.
2. Go to **Settings** > **Pages**.
3. Under **Branch**, select `main` and `/ (root)`.
4. Your site will be live at `https://<your-username>.github.io/<repository-name>/`.
