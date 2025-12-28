(function(){
  const params = new URLSearchParams(location.search);
  const debug = params.get("debug") === "1";

  const screenId = (location.pathname.split("/").pop() || "").trim();

  const $title = document.getElementById("hdrTitle");
  const $sub = document.getElementById("hdrSub");
  const $phone = document.getElementById("hdrPhone");
  const $logo = document.getElementById("hdrLogo");

  const $main = document.getElementById("mainZone");
  const $right = document.getElementById("rightZone");
  const $ticker = document.getElementById("footerTicker");

  let manifest = null;
  let mainIdx = 0;
  let rightIdx = 0;
  let mainTimer = null;
  let rightTimer = null;

  function log(...args){ if(debug) console.log("[player]", ...args); }

  function setHeader(m){
    $title.textContent = m.header_title || "Prestige";
    $sub.textContent = m.header_subtitle || "";
    $phone.textContent = m.phone || "706-692-9768";
    if(m.logo_url) $logo.src = m.logo_url;
  }

  async function loadManifest(){
    const res = await fetch(`/api/manifest/${encodeURIComponent(screenId)}`, {cache:"no-store"});
    const data = await res.json();
    if(!data.ok) throw new Error(data.error || "manifest failed");
    manifest = data;
    setHeader(manifest);
    renderTicker();
    startLoops();
    log("manifest", manifest);
  }

  async function renderTicker(){
    try{
      const res = await fetch("/api/widgets/rss_ticker", {cache:"no-store"});
      const data = await res.json();
      const items = (data.items || []).map(x=>x.text).filter(Boolean);
      const text = items.length ? items.join("  •  ") : "Ask about our wellness & aesthetic services today.";
      $ticker.innerHTML = `<span>${escapeHtml(text)}</span>`;
    }catch(e){
      $ticker.innerHTML = `<span>Ask about our wellness & aesthetic services today.</span>`;
    }
  }

  function startLoops(){
    stopLoops();
    mainIdx = 0;
    rightIdx = 0;
    showMain();
    showRight();
  }

  function stopLoops(){
    clearTimeout(mainTimer); clearTimeout(rightTimer);
    mainTimer = null; rightTimer = null;
    $main.innerHTML = "";
    $right.innerHTML = "";
  }

  function showMain(){
    const items = manifest.main_items || [];
    if(!items.length) return;
    const item = items[mainIdx % items.length];
    mainIdx++;
    renderItem($main, item);
    mainTimer = setTimeout(showMain, (item.duration || 12) * 1000);
  }

  function showRight(){
    const items = manifest.right_items || [];
    if(!items.length) return;
    const item = items[rightIdx % items.length];
    rightIdx++;
    renderItem($right, item, true);
    rightTimer = setTimeout(showRight, (item.duration || 18) * 1000);
  }

  function renderItem(container, item, isRight=false){
    container.innerHTML = "";
    container.style.background = "transparent";
    container.style.display = "flex";
    container.style.alignItems = "center";
    container.style.justifyContent = "center";

    if(!item || !item.type){
      container.innerHTML = "";
      return;
    }

    if(item.type === "spa_card"){
      container.appendChild(renderSpaCard(item));
      return;
    }

    if(item.type === "image"){
      const img = document.createElement("img");
      img.src = item.url;
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "cover";
      container.appendChild(img);
      return;
    }

    if(item.type === "video"){
      const v = document.createElement("video");
      v.src = item.url;
      v.autoplay = true;
      v.muted = true;
      v.loop = true;
      v.playsInline = true;
      v.style.width = "100%";
      v.style.height = "100%";
      v.style.objectFit = "cover";
      container.appendChild(v);
      return;
    }

    if(item.type === "youtube" || item.type === "instagram"){
      const frame = document.createElement("iframe");
      frame.src = item.url;
      frame.allow = "autoplay; encrypted-media; picture-in-picture";
      frame.referrerPolicy = "no-referrer-when-downgrade";
      frame.style.width = "100%";
      frame.style.height = "100%";
      frame.style.border = "0";
      container.appendChild(frame);
      return;
    }

    // fallback
    container.innerHTML = "";
  }

  function renderSpaCard(item){
    const wrap = document.createElement("div");
    wrap.className = "spa-card";

    const bg = document.createElement("div");
    bg.className = "spa-card-bg";
    bg.style.backgroundImage = `url('${item.bg || ""}')`;

    const grad = document.createElement("div");
    grad.className = "spa-card-gradient";

    const content = document.createElement("div");
    content.className = "spa-card-content";

    const kicker = document.createElement("div");
    kicker.className = "spa-kicker";
    kicker.textContent = "Prestige MedSpa";

    const title = document.createElement("div");
    title.className = "spa-title";
    title.textContent = item.title || "";

    const subtitle = document.createElement("div");
    subtitle.className = "spa-subtitle";
    subtitle.textContent = item.subtitle || "";

    const list = document.createElement("ul");
    list.className = "spa-list";
    (item.items || []).slice(0,6).forEach(txt=>{
      const li = document.createElement("li");
      li.textContent = txt;
      list.appendChild(li);
    });

    content.appendChild(kicker);
    content.appendChild(title);
    content.appendChild(subtitle);
    content.appendChild(list);

    wrap.appendChild(bg);
    wrap.appendChild(grad);
    wrap.appendChild(content);
    return wrap;
  }

  function escapeHtml(str){
    return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
  }

  loadManifest().catch(err=>{
    console.error(err);
    $ticker.innerHTML = `<span>Startup error: ${escapeHtml(err.message)}</span>`;
  });
})();