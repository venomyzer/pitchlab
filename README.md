# PitchLab

Free football tools for streamers and fans, with a console-style menu.
No account, no server. Everything saves in your own browser.

## What's inside

**Streamer Tools**
- **Scoreboard overlay** for OBS: score, match clock, added time, and goal and card pop-ups.
- **Control panel** with a live preview and undo (`Ctrl Z`).
- **OBS setup guide** inside the app.

**Tactic Boards**
- **Formation Lab**: 6 formations in 3 phases, with an opponent overlay and player names.
- **Tactics Sandbox**: both teams, ball, passes, runs, zones, frames and 3 save slots.

**Learn Football**
- **Offside**: 7 interactive lessons plus a sandbox to test your own positions.

## Deploy

1. Push the project to GitHub.
2. On [Vercel](https://vercel.com): **Add New → Project**, import the repo. Framework: Vite. No settings to change.
3. Vercel gives you a link like `https://your-app.vercel.app`. That's the address you and other streamers use, including in OBS.

## Run it locally (for development)

You need [Node.js](https://nodejs.org).

```bash
npm install
npm run dev      # open http://localhost:5173
npm run build    # production site in dist/
```

## Use the scoreboard in OBS

1. Open your Vercel link and go to **Streamer Tools → Match Scoreboard**.
2. Press **Copy** next to the overlay link (`https://your-app.vercel.app/overlay/scoreboard`) and add it to OBS as a **Browser Source** (1920 × 1080).
   It's transparent. Use the green-screen link (`?bg=green`) if you capture a browser window instead.
3. Control it from the panel, or with hotkeys:

| Key | Action |
|---|---|
| `1` / `2` | Goal for home / away |
| `Shift 1` / `Shift 2` | Remove a goal |
| `Space` | Start or pause the clock |
| `Esc` | Hide the pop-up |

The panel and overlay must run in the **same browser** and on the **same address**: both inside OBS
(overlay as a Browser Source, panel `https://your-app.vercel.app/stream/scoreboard` as a Custom Browser Dock), or both in Chrome.
The in-app guide (**Streamer Tools → OBS Setup Guide**) walks through each setup.

## Controls

| Key | Action |
|---|---|
| `W` / `S` or arrow keys | Move through menus |
| `Enter` | Select |
| `Q` / `E` | Switch tabs |
| `Esc` | Go back |

## Customise

- **App name, your links, donation link:** `src/config.ts`
- **Profile card media** (banner, avatar, decoration, nameplate, effect): see [`public/profile/README.md`](public/profile/README.md)

## Made by VENOMYZER

- YouTube: [@venomyzer2814](https://www.youtube.com/@venomyzer2814)
- Instagram: [@venomyzer](https://www.instagram.com/venomyzer/)
- Portfolio: [venomyzer.zerolink.co.in](https://venomyzer.zerolink.co.in)
