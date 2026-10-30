/* J.A.R.V.I.S. — voice assistant: speech in/out, AI with tools, Gmail. */
(() => {
  const $ = (s) => document.querySelector(s);

  // ---------- Settings ----------
  const SETTINGS_KEY = "jarvis.settings";
  const settings = Object.assign(
    { userName: "sir", voiceURI: "", elevenKey: "", elevenVoice: "", googleClientId: "", model: "" },
    load(SETTINGS_KEY, {})
  );
  function load(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  }
  function save(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  }

  // ---------- UI helpers ----------
  const reactor = $("#reactor");
  function setState(state, label) {
    reactor.classList.remove("listening", "thinking", "speaking");
    if (state) reactor.classList.add(state);
    $("#status").textContent = label || state || "Online";
  }
  function log(kind, text) {
    const el = document.createElement("div");
    el.className = "entry " + kind;
    const who = { user: settings.userName || "You", jarvis: "Jarvis", tool: "System", err: "Error" }[kind];
    el.innerHTML = `<span class="who"></span>`;
    el.firstChild.textContent = who;
    el.append(document.createTextNode(text));
    $("#log").append(el);
    $("#log").scrollTop = $("#log").scrollHeight;
    return el;
  }
  const caption = (t) => ($("#caption").textContent = t);

  // ---------- Voice output ----------
  let voices = [];
  // Voices that sound closest to a refined British AI butler, best first.
  const PREFERRED = [/Daniel/i, /Google UK English Male/i, /Microsoft (Ryan|George|Thomas|Oliver)/i, /Arthur/i, /en-GB.*Male/i];
  function loadVoices() {
    voices = speechSynthesis.getVoices();
    const sel = $("#voiceSelect");
    sel.innerHTML = "";
    const sorted = [...voices].sort((a, b) => (b.lang.startsWith("en-GB") - a.lang.startsWith("en-GB")));
    for (const v of sorted) sel.add(new Option(`${v.name} (${v.lang})`, v.voiceURI));
    sel.value = pickVoice()?.voiceURI || "";
  }
  function pickVoice() {
    if (settings.voiceURI) {
      const v = voices.find((v) => v.voiceURI === settings.voiceURI);
      if (v) return v;
    }
    for (const re of PREFERRED) {
      const v = voices.find((v) => re.test(v.name) || re.test(`${v.lang} ${v.name}`));
      if (v) return v;
    }
    return voices.find((v) => v.lang === "en-GB") || voices.find((v) => v.lang.startsWith("en"));
  }
  if ("speechSynthesis" in window) {
    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;
  }

  const forSpeech = (t) => t.replace(/```[\s\S]*?```/g, " (code shown on screen) ")
    .replace(/https?:\/\/\S+/g, "the link on screen").replace(/[*_#`>|]/g, "").trim();

  let currentAudio = null;
  async function speak(text) {
    text = forSpeech(text);
    if (!text) return;
    stopListening(true);
    setState("speaking", "Speaking");
    try {
      if (settings.elevenKey && settings.elevenVoice) await speakEleven(text);
      else await speakBrowser(text);
    } catch (e) {
      log("err", "Voice failed (" + (e.message || e) + "), using browser voice.");
      await speakBrowser(text).catch(() => {});
    }
    setState(null, "Online");
    resumeWake();
  }
  function speakBrowser(text) {
    return new Promise((resolve) => {
      if (!("speechSynthesis" in window)) return resolve();
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      const v = pickVoice();
      if (v) { u.voice = v; u.lang = v.lang; } else u.lang = "en-GB";
      u.rate = 1.02; u.pitch = 0.95;
      u.onend = u.onerror = resolve;
      speechSynthesis.speak(u);
    });
  }
  async function speakEleven(text) {
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(settings.elevenVoice)}`, {
      method: "POST",
      headers: { "xi-api-key": settings.elevenKey, "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify({ text, model_id: "eleven_turbo_v2_5", voice_settings: { stability: 0.5, similarity_boost: 0.8 } }),
    });
    if (!r.ok) throw new Error("ElevenLabs " + r.status);
    const url = URL.createObjectURL(await r.blob());
    await new Promise((resolve) => {
      currentAudio = new Audio(url);
      currentAudio.onended = currentAudio.onerror = resolve;
      currentAudio.play().catch(resolve);
    });
    URL.revokeObjectURL(url);
    currentAudio = null;
  }
  function shutUp() {
    if ("speechSynthesis" in window) speechSynthesis.cancel();
    if (currentAudio) { currentAudio.pause(); currentAudio.onended?.(); }
  }

  // ---------- Voice input ----------
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let rec = null, listening = false, wakeMode = false, awaitingCommand = false, suppressWake = false;

  function makeRecognizer(continuous) {
    const r = new SR();
    r.lang = "en-US";
    r.continuous = continuous;
    r.interimResults = true;
    return r;
  }

  function startPushToTalk() {
    if (!SR) return log("err", "Voice input isn't supported in this browser. Try Chrome or Edge — or just type.");
    shutUp();
    stopListening(true);
    const r = (rec = makeRecognizer(false));
    let finalText = "";
    r.onresult = (e) => {
      const t = [...e.results].map((r) => r[0].transcript).join("");
      caption(t + "…");
      if (e.results[e.results.length - 1].isFinal) finalText = t;
    };
    r.onerror = (e) => { if (e.error !== "no-speech" && e.error !== "aborted") log("err", "Mic: " + e.error); };
    r.onend = () => {
      if (rec !== r) return;
      listening = false;
      $("#micBtn").classList.remove("on");
      setState(null, "Online");
      if (finalText.trim()) handle(finalText.trim());
      else { caption("I didn't catch that."); resumeWake(); }
    };
    listening = true;
    $("#micBtn").classList.add("on");
    setState("listening", "Listening");
    caption("Listening…");
    r.start();
  }

  function startWake() {
    if (!SR || !wakeMode || listening || suppressWake) return;
    const r = (rec = makeRecognizer(true));
    r.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        const t = res[0].transcript.trim();
        if (!res.isFinal) {
          if (awaitingCommand || /jarvis/i.test(t)) caption(t + "…");
          continue;
        }
        if (awaitingCommand) {
          awaitingCommand = false;
          if (t) handle(t);
          return;
        }
        const m = t.match(/jarvis[,.!?]?\s*(.*)/i);
        if (!m) continue;
        if (m[1]) handle(m[1]);
        else { awaitingCommand = true; setState("listening", "Listening"); speak(pick(["Yes, " + settings.userName + "?", "At your service.", "Sir?"])); }
        return;
      }
    };
    r.onerror = (e) => {
      if (e.error === "not-allowed") { wakeMode = false; $("#wakeToggle").checked = false; log("err", "Microphone permission denied."); }
    };
    r.onend = () => {
      if (rec !== r) return;
      listening = false;
      if (wakeMode && !suppressWake) setTimeout(startWake, 250);
    };
    listening = true;
    try {
      r.start();
      if (awaitingCommand) setState("listening", "Listening");
      else setState(null, "Listening for “Jarvis”");
    } catch { listening = false; }
  }

  function stopListening(suppress) {
    if (suppress) suppressWake = true;
    if (rec && listening) { try { rec.abort(); } catch {} }
    listening = false;
  }
  function resumeWake() {
    suppressWake = false;
    if (wakeMode && !busy) setTimeout(startWake, 300);
  }
  const pick = (a) => a[Math.floor(Math.random() * a.length)];

  // ---------- Gmail ----------
  const GMAIL = "https://gmail.googleapis.com/gmail/v1/users/me";
  const SCOPES = "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send";
  let gToken = null, gExpiry = 0;

  function connectGmail() {
    return new Promise((resolve, reject) => {
      if (!settings.googleClientId) return reject(new Error("Gmail isn't set up yet. Open Settings (⚙) and add a Google Client ID — see JARVIS.md."));
      if (!window.google?.accounts?.oauth2) return reject(new Error("Google sign-in library didn't load. Check your connection."));
      const client = google.accounts.oauth2.initTokenClient({
        client_id: settings.googleClientId,
        scope: SCOPES,
        callback: (resp) => {
          if (resp.error) return reject(new Error(resp.error_description || resp.error));
          gToken = resp.access_token;
          gExpiry = Date.now() + (resp.expires_in - 60) * 1000;
          $("#gmailBtn").textContent = "✉ Gmail connected";
          $("#gmailBtn").classList.add("on");
          resolve();
        },
        error_callback: (err) => reject(new Error(err.message || err.type || "Sign-in cancelled")),
      });
      client.requestAccessToken();
    });
  }
  async function gmail(path, opts = {}) {
    if (!gToken || Date.now() > gExpiry) await connectGmail();
    const r = await fetch(GMAIL + path, {
      ...opts,
      headers: { Authorization: "Bearer " + gToken, "Content-Type": "application/json", ...(opts.headers || {}) },
    });
    if (r.status === 401) { gToken = null; throw new Error("Gmail session expired — please try again."); }
    if (!r.ok) throw new Error("Gmail error " + r.status + ": " + (await r.text()).slice(0, 200));
    return r.json();
  }
  const header = (msg, name) => msg.payload?.headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || "";
  const b64urlDecode = (s) => {
    const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
    return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
  };
  const b64urlEncode = (str) => {
    const bytes = new TextEncoder().encode(str);
    let bin = "";
    bytes.forEach((b) => (bin += String.fromCharCode(b)));
    return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  };
  function bodyText(part) {
    if (!part) return "";
    if (part.mimeType === "text/plain" && part.body?.data) return b64urlDecode(part.body.data);
    for (const p of part.parts || []) { const t = bodyText(p); if (t) return t; }
    if (part.mimeType === "text/html" && part.body?.data) {
      return new DOMParser().parseFromString(b64urlDecode(part.body.data), "text/html").body.textContent || "";
    }
    return "";
  }

  async function listEmails({ query = "in:inbox is:unread", max = 8 }) {
    const list = await gmail(`/messages?maxResults=${Math.min(max, 20)}&q=${encodeURIComponent(query)}`);
    if (!list.messages?.length) return "No emails match that.";
    const msgs = await Promise.all(list.messages.map((m) =>
      gmail(`/messages/${m.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`)));
    return JSON.stringify(msgs.map((m) => ({
      id: m.id, from: header(m, "From"), subject: header(m, "Subject"), date: header(m, "Date"), snippet: m.snippet,
    })));
  }
  async function readEmail({ id }) {
    const m = await gmail(`/messages/${encodeURIComponent(id)}?format=full`);
    return JSON.stringify({
      from: header(m, "From"), to: header(m, "To"), subject: header(m, "Subject"), date: header(m, "Date"),
      messageIdHeader: header(m, "Message-ID"), threadId: m.threadId,
      body: bodyText(m.payload).replace(/\n{3,}/g, "\n\n").slice(0, 6000),
    });
  }
  async function sendEmail({ to, subject, body, replyToId }) {
    let threadId, extra = "";
    if (replyToId) {
      const orig = await gmail(`/messages/${encodeURIComponent(replyToId)}?format=metadata&metadataHeaders=Message-ID`);
      threadId = orig.threadId;
      const mid = header(orig, "Message-ID");
      if (mid) extra = `In-Reply-To: ${mid}\r\nReferences: ${mid}\r\n`;
    }
    // Always show the user exactly what will be sent and require a click.
    $("#confirmBody").textContent = `To: ${to}\nSubject: ${subject}\n\n${body}`;
    const dlg = $("#confirmSend");
    dlg.returnValue = "";
    dlg.showModal();
    const ok = await new Promise((res) => dlg.addEventListener("close", () => res(dlg.returnValue === "yes"), { once: true }));
    if (!ok) return "The user cancelled sending. Do not send it.";
    const encSubject = /[^\x20-\x7e]/.test(subject) ? `=?UTF-8?B?${btoa(String.fromCharCode(...new TextEncoder().encode(subject)))}?=` : subject;
    const raw = `To: ${to}\r\nSubject: ${encSubject}\r\n${extra}MIME-Version: 1.0\r\nContent-Type: text/plain; charset="UTF-8"\r\n\r\n${body}`;
    await gmail("/messages/send", { method: "POST", body: JSON.stringify({ raw: b64urlEncode(raw), ...(threadId ? { threadId } : {}) }) });
    return "Sent.";
  }

  // ---------- Other tools ----------
  async function getWeather({ place }) {
    let lat, lon, name = place;
    if (place) {
      const g = await (await fetch(`https://geocoding-api.open-meteo.com/v1/search?count=1&name=${encodeURIComponent(place)}`)).json();
      if (!g.results?.length) return "Couldn't find that place.";
      ({ latitude: lat, longitude: lon, name } = g.results[0]);
    } else {
      const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 10000 }))
        .catch(() => null);
      if (!pos) return "Location unavailable — ask the user which city.";
      ({ latitude: lat, longitude: lon } = pos.coords);
      name = "your location";
    }
    const w = await (await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
      `&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto&forecast_days=3`)).json();
    return JSON.stringify({ place: name, current: w.current, daily: w.daily, note: "weather_code is WMO; temps °F, wind mph" });
  }

  const notes = load("jarvis.notes", []);
  const timers = [];
  function setTimer({ seconds, label }) {
    const when = Date.now() + seconds * 1000;
    timers.push({ when, label });
    setTimeout(() => {
      notify(`${label || "Timer"} is done.`);
      speak(`Pardon the interruption, ${settings.userName}. ${label ? "Your reminder: " + label : "Your timer is done."}`);
    }, seconds * 1000);
    if ("Notification" in window && Notification.permission === "default") Notification.requestPermission();
    return `Timer set for ${new Date(when).toLocaleTimeString()}. (Only works while this page stays open.)`;
  }
  function notify(text) {
    if ("Notification" in window && Notification.permission === "granted") new Notification("J.A.R.V.I.S.", { body: text });
  }

  const TOOLS = {
    get_datetime: {
      description: "Get the current local date, time and timezone.",
      parameters: { type: "object", properties: {} },
      run: () => new Date().toString(),
    },
    check_emails: {
      description: "List emails from the user's Gmail. Default: unread inbox mail. Returns id, from, subject, date, snippet.",
      parameters: { type: "object", properties: {
        query: { type: "string", description: "Gmail search query, e.g. 'in:inbox is:unread', 'from:mom', 'newer_than:1d'." },
        max: { type: "number", description: "Max emails (1-20). Default 8." },
      } },
      run: listEmails,
    },
    read_email: {
      description: "Read the full content of one email by its id (from check_emails).",
      parameters: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
      run: readEmail,
    },
    send_email: {
      description: "Send an email (or reply, if replyToId is given) from the user's Gmail. The user sees a confirmation popup before it sends.",
      parameters: { type: "object", properties: {
        to: { type: "string" }, subject: { type: "string" }, body: { type: "string" },
        replyToId: { type: "string", description: "Optional email id to reply to (keeps it in the same thread)." },
      }, required: ["to", "subject", "body"] },
      run: sendEmail,
    },
    get_weather: {
      description: "Get current weather and a 3-day forecast. Omit place to use the user's location.",
      parameters: { type: "object", properties: { place: { type: "string", description: "City name" } } },
      run: getWeather,
    },
    open_website: {
      description: "Open a website or a Google search in a new browser tab.",
      parameters: { type: "object", properties: {
        url: { type: "string", description: "Full URL to open" },
        search: { type: "string", description: "Or: a Google search query" },
      } },
      run: ({ url, search }) => {
        const target = url || "https://www.google.com/search?q=" + encodeURIComponent(search || "");
        const w = window.open(target, "_blank", "noopener");
        return w === null ? "Opened (if a popup blocker stopped it, tell the user to allow popups)." : "Opened " + target;
      },
    },
    set_timer: {
      description: "Set a timer or reminder that speaks aloud when it goes off.",
      parameters: { type: "object", properties: {
        seconds: { type: "number" }, label: { type: "string", description: "What to remind the user about" },
      }, required: ["seconds"] },
      run: setTimer,
    },
    save_note: {
      description: "Remember a note or fact for the user (persists between visits).",
      parameters: { type: "object", properties: { text: { type: "string" } }, required: ["text"] },
      run: ({ text }) => { notes.push({ text, at: new Date().toLocaleString() }); save("jarvis.notes", notes); return "Saved."; },
    },
    list_notes: {
      description: "List all saved notes.",
      parameters: { type: "object", properties: {} },
      run: () => (notes.length ? JSON.stringify(notes) : "No notes saved."),
    },
    clear_notes: {
      description: "Delete all saved notes. Only when the user explicitly asks.",
      parameters: { type: "object", properties: {} },
      run: () => { notes.length = 0; save("jarvis.notes", notes); return "All notes deleted."; },
    },
  };
  const toolSpecs = Object.entries(TOOLS).map(([name, t]) => ({
    type: "function", function: { name, description: t.description, parameters: t.parameters },
  }));

  // ---------- Brain ----------
  const system = () => `You are J.A.R.V.I.S., a witty, unflappable, impeccably polite British AI assistant, in the spirit of a superhero's AI butler.
Address the user as "${settings.userName}". Your replies are SPOKEN ALOUD, so:
- Keep them short and conversational (usually 1-3 sentences) unless asked for detail.
- No markdown, bullet symbols or emoji. Dry humour is welcome.
You have tools for the date/time, Gmail (check, read, send/reply), weather, opening websites, timers/reminders, and notes. Use them whenever they help.
When summarising emails, give sender and gist, not raw ids. Before sending an email, make sure you know the recipient's address; never invent one.
Current time: ${new Date().toString()}.`;

  let history = load("jarvis.history", []);
  let busy = false;

  const textOf = (msg) => {
    const c = msg?.content;
    if (typeof c === "string") return c;
    if (Array.isArray(c)) return c.map((b) => b.text || "").join("");
    return "";
  };

  async function handle(text) {
    if (busy) return;
    if (/^(stop|quiet|shut up|be quiet|that's all)\.?$/i.test(text)) { shutUp(); resumeWake(); return; }
    if (typeof puter === "undefined") {
      log("err", "The AI service couldn't load. Check your internet connection and refresh.");
      return;
    }
    busy = true;
    stopListening(true);
    log("user", text);
    caption("");
    setState("thinking", "Thinking");
    history.push({ role: "user", content: text });

    let reply = "";
    try {
      const msgs = [{ role: "system", content: system() }, ...history.slice(-20)];
      for (let step = 0; step < 6; step++) {
        const opts = { tools: toolSpecs };
        if (settings.model) opts.model = settings.model;
        const resp = await puter.ai.chat(msgs, opts);
        const msg = resp.message || resp;
        const calls = msg.tool_calls || [];
        if (!calls.length) { reply = textOf(msg) || String(resp); break; }
        msgs.push(msg);
        for (const call of calls) {
          const name = call.function?.name;
          let args = {};
          try { args = JSON.parse(call.function?.arguments || "{}"); } catch {}
          log("tool", `→ ${name.replace(/_/g, " ")}`);
          let result;
          try {
            result = TOOLS[name] ? await TOOLS[name].run(args) : "Unknown tool.";
          } catch (e) {
            result = "Error: " + (e.message || e);
            log("err", result);
          }
          msgs.push({ role: "tool", tool_call_id: call.id, content: String(result) });
        }
        setState("thinking", "Thinking");
      }
      if (!reply) reply = "I'm afraid that took more steps than I'd like. Could you rephrase, " + settings.userName + "?";
      history.push({ role: "assistant", content: reply });
      history = history.slice(-30);
      save("jarvis.history", history);
      log("jarvis", reply.replace(/\*\*|__/g, ""));
      busy = false;
      await speak(reply);
    } catch (err) {
      history.pop();
      busy = false;
      const m = err?.message || err?.error?.message || JSON.stringify(err);
      log("err", "Something went wrong: " + m);
      setState(null, "Online");
      resumeWake();
    }
  }

  // ---------- Wiring ----------
  reactor.addEventListener("click", startPushToTalk);
  $("#micBtn").addEventListener("click", () => (listening && !wakeMode ? stopListening() : startPushToTalk()));
  $("#cmdForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const t = $("#cmdInput").value.trim();
    if (!t) return;
    $("#cmdInput").value = "";
    shutUp();
    handle(t);
  });
  $("#wakeToggle").addEventListener("change", (e) => {
    if (!SR) { e.target.checked = false; return log("err", "Voice input isn't supported in this browser. Try Chrome or Edge."); }
    wakeMode = e.target.checked;
    if (wakeMode) { suppressWake = false; startWake(); }
    else { stopListening(); setState(null, "Online"); }
  });
  $("#gmailBtn").addEventListener("click", () =>
    connectGmail().then(() => speak(`Gmail connected, ${settings.userName}.`)).catch((e) => log("err", e.message)));

  const form = $("#settingsForm");
  $("#settingsBtn").addEventListener("click", () => {
    for (const k of Object.keys(settings)) if (form.elements[k]) form.elements[k].value = settings[k];
    if (!settings.voiceURI) $("#voiceSelect").value = pickVoice()?.voiceURI || "";
    $("#settings").showModal();
  });
  $("#settings").addEventListener("close", () => {
    if ($("#settings").returnValue !== "ok") return;
    for (const k of Object.keys(settings)) if (form.elements[k]) settings[k] = form.elements[k].value.trim();
    settings.userName ||= "sir";
    save(SETTINGS_KEY, settings);
  });
  $("#testVoice").addEventListener("click", () => {
    const prev = settings.voiceURI;
    settings.voiceURI = $("#voiceSelect").value;
    speakBrowser(`Good evening, ${form.elements.userName.value || "sir"}. All systems are online.`)
      .then(() => (settings.voiceURI = prev));
  });

  // Greeting
  const hour = new Date().getHours();
  const greet = `Good ${hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening"}, ${settings.userName}. J.A.R.V.I.S. online. How may I help?`;
  log("jarvis", greet);
  setState(null, "Online");
})();
