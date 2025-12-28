STATE.md — In-House Digital Signage System (Prestige)

Checkpoint: Stable_Zone_Player_Working_Before_SpaCards_Refactor
Date (UTC): 2025-12-28
Owner: Ankur Yadav
System Goal: Run in-house digital signage across multiple office locations and patient rooms using local network only (behind firewall), starting with 1 TV and scaling to many TVs + offices.

1) High-Level Summary

We are building an in-house digital signage platform so we do not pay per-screen CMS subscriptions (YoDeck, etc.).

The system consists of:

Signage Server (FastAPI on Windows PC in office)

Player (browser-based kiosk display running on TV hardware — desktop Chrome now, Raspberry Pi later)

Current screen layout is a horizontal, clean, minimal, dark-theme zoned layout:

Header zone: office name/address + phone booking message + logo

Main left zone: rotates through mixed content (images, videos, reviews, spa cards widget)

Right vertical zone: rotates YouTube Shorts + Instagram public embeds + optional local videos

Footer zone: RSS ticker + optional custom text/messages

We currently test using one screen ID: canton-tv3.

2) Current Hardware / Environment
Current Testing Environment

Windows 10/11 laptop/desktop

Running server locally behind firewall

Accessing player at:

http://127.0.0.1:8080/player-zones/canton-tv3?debug=1

Target Hardware (next phase)

Raspberry Pi 4/5 (preferred, no subscriptions)

MicroSD or SSD boot (SSD recommended)

HDMI to TV + hardwired Ethernet preferred

Player runs in kiosk mode (Chromium full-screen)

3) Current Architecture
Server

Python + FastAPI

Starts via:

uvicorn app:app --host 0.0.0.0 --port 8080


Runs inside local LAN

Player

HTML + JS (no React)

Loads a manifest JSON from server:

/api/manifest/{screen_id}

Renders zones with CSS grid

Rotates content per zone

Storage

Media: local folder signage-server/media/

Config: screens.json, zoned_demo.json

4) Folder Structure (Expected)
signage-server/
  app.py
  screens.json
  zoned_demo.json
  media/
    (jpg/mp4 content + logos)
  web/
    player_zones.html
    player_zones.js
    player_zones.css

5) How To Run (Developer Workflow)
Start Server

Open terminal in signage-server

Activate venv:

.venv\Scripts\activate


Run server:

uvicorn app:app --host 0.0.0.0 --port 8080

Test Endpoints

Health check:

http://127.0.0.1:8080/

Manifest:

http://127.0.0.1:8080/api/manifest/canton-tv3

Player:

http://127.0.0.1:8080/player-zones/canton-tv3?debug=1

Important:
If you try http://127.0.0.1:8080/player-zones/canton-tv3 without screen ID or wrong route, it will return {"detail":"Not Found"}.

6) Screen Layout Rules
Theme

Minimalistic

Dark background

Easy to read from distance

Rounded content panels

No clutter / no decorative headings

Header Format (Version A)

Left: office name/address (from screens.json)

Center: “Call or Text to Book Your Appointment” + phone number 706-692-9768

Right: office logo (based on office type: med group / spa / peds)

Footer

RSS ticker (slow, readable)

Can add local messages/images later

7) Data Sources and Content Inputs
Logos (3 Types)

Medical Group:

https://storage.googleapis.com/treatspace-prod-media/logo_thumb/p-2953/logowebpNone.webp

Med Spa:

https://storage.googleapis.com/treatspace-prod-media/logo_thumb/p-2957/logowebpNone.webp

Pediatrics:

https://storage.googleapis.com/treatspace-prod-media/logo_thumb/p-3020/logowebpNone.webp

Also stored locally in media/:

pmgSPALOGO.jpg

pmgPrimaryCareLogo.jpg

pmgPedsLogo.jpg

Gallery Images

Medical group images: img-1 to img-19

https://storage.googleapis.com/treatspace-prod-media/pracimg/u-2953/img-{n}.jpeg


Peds images: PMG_Peds4 to PMG_Peds8

https://storage.googleapis.com/treatspace-prod-media/pracimg/u-2953/PMG_Peds{n}.jpeg

YouTube Shorts (Public)

Channel ID: UCInP4-sfglG9bYMwjGDlG4w

Shorts URL: https://www.youtube.com/@PrestigeMedGroup/shorts

Requirement: randomize on startup and rotation

Instagram (Public Only, No Login)

https://www.instagram.com/prestigemedspas/?hl=en

Requirement: use stable public method, no auth, no paid tools

Reviews (Vendor SocialClimb)

We get reviews via iframe embeds:

All providers/locations:

<iframe src="https://iframe.socialclimb.com/iframe/f2e10fc1-b3b3-4349-afcd-e9507383a767/reviews?" width="720" height="400"></iframe>


Location-specific:

<iframe src="https://iframe.socialclimb.com/iframe/f2e10fc1-b3b3-4349-afcd-e9507383a767/reviews?loc=50332" width="720" height="400"></iframe>


Docs:

https://docs.socialclimb.com/api/website/

8) Local Media Files Present
Videos (examples)

handwash.mp4

Skin Classic McKinzi.mp4

cannula facts McKinzi.mp4

Caitlyn Cosmetic Injectables and Sasha.mp4

botox funny McKinzi (1).mp4

bff post McKinzi.mp4

Spa Card Background Images (added)

Facial_Treatments.jpg

Injectables.jpg

Body_Procedures.jpg

Laser_Treatments.jpg

PRP.jpg

9) Current Known Issues
Issue A — “Black Review Slide with Only 5 Golden Stars”

Sometimes the reviews widget renders only stars and no text.
This occurs intermittently and must be fixed so:

If review content fails, do not render the slide; skip and move to next.

Issue B — RSS Feeds Partially Failing

RSS widget pulls from multiple sources. Some sources fail due to:

403 Forbidden

404 Not Found

SSL certificate verify errors

Ticker still works if at least one feed works. Needs:

updated feed list + resilient fallback.

Issue C — Header bar not always reaching right edge

Minor CSS adjustment needed (header grid width / padding).

10) Current Task (Next Work Item)
? CURRENT TASK: Spa Cards Widget

Goal: Show MedSpa service category cards (Facials, Injectables, Body Procedures, Laser Treatments, PRP) in the main zone with a look/feel similar to:

https://www.prestigemedspa.org/

Design Requirements:

Clean, premium, minimal

Use category background image

Overlay text (large service name + 1 short descriptive line)

Rotate these cards like slides

Randomize order each startup

Smooth fade transitions

Should not break zone sizing or cause footer/right zone to disappear

11) User Rules / Non-Negotiables

If any file needs to change ? output the FULL file contents (no partial snippets).

Always provide step-by-step run instructions (what to stop, what to start).

Always choose stable solutions.

No Instagram login; public only.

Randomize content order on startup:

Images

YouTube

Instagram

Reviews

RSS ticker items

No headings like “Videos” or “Instagram” — zones should look clean.

Build modularly: test on one TV ? add TVs ? add offices.

12) Next Milestones (After Spa Cards)

Fix review widget to never show star-only slides

Improve RSS sources + caching

Add admin UI (Phase 2)

Add player heartbeat and device registration (Module 5)

Deploy to Raspberry Pi (kiosk mode)

Add more TVs, then expand to all offices:

canton

canton peds

canton medspa

jasper

jasper peds

jasper spa

rome spa

rome

roswell

woodstock

woodstock peds

13) Recovery Plan if “Things Break”

If player page goes blank:

Verify server is running and manifest loads.

Open DevTools ? Console ? check for JS errors.

Check manifest contract keys match player JS expectations.

Confirm RSS feed parser dependencies installed:

pip install feedparser

Restart server and hard refresh browser (Ctrl+Shift+R)

END STATE.md ?