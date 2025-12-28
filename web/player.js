(async function () {
  const stage = document.getElementById("stage");
  const overlay = document.getElementById("overlay");

  const parts = window.location.pathname.split("/");
  const screenId = parts[parts.length - 1];

  const debug = new URLSearchParams(location.search).get("debug") === "1";
  if (debug) overlay.style.display = "block";

  let manifestId = null;
  let manifest = null;
  let index = 0;
  let timer = null;
  let currentEl = null;

  function setBg(color) {
    document.body.style.background = color || "#000";
  }

  function clearStage() {
    if (timer) { clearTimeout(timer); timer = null; }
    if (currentEl) {
      try { if (currentEl.pause) currentEl.pause(); } catch(e) {}
      currentEl.remove();
      currentEl = null;
    }
  }

  async function fetchManifest() {
    const res = await fetch(`/api/manifest/${encodeURIComponent(screenId)}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`manifest http ${res.status}`);
    return await res.json();
  }

  function showOverlay(text) {
    if (!debug) return;
    overlay.textContent = text;
  }

  async function playNext() {
    if (!manifest || !manifest.playlist || !manifest.playlist.items || manifest.playlist.items.length === 0) {
      clearStage();
      showOverlay("No playlist items");
      timer = setTimeout(playNext, 5000);
      return;
    }

    const items = manifest.playlist.items;
    const item = items[index % items.length];
    index++;

    clearStage();
    setBg(item.background);

    if (item.type === "image") {
      const img = document.createElement("img");
      img.src = `/media/${encodeURIComponent(item.asset_id)}`;
      img.className = (item.fit === "cover") ? "cover" : "contain";
      currentEl = img;
      stage.appendChild(img);

      const dur = Math.max(2, parseInt(item.duration_sec || 10, 10));
      showOverlay(`screen=${screenId}\nmanifest=${manifest.manifest_id}\nIMAGE ${item.asset_id}\nduration=${dur}s`);
      timer = setTimeout(playNext, dur * 1000);

      img.onerror = () => {
        showOverlay(`ERROR loading image: ${item.asset_id}`);
        timer = setTimeout(playNext, 3000);
      };
    } else if (item.type === "video") {
      const vid = document.createElement("video");
      vid.src = `/media/${encodeURIComponent(item.asset_id)}`;
      vid.autoplay = true;
      vid.loop = false;
      vid.muted = !!item.mute;
      vid.playsInline = true;
      vid.className = (item.fit === "cover") ? "cover" : "contain";
      currentEl = vid;
      stage.appendChild(vid);

      showOverlay(`screen=${screenId}\nmanifest=${manifest.manifest_id}\nVIDEO ${item.asset_id}\nmute=${!!item.mute}`);

      vid.onended = () => playNext();
      vid.onerror = () => {
        showOverlay(`ERROR loading video: ${item.asset_id}`);
        timer = setTimeout(playNext, 3000);
      };
    } else {
      showOverlay(`Unknown item type: ${item.type}`);
      timer = setTimeout(playNext, 3000);
    }
  }

  async function mainLoop() {
    try {
      const m = await fetchManifest();
      if (!manifestId || manifestId !== m.manifest_id || m.force_reload) {
        manifestId = m.manifest_id;
        manifest = m;
        index = 0;
        await playNext();
      }
    } catch (e) {
      showOverlay(`Manifest error: ${e.message}`);
    } finally {
      setTimeout(mainLoop, 5000);
    }
  }

  mainLoop();
})();
