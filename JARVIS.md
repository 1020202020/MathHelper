# J.A.R.V.I.S. — your personal AI assistant

Open `jarvis.html` (on your GitHub Pages site: `https://1020202020.github.io/MathHelper/jarvis.html`).
Works best in **Chrome or Edge** (they support voice input).

## What it can do
- **Talk**: click the glowing reactor (or 🎙) and speak, or type. Tick *Always listen for "Jarvis"* to use a wake word ("Jarvis, what's the weather?").
- **Answer questions** — powered by AI through Puter.js (free; may ask you to sign in to Puter the first time).
- **Email (Gmail)**: "Check my email", "Read the one from Alex", "Reply saying I'll be there at 5". It **always shows you a confirmation popup before sending**.
- **Weather**: "What's the weather?" / "Weather in London tomorrow?"
- **Timers & reminders**: "Remind me in 20 minutes to take the pizza out" (page must stay open).
- **Notes**: "Remember my locker code is 1234" / "What notes do I have?"
- **Open websites / search**: "Open YouTube", "Search for volcano facts".
- Say **"stop"** to make him stop talking.

## The voice
By default it picks the best British male voice your browser has (e.g. "Google UK English Male" in Chrome, "Daniel" on Mac/iPhone). You can change it in ⚙ Settings.

For a much more realistic butler voice, add an **ElevenLabs** API key + a British male voice ID in Settings (free tier available at elevenlabs.io). Note: it can't use the actual movie actor's voice — cloning a real person's voice without permission isn't allowed — but a refined British voice gets you very close to the feel.

## Connecting Gmail (one-time, ~5 minutes)
Google requires every app that reads Gmail to have its own "Client ID". It's free:

1. Go to <https://console.cloud.google.com/> and create a new project (name it "Jarvis").
2. **APIs & Services → Library** → search **Gmail API** → **Enable**.
3. **APIs & Services → OAuth consent screen** (a.k.a. "Google Auth Platform"): choose **External**, fill in an app name and your email.
   Under **Audience / Test users**, add **your own Gmail address**.
4. **Credentials → Create credentials → OAuth client ID** → type **Web application**.
   Under **Authorized JavaScript origins** add:
   - `https://1020202020.github.io` (your GitHub Pages site)
   - `http://localhost:8000` (optional, for testing locally)
5. Copy the **Client ID** (ends in `.apps.googleusercontent.com`), open Jarvis → ⚙ Settings → paste it → Save.
6. Click **✉ Connect Gmail**. Google will warn the app is "unverified" — that's normal because it's *your* private app; click *Continue*.

Sign-in only works over `https://` or `http://localhost` (not by double-clicking the file). To test locally: `python3 -m http.server 8000` and open `http://localhost:8000/jarvis.html`.

## Privacy
- Your Gmail access token stays in your browser tab only and expires after an hour. Settings, notes and chat history are saved in your browser's local storage.
- Email content you ask about is sent to the AI service (Puter) to be summarised.
