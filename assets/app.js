(() => {
  const $ = sel => document.querySelector(sel);
  const store = {
    get(key, fallback) {
      try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
    },
  };

  /* ---------------- Tabs ---------------- */
  function showView(name) {
    document.querySelectorAll(".tab").forEach(t => t.classList.toggle("active", t.dataset.view === name));
    document.querySelectorAll(".view").forEach(v => v.classList.toggle("active", v.id === "view-" + name));
    if (name === "search" && !searchFrame.src) goSearch("");
    if (name === "ai") $("#chatInput").focus();
    history.replaceState(null, "", "#" + name);
  }
  document.querySelectorAll(".tab").forEach(t => t.addEventListener("click", () => showView(t.dataset.view)));

  /* ---------------- Games ---------------- */
  let customGames = store.get("customGames", []);
  let favorites = new Set(store.get("favorites", []));
  let recent = store.get("recent", []);
  let activeCat = "All";
  let current = null;

  const allGames = () => [...customGames.map(g => ({ ...g, cat: "My Games", custom: true })), ...window.GAMES];

  function colorFor(name) {
    let h = 0;
    for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360;
    return `linear-gradient(135deg, hsl(${h} 70% 45%), hsl(${(h + 50) % 360} 70% 30%))`;
  }

  function card(game) {
    const el = document.createElement("button");
    el.className = "card";
    el.innerHTML = `
      <div class="thumb" style="background:${colorFor(game.name)}"></div>
      <div class="info"><div class="name"></div><div class="cat"></div></div>`;
    el.querySelector(".thumb").textContent = game.emoji || "🎮";
    el.querySelector(".name").textContent = game.name;
    el.querySelector(".cat").textContent = game.cat;
    if (game.hot) el.insertAdjacentHTML("beforeend", `<span class="badge">HOT</span>`);
    if (game.custom) {
      const del = document.createElement("span");
      del.className = "del";
      del.textContent = "✕";
      del.title = "Remove";
      del.addEventListener("click", e => {
        e.stopPropagation();
        customGames = customGames.filter(g => g.url !== game.url);
        store.set("customGames", customGames);
        renderGames();
      });
      el.appendChild(del);
    } else if (favorites.has(game.name)) {
      el.insertAdjacentHTML("beforeend", `<span class="fav">★</span>`);
    }
    el.addEventListener("click", () => openGame(game));
    return el;
  }

  function renderChips() {
    const cats = ["All", "★ Favorites", ...new Set(allGames().map(g => g.cat))];
    const wrap = $("#chips");
    wrap.innerHTML = "";
    for (const c of cats) {
      const b = document.createElement("button");
      b.className = "chip" + (c === activeCat ? " active" : "");
      b.textContent = c;
      b.addEventListener("click", () => { activeCat = c; renderGames(); });
      wrap.appendChild(b);
    }
  }

  function renderGames() {
    renderChips();
    const q = $("#gameFilter").value.trim().toLowerCase();
    const list = allGames().filter(g =>
      (activeCat === "All" || g.cat === activeCat || (activeCat === "★ Favorites" && favorites.has(g.name))) &&
      (!q || g.name.toLowerCase().includes(q) || g.cat.toLowerCase().includes(q)));
    const grid = $("#gameGrid");
    grid.replaceChildren(...list.map(card));
    $("#noGames").hidden = list.length > 0;
    $("#allTitle").textContent = `${activeCat === "All" ? "All games" : activeCat} (${list.length})`;

    const byName = new Map(allGames().map(g => [g.name, g]));
    const recentGames = recent.map(n => byName.get(n)).filter(Boolean);
    $("#recentWrap").hidden = !recentGames.length || !!q || activeCat !== "All";
    $("#recentGrid").replaceChildren(...recentGames.map(card));
  }

  function openGame(game) {
    current = game;
    $("#pTitle").textContent = game.name;
    $("#pFrame").src = game.url;
    $("#pNewTab").href = game.url;
    $("#pFav").textContent = favorites.has(game.name) ? "★" : "☆";
    $("#player").hidden = false;
    recent = [game.name, ...recent.filter(n => n !== game.name)].slice(0, 8);
    store.set("recent", recent);
  }

  function closeGame() {
    $("#player").hidden = true;
    $("#pFrame").src = "about:blank";
    if (document.fullscreenElement) document.exitFullscreen();
    current = null;
    renderGames();
  }

  $("#pClose").addEventListener("click", closeGame);
  $("#pReload").addEventListener("click", () => { $("#pFrame").src = current.url; });
  $("#pFull").addEventListener("click", () => {
    const f = $("#pFrame");
    (f.requestFullscreen || f.webkitRequestFullscreen).call(f);
  });
  $("#pFav").addEventListener("click", () => {
    favorites.has(current.name) ? favorites.delete(current.name) : favorites.add(current.name);
    store.set("favorites", [...favorites]);
    $("#pFav").textContent = favorites.has(current.name) ? "★" : "☆";
  });
  $("#gameFilter").addEventListener("input", renderGames);

  $("#addGameBtn").addEventListener("click", () => { $("#addForm").reset(); $("#addDialog").showModal(); });
  $("#addDialog").addEventListener("close", () => {
    if ($("#addDialog").returnValue !== "ok") return;
    const data = new FormData($("#addForm"));
    customGames.push({ name: data.get("name").trim(), url: data.get("url").trim(), emoji: data.get("emoji").trim() || "🎮" });
    store.set("customGames", customGames);
    activeCat = "My Games";
    renderGames();
  });

  /* ---------------- In-page search ---------------- */
  const searchFrame = $("#searchFrame");

  function toUrl(text) {
    const t = text.trim();
    if (!t) return "https://www.google.com/webhp?igu=1";
    if (/^https?:\/\//i.test(t)) return t;
    if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(t)) return "https://" + t;
    // igu=1 is the Google mode that allows being shown inside an iframe
    return "https://www.google.com/search?igu=1&q=" + encodeURIComponent(t);
  }

  function goSearch(text) {
    const url = toUrl(text);
    searchFrame.src = url;
    $("#sNewTab").href = url;
  }

  $("#searchForm").addEventListener("submit", e => { e.preventDefault(); goSearch($("#searchInput").value); });
  $("#sHome").addEventListener("click", () => { $("#searchInput").value = ""; goSearch(""); });

  /* ---------------- AI chat ---------------- */
  const SYSTEM = "You are a friendly, helpful assistant built into a student website. Answer clearly and concisely. Use markdown for code and lists.";
  let messages = [];
  let busy = false;

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  // Small markdown renderer: code blocks, inline code, bold, italics, headings, lists, links.
  function md(text) {
    const blocks = [];
    let s = escapeHtml(text).replace(/```(\w*)\n?([\s\S]*?)(```|$)/g, (_, lang, code) => {
      blocks.push(`<pre><code>${code}</code></pre>`);
      return `\u0000${blocks.length - 1}\u0000`;
    });
    s = s
      .replace(/`([^`\n]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>")
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      .replace(/^#{1,6} (.*)$/gm, "<strong>$1</strong>")
      .replace(/^\s*[-*] (.*)$/gm, "• $1");
    s = s.split(/\n{2,}/).map(p => `<p>${p.replace(/\n/g, "<br>")}</p>`).join("");
    return s.replace(/\u0000(\d+)\u0000/g, (_, i) => blocks[i]);
  }

  function addMsg(role, text) {
    const wrap = document.createElement("div");
    wrap.className = "msg " + role;
    const b = document.createElement("div");
    b.className = "bubble";
    if (role === "user") b.textContent = text; else b.innerHTML = md(text);
    wrap.appendChild(b);
    $("#chatLog").appendChild(wrap);
    $("#chatLog").scrollTop = $("#chatLog").scrollHeight;
    return b;
  }

  async function sendChat(text) {
    if (busy || !text.trim()) return;
    if (typeof puter === "undefined") {
      addMsg("bot", "The AI service couldn't load. Check your internet connection (or whether js.puter.com is blocked) and refresh.").classList.add("err");
      return;
    }
    busy = true;
    $("#chatSend").disabled = true;
    addMsg("user", text);
    messages.push({ role: "user", content: text });
    const bubble = addMsg("bot", "");
    bubble.classList.add("typing");
    let reply = "";
    try {
      const stream = await puter.ai.chat([{ role: "system", content: SYSTEM }, ...messages], { stream: true });
      for await (const part of stream) {
        if (part?.text) {
          reply += part.text;
          bubble.innerHTML = md(reply);
          $("#chatLog").scrollTop = $("#chatLog").scrollHeight;
        }
      }
      messages.push({ role: "assistant", content: reply });
    } catch (err) {
      messages.pop();
      bubble.classList.add("err");
      bubble.textContent = "Something went wrong: " + (err?.message || err?.error?.message || JSON.stringify(err));
    } finally {
      bubble.classList.remove("typing");
      busy = false;
      $("#chatSend").disabled = false;
    }
  }

  const chatInput = $("#chatInput");
  $("#chatForm").addEventListener("submit", e => {
    e.preventDefault();
    const text = chatInput.value;
    chatInput.value = "";
    chatInput.style.height = "";
    sendChat(text);
  });
  chatInput.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); $("#chatForm").requestSubmit(); }
  });
  chatInput.addEventListener("input", () => {
    chatInput.style.height = "auto";
    chatInput.style.height = chatInput.scrollHeight + "px";
  });
  $("#chatClear").addEventListener("click", () => {
    messages = [];
    $("#chatLog").innerHTML = "";
    addMsg("bot", "New chat started. What do you want to know?");
  });

  /* ---------------- Init ---------------- */
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && !$("#player").hidden && !document.fullscreenElement) closeGame();
  });
  renderGames();
  const start = location.hash.slice(1);
  if (["games", "search", "ai"].includes(start)) showView(start);
})();
