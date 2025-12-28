// spa_cards.js - Widget to display MedSpa service cards from /api/widgets/spa_cards

function spaIsVideo(url) {
  if (!url) return false;
  const u = url.toLowerCase();
  return u.endsWith(".mp4") || u.includes(".mp4?");
}

async function spaFetchJSON(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Fetch failed: ${url} http ${res.status}`);
  return await res.json();
}

function spaApplyTheme(el, theme) {
  el.style.setProperty("--accent", theme.accent || "#2cc6c4");
  el.style.setProperty("--titleColor", theme.titleColor || "#ffffff");
  el.style.setProperty("--textColor", theme.textColor || "rgba(255,255,255,0.88)");
  el.style.setProperty("--mutedColor", theme.mutedColor || "rgba(255,255,255,0.70)");
  el.style.setProperty("--cardBg", theme.cardBg || "#0b0b0b");
}

function spaCreateCardElement(card, theme, defaults) {
  const wrap = document.createElement("div");
  wrap.className = "spaCard spaFadeIn";
  spaApplyTheme(wrap, theme);

  const url = card.media_url || "";
  const fit = card.fit || defaults.fit || "cover";

  let media;
  if (spaIsVideo(url)) {
    media = document.createElement("video");
    media.src = url;
    media.autoplay = true;
    media.loop = true;
    media.muted = true;
    media.playsInline = true;
  } else {
    media = document.createElement("img");
    media.src = url;
  }

  media.className = "spaCardMedia";
  media.style.objectFit = fit;

  const content = document.createElement("div");
  content.className = "spaCardContent";

  const tag = document.createElement("div");
  tag.className = "spaCardTag";
  tag.textContent = card.tag || "";

  const title = document.createElement("div");
  title.className = "spaCardTitle";
  title.textContent = card.title || "";

  const subtitle = document.createElement("div");
  subtitle.className = "spaCardSubtitle";
  subtitle.textContent = card.subtitle || "";

  const ul = document.createElement("ul");
  ul.className = "spaCardBullets";

  const maxBullets = card.maxBullets || defaults.maxBullets || 6;
  (card.bullets || []).slice(0, maxBullets).forEach(b => {
    const li = document.createElement("li");
    li.textContent = b;
    ul.appendChild(li);
  });

  content.appendChild(tag);
  content.appendChild(title);
  if (card.subtitle) content.appendChild(subtitle);
  if (card.bullets && card.bullets.length) content.appendChild(ul);

  wrap.appendChild(media);
  wrap.appendChild(content);

  return wrap;
}

window.SpaCardsWidget = {
  cards: [],
  theme: {},
  defaults: { duration_sec: 12, fit: "cover", maxBullets: 6 },
  idx: 0,
  timer: null,
  zoneEl: null,

  async init(zoneEl) {
    this.stop();
    this.zoneEl = zoneEl;

    const data = await spaFetchJSON("/api/widgets/spa_cards");
    this.cards = data.cards || [];
    this.theme = data.theme || {};
    this.defaults = data.defaults || { duration_sec: 12, fit: "cover", maxBullets: 6 };
    this.idx = 0;

    if (!this.cards.length) {
      zoneEl.innerHTML = "";
      return;
    }

    this.render();
  },

  render() {
    if (!this.zoneEl) return;
    this.zoneEl.innerHTML = "";

    const card = this.cards[this.idx % this.cards.length];
    this.idx++;

    const el = spaCreateCardElement(card, this.theme, this.defaults);
    this.zoneEl.appendChild(el);

    const durSec = card.duration_sec || this.defaults.duration_sec || 12;
    this.timer = setTimeout(() => this.render(), durSec * 1000);
  },

  stop() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.zoneEl) {
      try { this.zoneEl.innerHTML = ""; } catch(e) {}
    }
  }
};
