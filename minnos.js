/* ==========================================================================
   MINNOŞ · premium interaction layer
   - macOS-style dark cinematic site
   - Pure-CSS character: gözler robotun parçası (hizalama problemi yok)
   - GSAP ScrollTrigger (native scroll — tekerlek takılması olmaması için Lenis yok)
   - Web Audio voice (no external files)
========================================================================== */

(() => {
  "use strict";

  const $  = (s, p = document) => p.querySelector(s);
  const $$ = (s, p = document) => Array.from(p.querySelectorAll(s));
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Refs ---------- */
  const BOOT       = $("#boot");
  const TOPNAV     = $("#topnav");
  const DOCK       = $("#dock");
  const DOCK_STATE = $("#dockState");
  const DOCK_TIME  = $("#dockTime");
  const CURSOR_AURA = $("#cursorAura");

  const HERO_M   = $("#heroMinnos");
  const PET_M    = $("#petMinnos");
  const COLORS_M = $("#colorsMinnos");
  const ALL_M    = [HERO_M, PET_M, COLORS_M].filter(Boolean);

  const PET_STAGE   = $("#petStage");
  const PET_HINT    = $("#petHint");
  const MOOD_ADDR   = $("#moodAddr");
  const MOOD_CHIP   = $("#moodChip");

  const SOUND_TOGGLE = $("#soundToggle");
  const COLORS_WORDMARK = $("#colorsWordmark");
  const COLORS_NOTE = $("#colorsNote");

  const REACTIONS_HERO = $("#heroReactions");
  const REACTIONS_PET  = $("#petReactions");

  const ADOPT_BTN = $("#adoptBtn");
  const CTA_THANKS = $("#ctaThanks");
  const CONFETTI_CANVAS = $("#confetti");
  const PRODUCT_VIDEO = $("#productVideo");
  const VIDEO_SHELL = $("#videoShell");
  const PET_AFFECTION = $("#petAffection");
  const TO_TOP = $("#toTop");
  const THEME_META = document.querySelector('meta[name="theme-color"]');
  const NAV_MENU_BTN = $("#navMenuBtn");
  const TOPNAV_LINKS = $("#topnavLinks");
  const NAV_BACKDROP = $("#navBackdrop");
  const MAIN_EL = $("#main");

  /* ---------- Boot sequence ---------- */
  let heroRevealed = false;
  function hideBootAndReveal() {
    BOOT?.classList.add("is-gone");
    DOCK?.classList.add("is-in");
    heroReveal();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(hideBootAndReveal, 1200));
  } else {
    setTimeout(hideBootAndReveal, 1200);
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && BOOT && !BOOT.classList.contains("is-gone")) hideBootAndReveal();
  });

  /* ---------- Topnav behaviour ---------- */
  let lastY = 0;
  function onScroll() {
    const y = window.scrollY;
    if (!TOPNAV) return;
    if (y > 60 && y > lastY) TOPNAV.classList.add("is-hidden");
    else TOPNAV.classList.remove("is-hidden");
    lastY = y;
  }
  function onScrollUx() {
    onScroll();
    const y = window.scrollY;
    TO_TOP?.classList.toggle("is-visible", y > 520);
  }
  window.addEventListener("scroll", onScrollUx, { passive: true });

  TO_TOP?.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
    $("#main")?.focus({ preventScroll: true });
  });

  function isMobileNavDrawer() {
    return matchMedia("(max-width: 560px)").matches;
  }
  function setNavMenuOpen(open) {
    if (!NAV_MENU_BTN || !TOPNAV_LINKS || !TOPNAV) return;
    const wasOpen = TOPNAV.classList.contains("has-menu-open");
    if (open === wasOpen) return;
    NAV_MENU_BTN.setAttribute("aria-expanded", open ? "true" : "false");
    NAV_MENU_BTN.setAttribute("aria-label", open ? "Menüyü kapat" : "Menüyü aç");
    TOPNAV_LINKS.classList.toggle("is-open", open);
    NAV_BACKDROP?.classList.toggle("is-open", open);
    NAV_BACKDROP?.setAttribute("aria-hidden", open ? "false" : "true");
    TOPNAV?.classList.toggle("has-menu-open", open);
    document.body.style.overflow = open ? "hidden" : "";
    if (MAIN_EL && "inert" in HTMLElement.prototype) {
      if (open) MAIN_EL.setAttribute("inert", "");
      else MAIN_EL.removeAttribute("inert");
    }
    if (open) {
      queueMicrotask(() => TOPNAV_LINKS.querySelector("a")?.focus());
    } else {
      NAV_MENU_BTN.focus({ preventScroll: true });
    }
  }
  NAV_MENU_BTN?.addEventListener("click", () => {
    const next = NAV_MENU_BTN.getAttribute("aria-expanded") !== "true";
    setNavMenuOpen(next);
  });
  NAV_BACKDROP?.addEventListener("click", () => setNavMenuOpen(false));
  TOPNAV_LINKS?.addEventListener("click", (e) => {
    if (e.target instanceof HTMLAnchorElement && isMobileNavDrawer()) setNavMenuOpen(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || !TOPNAV?.classList.contains("has-menu-open")) return;
    e.preventDefault();
    setNavMenuOpen(false);
  });
  (function navDrawerMq() {
    const mq = matchMedia("(max-width: 560px)");
    function onChange() {
      if (!mq.matches) setNavMenuOpen(false);
    }
    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else mq.addListener(onChange);
  })();

  function syncThemeMeta() {
    if (!THEME_META) return;
    const cs = getComputedStyle(document.body);
    const raw = (cs.getPropertyValue("--bg").trim() || "#02040a");
    const c = raw.replace(/^#/, "");
    if (/^[0-9a-fA-F]{6}$/i.test(c)) THEME_META.setAttribute("content", `#${c}`);
  }
  syncThemeMeta();

  function markVideoShellReady() {
    VIDEO_SHELL?.classList.add("is-ready");
    VIDEO_SHELL?.setAttribute("aria-busy", "false");
    VIDEO_SHELL?.setAttribute("aria-label", "Ürün videosu");
  }
  PRODUCT_VIDEO?.addEventListener("loadeddata", markVideoShellReady);
  PRODUCT_VIDEO?.addEventListener("error", markVideoShellReady);
  if (PRODUCT_VIDEO && PRODUCT_VIDEO.readyState >= 2) markVideoShellReady();

  /* ---------- Dock clock ---------- */
  function tickClock() {
    if (!DOCK_TIME) return;
    const d = new Date();
    DOCK_TIME.textContent = `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
  }
  tickClock();
  setInterval(tickClock, 30_000);

  /* ---------- Cursor aura ---------- */
  if (CURSOR_AURA && !reducedMotion) {
    let x = 0, y = 0, tx = 0, ty = 0;
    window.addEventListener("pointermove", (e) => { tx = e.clientX; ty = e.clientY; });
    const loop = () => {
      x += (tx - x) * 0.12;
      y += (ty - y) * 0.12;
      CURSOR_AURA.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
      requestAnimationFrame(loop);
    };
    loop();
  }

  /* ---------- Audio (Web Audio) ---------- */
  let AC = null, MASTER = null, audioOn = true;
  SOUND_TOGGLE?.addEventListener("click", () => {
    audioOn = !audioOn;
    SOUND_TOGGLE.setAttribute("aria-pressed", audioOn ? "true" : "false");
  });
  function ensureAudio() {
    if (!audioOn) return null;
    try {
      if (!AC) {
        AC = new (window.AudioContext || window.webkitAudioContext)();
        MASTER = AC.createGain();
        MASTER.gain.value = 0.16;
        MASTER.connect(AC.destination);
      }
      if (AC.state === "suspended") AC.resume();
      return AC;
    } catch { return null; }
  }
  function blip(freq, dur = 0.14, type = "sine", gain = 0.22) {
    const ctx = ensureAudio(); if (!ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(MASTER);
    o.start(t); o.stop(t + dur + 0.03);
  }
  /** Yumuşak parlak arp — mutlu an */
  function softChime(freq, dur = 0.24, peak = 0.14) {
    const ctx = ensureAudio(); if (!ctx) return;
    const t0 = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(freq, t0);
    o.frequency.exponentialRampToValueAtTime(freq * 1.012, t0 + Math.min(0.07, dur * 0.35));
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(peak, t0 + 0.028);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(MASTER);
    o.start(t0); o.stop(t0 + dur + 0.04);
  }
  /** Kısa küskün “puf” — sert değil, oyuncak gibi */
  function softGrump(freq, dur = 0.13, peak = 0.09) {
    const ctx = ensureAudio(); if (!ctx) return;
    const t0 = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "triangle";
    o.frequency.setValueAtTime(freq, t0);
    o.frequency.exponentialRampToValueAtTime(freq * 0.86, t0 + dur * 0.9);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(peak, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(MASTER);
    o.start(t0); o.stop(t0 + dur + 0.04);
  }
  const happySeq = () => {
    const notes = [523.25, 659.25, 783.99, 880];
    notes.forEach((f, i) => setTimeout(() => softChime(f, 0.28, 0.14), i * 86));
  };
  const angrySeq = () => {
    [360, 300, 248].forEach((f, i) => setTimeout(() => softGrump(f, 0.15, 0.088), i * 108));
  };
  const sleepSeq = () => { blip(180, 0.4, "sine", 0.1); setTimeout(() => blip(140, 0.6, "sine", 0.08), 240); };
  const pick     = () => blip(520, 0.06, "triangle", 0.14);

  /* ---------- Emotion (CSS character) ---------- */
  const EMOTIONS = new Set(["", "happy", "angry", "sleepy", "surprised", "focused"]);
  function setEmotion(el, emo) {
    if (!el) return;
    el.setAttribute("data-emotion", EMOTIONS.has(emo) ? emo : "");
  }
  function setAllEmotion(emo) { ALL_M.forEach(el => setEmotion(el, emo)); }

  /* ---------- Random micro-look on eyes ---------- */
  function randomLook() {
    if (reducedMotion) return;
    const x = (Math.random() * 5 - 2.5).toFixed(1) + "px";
    const y = (Math.random() * 2 - 1).toFixed(1) + "px";
    [COLORS_M, PET_M].filter(Boolean).forEach(m => {
      m.style.setProperty("--eye-x", x);
      m.style.setProperty("--eye-y", y);
    });
  }
  setInterval(() => {
    if (document.visibilityState !== "visible") return;
    randomLook();
  }, 2400);

  /* ---------- Mood state ---------- */
  let mood = "meraklı";
  function setMood(m) {
    mood = m;
    if (MOOD_ADDR) MOOD_ADDR.textContent = `minnoş · ${m}`;
    if (MOOD_CHIP) MOOD_CHIP.textContent = m;
    if (DOCK_STATE) DOCK_STATE.querySelector("span:last-child").textContent = `minnoş · ${m}`;
  }
  setMood("meraklı");

  /* ---------- Reactions particles ---------- */
  function emitReactions(container, items = ["✨", "♡"], count = 10) {
    if (!container || reducedMotion) return;
    for (let i = 0; i < count; i++) {
      const span = document.createElement("span");
      span.className = "rx";
      span.textContent = items[i % items.length];
      container.appendChild(span);
      const x = (Math.random() * 200 - 100);
      const y = -(60 + Math.random() * 160);
      const rot = (Math.random() * 80 - 40);
      const dur = 900 + Math.random() * 800;
      span.animate(
        [
          { transform: `translate(-50%, -50%) translate(0, 0) rotate(0deg)`, opacity: 0 },
          { transform: `translate(-50%, -50%) translate(${x*0.3}px, ${y*0.35}px) rotate(${rot*0.4}deg)`, opacity: 1, offset: 0.25 },
          { transform: `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${rot}deg)`, opacity: 0 },
        ],
        { duration: dur, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
      );
      setTimeout(() => span.remove(), dur + 50);
    }
  }

  /* ---------- Emotion triggers ---------- */
  let happyTimer, angryTimer, wake = Date.now();
  function bounce(el) { el?.classList.remove("is-bouncing"); void el?.offsetWidth; el?.classList.add("is-bouncing"); setTimeout(() => el?.classList.remove("is-bouncing"), 700); }
  function shake(el)  { el?.classList.remove("is-shaking"); void el?.offsetWidth; el?.classList.add("is-shaking");  setTimeout(() => el?.classList.remove("is-shaking"), 500); }

  function triggerHappy() {
    happySeq();
    setEmotion(HERO_M, "happy");
    setEmotion(PET_M, "happy");
    emitReactions(REACTIONS_HERO, ["♡", "✦", "✿"], 8);
    emitReactions(REACTIONS_PET,  ["♡", "✦", "✿"], 10);
    setMood("mutlu");
    bounce(PET_M); bounce(HERO_M);
    clearTimeout(happyTimer);
    happyTimer = setTimeout(() => {
      setEmotion(PET_M, "");
      setEmotion(HERO_M, "");
      setMood("meraklı");
    }, 3000);
  }
  function triggerAngry() {
    angrySeq();
    setEmotion(PET_M, "angry");
    setEmotion(HERO_M, "angry");
    emitReactions(REACTIONS_PET, ["💢", "✖"], 7);
    setMood("küskün");
    shake(PET_M); shake(HERO_M);
    clearTimeout(angryTimer);
    angryTimer = setTimeout(() => {
      setEmotion(PET_M, "");
      setEmotion(HERO_M, "");
      setMood("meraklı");
    }, 3200);
  }
  function triggerSleep() {
    if (mood === "uyuyor") return;
    sleepSeq();
    setAllEmotion("sleepy");
    setMood("uyuyor");
  }
  function wakeUp() {
    if (mood !== "uyuyor") return;
    setAllEmotion("");
    setMood("meraklı");
  }

  /* ---------- Pet interaction (single/double tap) ---------- */
  let lastTap = 0, tapCount = 0, tapTimer = null;
  function handleTap() {
    const now = Date.now();
    wake = now;
    wakeUp();
    tapCount++;
    const since = now - lastTap;
    lastTap = now;
    clearTimeout(tapTimer);
    if (tapCount >= 2 && since < 380) {
      tapCount = 0;
      triggerAngry();
      pick();
      return;
    }
    tapTimer = setTimeout(() => {
      if (tapCount === 1) { triggerHappy(); pick(); }
      tapCount = 0;
    }, 300);
  }
  PET_STAGE?.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleTap(); } });
  HERO_M?.addEventListener("click", handleTap);

  /* ---------- Drag-to-spin 3D cube (interaktif Minnoş) ---------- */
  const PET_CUBE = document.getElementById("petCube");
  let _blockTap = false;

  if (PET_STAGE && PET_CUBE && !reducedMotion) {
    let isDown = false, wasDragged = false;
    let startX = 0, startY = 0, lastX = 0, lastY = 0;
    let rotX = 15, rotY = -20;
    let velX = 0, velY = 0;
    let rafId = null;

    function applyRot() {
      PET_CUBE.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
    }
    applyRot();

    function drift() {
      velX *= 0.88; velY *= 0.88;
      rotX += velX; rotY += velY;
      applyRot();
      if (Math.abs(velX) > 0.06 || Math.abs(velY) > 0.06) {
        rafId = requestAnimationFrame(drift);
      } else { rafId = null; }
    }

    PET_STAGE.addEventListener("pointerdown", (e) => {
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      isDown = true; wasDragged = false;
      startX = lastX = e.clientX;
      startY = lastY = e.clientY;
      velX = velY = 0;
      PET_CUBE.style.transition = "none";
      PET_STAGE.setPointerCapture(e.pointerId);
    });

    PET_STAGE.addEventListener("pointermove", (e) => {
      if (!isDown) {
        // hover → gözler imleci takip eder
        const r = PET_STAGE.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        PET_M?.style.setProperty("--eye-x", `${px * 5}px`);
        PET_M?.style.setProperty("--eye-y", `${py * 3}px`);
        return;
      }
      const dx = e.clientX - lastX, dy = e.clientY - lastY;
      velY = dx * 0.55; velX = -(dy * 0.55);
      rotX += velX; rotY += velY;
      applyRot();
      lastX = e.clientX; lastY = e.clientY;
      if (Math.hypot(e.clientX - startX, e.clientY - startY) > 6) wasDragged = true;
    });

    PET_STAGE.addEventListener("pointerup", () => {
      if (!isDown) return;
      isDown = false;
      PET_CUBE.style.transition = "";
      if (wasDragged) {
        _blockTap = true;
        rafId = requestAnimationFrame(drift);
      }
    });

    PET_STAGE.addEventListener("pointercancel", () => { isDown = false; });

    PET_STAGE.addEventListener("pointerleave", () => {
      if (!isDown) {
        PET_M?.style.setProperty("--eye-x", "0px");
        PET_M?.style.setProperty("--eye-y", "0px");
      }
    });
  }

  // tap = duygu tetikle (sadece drag olmadıysa)
  PET_STAGE?.addEventListener("click", () => {
    if (_blockTap) { _blockTap = false; return; }
    handleTap();
    PET_HINT?.classList.add("is-hidden");
  });

  /* ---------- Pet OLED: ara sıra sevgi satırı ---------- */
  let affectionIv = null;
  let affectionHideT = null;
  function clearPetAffectionLoop() {
    if (affectionIv) { clearTimeout(affectionIv); affectionIv = null; }
    if (affectionHideT) { clearTimeout(affectionHideT); affectionHideT = null; }
    PET_AFFECTION?.classList.remove("is-on");
  }
  function schedulePetAffection(delayMs) {
    if (!PET_AFFECTION || reducedMotion) return;
    clearTimeout(affectionIv);
    const wait = typeof delayMs === "number" ? delayMs : 15000 + Math.random() * 24000;
    affectionIv = setTimeout(() => {
      affectionIv = null;
      if (document.visibilityState !== "visible") return;
      if (mood === "uyuyor") {
        schedulePetAffection(4000);
        return;
      }
      const em = PET_M?.getAttribute("data-emotion");
      if (em === "happy" || em === "angry" || em === "surprised") {
        schedulePetAffection(2200);
        return;
      }
      const lines = [
        "sen çok değerlisin",
        "iyi ki varsın",
        "sen yeterlisin",
        "minnoş seni çok seviyo",
        "kalbin kocaman",
      ];
      PET_AFFECTION.textContent = lines[Math.floor(Math.random() * lines.length)];
      PET_AFFECTION.classList.add("is-on");
      affectionHideT = setTimeout(() => {
        PET_AFFECTION.classList.remove("is-on");
        affectionHideT = null;
        schedulePetAffection();
      }, 4400);
    }, wait);
  }
  if (PET_STAGE && PET_AFFECTION && "IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      const on = entries.some(e => e.isIntersecting && e.intersectionRatio > 0.06);
      if (on) {
        if (!affectionIv && !affectionHideT) schedulePetAffection();
      } else {
        clearPetAffectionLoop();
      }
    }, { threshold: [0, 0.06, 0.12, 0.2] }).observe(PET_STAGE);
  }

  /* ---------- Idle sleep ---------- */
  ["pointermove", "pointerdown", "keydown", "scroll", "touchstart"].forEach(ev => {
    window.addEventListener(ev, () => { wake = Date.now(); if (mood === "uyuyor") wakeUp(); }, { passive: true });
  });
  setInterval(() => {
    if (Date.now() - wake > 18_000 && document.visibilityState === "visible") triggerSleep();
  }, 3000);

  /* ---------- Color swatches (theme swap) ---------- */
  const SWATCHES = $$(".swatch");
  const NOTE_MAP = {
    yosun: "Emerald Elite: altın aksanlı koyu orman.",
    gece:  "Crystal Midnight: siyah zemin, buz mavisi parıltı ve gümüş metal.",
    gri:   "Steel Sophistication: krom ve antrasit.",
    pembe: "Pink Crystal: bordo zemin, pembe parıltı ve yumuşak cam ışığı.",
    sari:  "Golden Opulence: bronz ve altın tozu.",
    beyaz: "Platinum Pure: kristal, platin ve kırık beyaz.",
  };
  function selectSwatch(btn) {
    if (!btn) return;
    const color = btn.dataset.color;
    const word  = btn.dataset.word || "";
    const name  = btn.querySelector(".swatch__name")?.textContent || "";

    SWATCHES.forEach(s => s.setAttribute("aria-checked", s === btn ? "true" : "false"));
    document.body.setAttribute("data-theme", color);
    syncThemeMeta();

    if (COLORS_WORDMARK) {
      COLORS_WORDMARK.innerHTML = word.split(/\s+/).map(l => `<span>${l}</span>`).join("");
      if (window.gsap && !reducedMotion) {
        window.gsap.fromTo(COLORS_WORDMARK.children,
          { y: 30, opacity: 0, filter: "blur(14px)" },
          { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.8, stagger: 0.05, ease: "power3.out" }
        );
      }
    }
    if (COLORS_NOTE) {
      COLORS_NOTE.innerHTML = `<span>Şu an:</span> <strong>${name}</strong> — ${NOTE_MAP[color] || ""}`;
    }

    pick();
    setAllEmotion("surprised");
    clearTimeout(selectSwatch._t);
    selectSwatch._t = setTimeout(() => setAllEmotion(""), 900);
  }
  SWATCHES.forEach(s => s.addEventListener("click", () => selectSwatch(s)));

  const SWATCH_CONTAINER = document.querySelector(".swatches");
  SWATCH_CONTAINER?.addEventListener("keydown", (e) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
    e.preventDefault();
    const idx = SWATCHES.findIndex(s => s.getAttribute("aria-checked") === "true");
    if (e.key === "Home") { selectSwatch(SWATCHES[0]); SWATCHES[0]?.focus(); return; }
    if (e.key === "End")  { selectSwatch(SWATCHES[SWATCHES.length - 1]); SWATCHES[SWATCHES.length - 1]?.focus(); return; }
    const next = e.key === "ArrowRight" ? Math.min(SWATCHES.length - 1, idx + 1) : Math.max(0, idx - 1);
    selectSwatch(SWATCHES[next]);
    SWATCHES[next]?.focus();
  });

  /* ---------- CTA confetti ---------- */
  ADOPT_BTN?.addEventListener("click", () => {
    happySeq();
    setAllEmotion("happy");
    confettiBurst();
    CTA_THANKS?.classList.add("is-in");
    setTimeout(() => setAllEmotion(""), 3200);
    const subj = encodeURIComponent("Minnoş — sahiplenme talebi");
    const body = encodeURIComponent("Merhaba,\n\nMinnoş hakkında bilgi almak / sipariş sürecini konuşmak istiyorum.\n\nTeşekkürler,");
    window.location.href = `mailto:info@makinafleo.com?subject=${subj}&body=${body}`;
  });

  /* ---------- Nav scroll spy ---------- */
  const NAV_LINKS = $$(".topnav__links a[data-nav]");
  const SECTION_IDS = ["colors", "features", "materials", "touch", "meet", "cta"];
  const sections = SECTION_IDS.map(id => document.getElementById(id)).filter(Boolean);
  if (NAV_LINKS.length && sections.length && "IntersectionObserver" in window) {
    const obs = new IntersectionObserver((entries) => {
      const vis = entries.filter(e => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!vis?.target?.id) return;
      const id = vis.target.id;
      NAV_LINKS.forEach(a => {
        const on = a.getAttribute("data-nav") === id;
        a.classList.toggle("is-active", on);
        if (on) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
      });
    }, { root: null, rootMargin: "-18% 0px -55% 0px", threshold: [0.08, 0.16, 0.28, 0.42] });
    sections.forEach(s => obs.observe(s));
    const h = (location.hash || "").replace("#", "");
    if (h) {
      NAV_LINKS.forEach(a => {
        const on = a.getAttribute("data-nav") === h;
        a.classList.toggle("is-active", on);
        if (on) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
      });
    }
  }

  function confettiBurst() {
    if (!CONFETTI_CANVAS || reducedMotion) return;
    const c = CONFETTI_CANVAS;
    const rect = c.parentElement.getBoundingClientRect();
    c.width  = rect.width  * devicePixelRatio;
    c.height = rect.height * devicePixelRatio;
    c.style.width  = rect.width  + "px";
    c.style.height = rect.height + "px";
    const ctx = c.getContext("2d");
    ctx.scale(devicePixelRatio, devicePixelRatio);
    const palette = themedPalette();
    const N = 160;
    const parts = [];
    for (let i = 0; i < N; i++) {
      parts.push({
        x: rect.width / 2, y: rect.height * 0.55,
        vx: (Math.random() - 0.5) * 14,
        vy: -(6 + Math.random() * 12),
        g: 0.35 + Math.random() * 0.2,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
        s: 4 + Math.random() * 7,
        c: palette[i % palette.length],
        kind: Math.random() > 0.6 ? "heart" : "rect",
        life: 0, max: 2200 + Math.random() * 900
      });
    }
    const t0 = performance.now();
    (function frame(t) {
      ctx.clearRect(0, 0, rect.width, rect.height);
      let alive = 0;
      parts.forEach(p => {
        p.life = t - t0;
        p.vy += p.g;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        if (p.life >= p.max) return;
        alive++;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = Math.max(0, 1 - p.life / p.max);
        ctx.fillStyle = p.c;
        if (p.kind === "heart") drawHeart(ctx, p.s); else ctx.fillRect(-p.s/2, -p.s/2, p.s, p.s*0.6);
        ctx.restore();
      });
      if (alive > 0) requestAnimationFrame(frame);
      else ctx.clearRect(0, 0, rect.width, rect.height);
    })(performance.now());
  }
  function drawHeart(ctx, s) {
    const r = s * 0.5;
    ctx.beginPath();
    ctx.moveTo(0, r * 0.4);
    ctx.bezierCurveTo(0, 0, -r, 0, -r, -r * 0.4);
    ctx.bezierCurveTo(-r, -r, 0, -r * 0.9, 0, -r * 0.5);
    ctx.bezierCurveTo(0, -r * 0.9, r, -r, r, -r * 0.4);
    ctx.bezierCurveTo(r, 0, 0, 0, 0, r * 0.4);
    ctx.closePath();
    ctx.fill();
  }
  function themedPalette() {
    const cs = getComputedStyle(document.body);
    const pick = (v, fb) => (cs.getPropertyValue(v).trim() || fb);
    return [
      pick("--accent",   "#c5a059"),
      pick("--accent-2", "#f3d291"),
      pick("--glow-1",   "#10b981"),
      pick("--glow-2",   "#059669"),
      pick("--particle-1", "rgba(243,210,145,0.78)"),
      pick("--ink",      "#e8ece9"),
    ];
  }

  /* ---------- Hero cinematic reveal ---------- */
  function heroReveal() {
    if (heroRevealed) return;
    heroRevealed = true;
    if (!window.gsap || reducedMotion) return;
    const g = window.gsap;
    const tl = g.timeline({ defaults: { ease: "power3.out" } });
    tl.from(".colors--welcome .caption", { opacity: 0, y: 20, filter: "blur(8px)",  duration: 0.7 })
      .from(".colors__title",             { opacity: 0, y: 54, filter: "blur(14px)", duration: 1.0 }, "-=0.42")
      .from(".colors--welcome .lead",     { opacity: 0, y: 20, filter: "blur(8px)",  duration: 0.75 }, "-=0.55")
      .from("#colorsStage",               { opacity: 0, y: 34, scale: 0.985, filter: "blur(10px)", duration: 1.1 }, "-=0.5")
      .from(".colors__controls",          { opacity: 0, y: 18, filter: "blur(8px)", duration: 0.75 }, "-=0.55");
  }

  /* ---------- ScrollTrigger reveals ---------- */
  function bindScrollReveals() {
    if (!window.gsap || !window.ScrollTrigger) return;
    const g = window.gsap;
    g.registerPlugin(window.ScrollTrigger);

    $$(".reveal").forEach(el => {
      if (el.closest(".colors--welcome")) return; // first screen handled separately
      g.fromTo(el,
        { opacity: 0, y: 28, filter: "blur(10px)" },
        {
          opacity: 1, y: 0, filter: "blur(0px)",
          duration: 1, ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 88%", once: true }
        }
      );
    });

    // Parallax on window scenes
    $$(".window").forEach(w => {
      g.to(w, {
        yPercent: -3,
        ease: "none",
        scrollTrigger: { trigger: w, start: "top bottom", end: "bottom top", scrub: 0.45, fastScrollEnd: true }
      });
    });

    // Subtle depth on the first product stage
    g.to("#colorsStage .minnos", {
      yPercent: -6,
      ease: "none",
      scrollTrigger: { trigger: "#colors", start: "top top", end: "bottom top", scrub: 0.45, fastScrollEnd: true }
    });
  }

  /* ---------- Init when libs ready ---------- */
  function whenReady(fn, tries = 0) {
    if (window.gsap && window.ScrollTrigger) return fn();
    if (tries > 80) return fn();
    setTimeout(() => whenReady(fn, tries + 1), 50);
  }
  whenReady(() => {
    bindScrollReveals();
    window.ScrollTrigger?.refresh();
  });

  // Boot with current checked swatch
  const initialSwatch = SWATCHES.find(s => s.getAttribute("aria-checked") === "true");
  if (initialSwatch) selectSwatch(initialSwatch);

})();
