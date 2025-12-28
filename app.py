from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import json
import random
import time

APP_DIR = Path(__file__).resolve().parent
WEB_DIR = APP_DIR / "web"
MEDIA_DIR = APP_DIR / "media"

SCREENS_JSON = APP_DIR / "screens.json"
ZONED_DEMO_JSON = APP_DIR / "zoned_demo.json"

app = FastAPI()

# Static
if WEB_DIR.exists():
    app.mount("/web", StaticFiles(directory=str(WEB_DIR)), name="web")
if MEDIA_DIR.exists():
    app.mount("/media", StaticFiles(directory=str(MEDIA_DIR)), name="media")


def load_json(path: Path):
    if not path.exists():
        raise FileNotFoundError(f"Missing JSON file: {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def pick_logo_for_office(office: dict):
    # office can include explicit logo_url, else choose by office_type
    if office.get("logo_url"):
        return office["logo_url"]
    office_type = (office.get("type") or office.get("office_type") or "").lower()
    # default to spa logo to match current deployment
    if "peds" in office_type:
        return "/media/pmgPedsLogo.jpg"
    if "primary" in office_type or "medical" in office_type:
        return "/media/pmgPrimaryCareLogo.jpg"
    return "/media/pmgSPALOGO.jpg"


def build_spa_cards():
    # Uses media images if present; falls back to remote placeholders.
    return [
        {"type":"spa_card","duration":12,"bg":"/media/Facial_Treatments.jpg","title":"Hydrafacial","subtitle":"Deep cleansing + hydration for glowing skin.","items":["Vampire Facial","Chemical Peels","Dermaplaning","Microneedling","Threads"]},
        {"type":"spa_card","duration":12,"bg":"/media/Injectables.jpg","title":"Injectables","subtitle":"Natural-looking results with expert placement.","items":["Fillers","Juvederm","Restylane","Sculptra","Botox","Dysport","Kybella"]},
        {"type":"spa_card","duration":12,"bg":"/media/Body_Procedures.jpg","title":"Body Procedures","subtitle":"Confidence-focused contouring and rejuvenation.","items":["Body Contouring (Evolve X)","Sculptra Butt Lift","Vaginal Rejuvenation (FormaV)"]},
        {"type":"spa_card","duration":12,"bg":"/media/Laser_Treatments.jpg","title":"Laser Treatments","subtitle":"Advanced laser & RF technology for smooth skin.","items":["Laser Hair Reduction","Laser Vein Reduction","Laser Skin Tightening","Skin Resurfacing","Radiofrequency Treatments"]},
        {"type":"spa_card","duration":12,"bg":"/media/PRP.jpg","title":"PRP","subtitle":"Regenerative treatments for skin + hair.","items":["PRP Facial","PRP Hair Restoration","PRP Under Eyes"]},
    ]


def build_manifest(screen_id: str):
    # Basic manifest used by player_zones.js
    screens = load_json(SCREENS_JSON)
    demo = load_json(ZONED_DEMO_JSON)
    screen = screens.get(screen_id) or screens.get("default") or {}
    layout_id = screen.get("layout_id") or demo.get("layout_id") or "layout-horizontal_4zone_v1"

    office = screen.get("office") or {}
    logo_url = pick_logo_for_office(office)

    header_title = screen.get("header_title") or office.get("name") or "Prestige"
    header_subtitle = screen.get("header_subtitle") or office.get("address") or ""
    phone = screen.get("phone") or "706-692-9768"

    # Main playlist: use whatever demo has, else spa cards
    main_items = screen.get("main_items") or demo.get("main_items") or build_spa_cards()
    right_items = screen.get("right_items") or demo.get("right_items") or [
        {"type":"youtube","duration":18,"url":"https://www.youtube.com/embed?listType=playlist&list=UUInP4-sfglG9bYMwjGDlG4w"},
        {"type":"instagram","duration":18,"url":"https://www.instagram.com/prestigemedspas/embed"},
    ]
    footer_items = screen.get("footer_items") or demo.get("footer_items") or [{"type":"rss_ticker","duration":9999}]

    # Randomize starts for better variety
    random.shuffle(main_items)
    random.shuffle(right_items)

    return {
        "ok": True,
        "manifest_id": f"{int(time.time())}-{random.randint(1000,9999)}",
        "layout_id": layout_id,
        "header_title": header_title,
        "header_subtitle": header_subtitle,
        "phone": phone,
        "logo_url": logo_url,
        "main_items": main_items,
        "right_items": right_items,
        "footer_items": footer_items,
    }


@app.get("/player-zones/{screen_id}", response_class=HTMLResponse)
def player_zones_page(screen_id: str, debug: int = 0):
    html_path = WEB_DIR / "player_zones.html"
    html = html_path.read_text(encoding="utf-8")
    # pass screen_id/debug via querystring; html already reads location.search
    return HTMLResponse(html)


@app.get("/api/manifest/{screen_id}")
def api_manifest(screen_id: str):
    try:
        manifest = build_manifest(screen_id)
        return JSONResponse(manifest)
    except Exception as e:
        return JSONResponse({"ok": False, "error": str(e)}, status_code=500)


@app.get("/api/widgets/header_info")
def widget_header_info(screen_id: str):
    # lightweight endpoint so JS can refresh header without reloading full manifest
    screens = load_json(SCREENS_JSON)
    demo = load_json(ZONED_DEMO_JSON)
    screen = screens.get(screen_id) or screens.get("default") or {}
    office = screen.get("office") or {}
    logo_url = pick_logo_for_office(office)
    return {
        "ok": True,
        "header_title": screen.get("header_title") or office.get("name") or "Prestige",
        "header_subtitle": screen.get("header_subtitle") or office.get("address") or "",
        "phone": screen.get("phone") or "706-692-9768",
        "logo_url": logo_url,
        "layout_id": screen.get("layout_id") or demo.get("layout_id") or "layout-horizontal_4zone_v1",
    }


@app.get("/api/widgets/rss_ticker")
def rss_ticker():
    # keep existing simple ticker without external deps
    return {"ok": True, "items": [{"type": "headline", "text": "Ask about our wellness & aesthetic services today."}]}
