/* =====================================================================
   J5 DATA — "La Red Viva" · Interactions
   ===================================================================== */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover:hover) and (pointer:fine)").matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var rAF = window.requestAnimationFrame || function (f) { return setTimeout(f, 16); };
  var lenis = null;

  /* ---------------- PRELOADER ---------------- */
  (function boot() {
    var el = $("#boot"); if (!el) return;
    var log = $("#bootLog"), bar = $("#bootBar");
    var lines = [
      "$ j5 net --init",
      "resolviendo topología ······ <b>ok</b>",
      "handshake  SYN → SYN-ACK → ACK",
      "enlazando nodos ············ <b>6/6</b>",
      "uptime objetivo ············ <b>99.99%</b>",
      "conexión establecida ······· <b>listo</b>"
    ];
    if (reduce) { el.classList.add("done"); document.body.style.overflow = ""; return; }
    document.body.style.overflow = "hidden";
    var i = 0;
    (function step() {
      if (i < lines.length) {
        log.innerHTML = lines[i];
        if (bar) bar.style.width = Math.round(((i + 1) / lines.length) * 100) + "%";
        i++;
        setTimeout(step, i === 1 ? 260 : 200);
      } else {
        setTimeout(function () {
          el.classList.add("done");
          document.body.style.overflow = "";
          document.dispatchEvent(new Event("j5:ready"));
        }, 360);
      }
    })();
  })();

  /* ---------------- CUSTOM CURSOR ---------------- */
  (function cursor() {
    if (!fine || reduce) return;
    var r = $("#reticle"); if (!r) return;
    var ring = $(".reticle__ring", r);
    var x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y;
    window.addEventListener("mousemove", function (e) {
      x = e.clientX; y = e.clientY; r.classList.add("on");
    }, { passive: true });
    window.addEventListener("mouseout", function (e) { if (!e.relatedTarget) r.classList.remove("on"); });
    var hot = "a,button,input,textarea,.svc__card,.card,[data-cta]";
    document.addEventListener("mouseover", function (e) {
      if (e.target.closest(hot)) r.classList.add("hot"); });
    document.addEventListener("mouseout", function (e) {
      if (e.target.closest(hot)) r.classList.remove("hot"); });
    var dot = $(".reticle__dot", r);
    (function loop() {
      rx = lerp(rx, x, .2); ry = lerp(ry, y, .2);
      // position via left/top so CSS transform is free for centering + scale
      dot.style.left = x + "px"; dot.style.top = y + "px";
      ring.style.left = rx + "px"; ring.style.top = ry + "px";
      rAF(loop);
    })();
  })();

  /* ---------------- MAGNETIC + BTN GLOW ---------------- */
  (function magnetic() {
    $$(".magnetic").forEach(function (btn) {
      var glow = $(".btn__glow", btn);
      btn.addEventListener("mousemove", function (e) {
        var b = btn.getBoundingClientRect();
        var mx = e.clientX - b.left - b.width / 2;
        var my = e.clientY - b.top - b.height / 2;
        if (glow) { glow.style.setProperty("--mx", (e.clientX - b.left) + "px"); glow.style.setProperty("--my", (e.clientY - b.top) + "px"); }
        if (!fine || reduce) return;
        btn.style.transform = "translate(" + (mx * .18) + "px," + (my * .28) + "px)";
      });
      btn.addEventListener("mouseleave", function () { btn.style.transform = ""; });
    });
  })();

  /* ---------------- CARD SPOTLIGHT (cursor-follow glow) ---------------- */
  (function spotlight() {
    if (!fine) return;
    $$(".card").forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        var b = card.getBoundingClientRect();
        card.style.setProperty("--mx", (e.clientX - b.left) + "px");
        card.style.setProperty("--my", (e.clientY - b.top) + "px");
      });
      card.addEventListener("mouseleave", function () {
        card.style.setProperty("--mx", "-300px");
        card.style.setProperty("--my", "-300px");
      });
    });
  })();

  /* ---------------- NAV ---------------- */
  (function nav() {
    var nav = $("#nav"), burger = $("#burger");
    var onScroll = function () { nav.classList.toggle("scrolled", window.scrollY > 40); };
    onScroll(); window.addEventListener("scroll", onScroll, { passive: true });
    if (burger) {
      burger.addEventListener("click", function () {
        var open = nav.classList.toggle("open");
        burger.setAttribute("aria-expanded", open ? "true" : "false");
      });
      $$(".nav__links a").forEach(function (a) {
        a.addEventListener("click", function () { nav.classList.remove("open"); burger.setAttribute("aria-expanded", "false"); });
      });
    }
  })();

  /* ---------------- REVEAL (stagger + safety net) ----------------
     Primary: IntersectionObserver. Safety: a viewport sweep on
     load / ready / scroll so text can NEVER stay stuck invisible. */
  (function reveal() {
    var items = $$("[data-reveal]");
    function show(el) {
      if (el.classList.contains("in")) return;
      var sibs = el.parentElement ? $$("[data-reveal]", el.parentElement).filter(function (s) { return s.parentElement === el.parentElement; }) : [el];
      var idx = sibs.indexOf(el);
      el.style.setProperty("--d", (idx > 0 ? Math.min(idx, 6) * 0.07 : 0) + "s");
      el.classList.add("in");
      if (io) io.unobserve(el);
    }
    var io = null;
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) show(en.target); });
      }, { threshold: 0.14, rootMargin: "0px 0px -8% 0px" });
      items.forEach(function (i) { io.observe(i); });
    }
    function sweep() {
      for (var k = 0; k < items.length; k++) {
        var el = items[k];
        if (el.classList.contains("in")) continue;
        var r = el.getBoundingClientRect();
        if (r.top < innerHeight * 0.94 && r.bottom > 0) show(el);
      }
    }
    window.addEventListener("load", function () { setTimeout(sweep, 200); });
    window.addEventListener("scroll", sweep, { passive: true });
    document.addEventListener("j5:ready", function () { setTimeout(sweep, 60); });
    setTimeout(sweep, 1200); // last-resort guarantee
  })();

  /* ---------------- SCRAMBLE / DECODE TEXT ---------------- */
  function Scrambler(el, text) {
    var glyphs = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&/<>=+*";
    var frame = 0, queue = [];
    for (var i = 0; i < text.length; i++) {
      var from = "", start = Math.floor(Math.random() * 12), end = start + Math.floor(Math.random() * 22) + 12;
      queue.push({ to: text[i], start: start, end: end, char: "" });
    }
    function update() {
      var out = "", done = 0;
      for (var i = 0; i < queue.length; i++) {
        var q = queue[i];
        if (frame >= q.end) { done++; out += q.to; }
        else if (frame >= q.start) {
          if (!q.char || Math.random() < 0.28) q.char = glyphs[Math.floor(Math.random() * glyphs.length)];
          out += '<span style="color:var(--signal-2);opacity:.85">' + q.char + "</span>";
        } else out += "";
      }
      el.innerHTML = out;
      frame++;
      if (done < queue.length) rAF(update);
      else el.textContent = text;
    }
    update();
  }
  (function scrambleInit() {
    if (reduce) return;
    var targets = $$("[data-scramble-title],[data-scramble]");
    if (!("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target, txt = el.textContent;
        Scrambler(el, txt);
        io.unobserve(el);
      });
    }, { threshold: 0.5 });
    targets.forEach(function (t) { io.observe(t); });
  })();

  /* ---------------- COUNT-UP + KPI ---------------- */
  (function counters() {
    var kpis = $$(".kpi");
    var counts = $$(".count");
    var seen = new WeakSet();
    function animate(el) {
      var to = parseFloat(el.getAttribute("data-to")) || 0;
      var dec = parseInt(el.getAttribute("data-dec") || "0", 10);
      var t0 = null, dur = 1600;
      function tick(ts) {
        if (t0 === null) t0 = ts;
        var p = clamp((ts - t0) / dur, 0, 1);
        var e = 1 - Math.pow(1 - p, 3);
        el.textContent = (to * e).toFixed(dec);
        if (p < 1) rAF(tick); else el.textContent = to.toFixed(dec);
      }
      rAF(tick);
    }
    if (!("IntersectionObserver" in window)) { counts.forEach(function (c) { c.textContent = c.getAttribute("data-to"); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var k = en.target;
        if (seen.has(k)) return; seen.add(k);
        k.classList.add("in");
        var c = $(".count", k);
        if (c) { reduce ? c.textContent = c.getAttribute("data-to") : animate(c); }
        io.unobserve(k);
      });
    }, { threshold: 0.4 });
    kpis.forEach(function (k) { io.observe(k); });
  })();

  /* ---------------- SPINE / TRACEROUTE + HOPS ---------------- */
  (function spine() {
    var fill = $("#spineFill"), packet = $("#spinePacket"), hopsEl = $("#hops");
    var hops = $$(".hop");
    function onScroll() {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      var p = max > 0 ? clamp(window.scrollY / max, 0, 1) : 0;
      if (fill) fill.style.height = (p * 100) + "%";
      if (packet) packet.style.top = (p * 100) + "%";
      // hops lighting
      var lit = 0;
      hops.forEach(function (hop) {
        var b = hop.getBoundingClientRect();
        if (b.top < window.innerHeight * 0.66) { hop.classList.add("lit"); lit++; }
      });
      if (hopsEl && hops.length) hopsEl.style.setProperty("--hopfill", (lit / hops.length).toFixed(4));
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
  })();

  /* ---------------- NETWORK CANVAS ---------------- */
  function NetworkCanvas(canvas, opts) {
    if (!canvas || !canvas.getContext) return;
    opts = opts || {};
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, nodes = [], packets = [], mouse = { x: -9999, y: -9999 }, running = true, t = 0;
    var COUNT = opts.count || 46, LINK = opts.link || 150;
    var COLS = ["52,224,196", "35,195,255", "91,124,250"];

    function size() {
      var r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function build() {
      nodes = [];
      var n = Math.round(COUNT * clamp(W / 1200, .5, 1.2));
      for (var i = 0; i < n; i++) {
        nodes.push({
          x: Math.random() * W, y: Math.random() * H,
          vx: (Math.random() - .5) * .28, vy: (Math.random() - .5) * .28,
          r: Math.random() * 1.6 + 1.1, c: COLS[i % COLS.length],
          pulse: Math.random() * Math.PI * 2
        });
      }
      packets = [];
    }
    function spawnPacket() {
      if (nodes.length < 2 || packets.length > 14) return;
      var a = nodes[Math.floor(Math.random() * nodes.length)];
      var near = null, nd = LINK;
      for (var i = 0; i < nodes.length; i++) {
        var b = nodes[i]; if (b === a) continue;
        var d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < nd) { nd = d; near = b; }
      }
      if (near) packets.push({ a: a, b: near, t: 0, sp: .012 + Math.random() * .01, c: a.c });
    }
    function frame() {
      if (!running) return;
      t++;
      ctx.clearRect(0, 0, W, H);
      // update + edges
      for (var i = 0; i < nodes.length; i++) {
        var p = nodes[i];
        p.x += p.vx; p.y += p.vy; p.pulse += .03;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        // mouse repel
        var mdx = p.x - mouse.x, mdy = p.y - mouse.y, md = Math.hypot(mdx, mdy);
        if (md < 140) { var f = (140 - md) / 140 * .9; p.x += mdx / md * f; p.y += mdy / md * f; }
      }
      for (i = 0; i < nodes.length; i++) {
        for (var j = i + 1; j < nodes.length; j++) {
          var a = nodes[i], b = nodes[j];
          var d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < LINK) {
            var o = (1 - d / LINK) * .5;
            ctx.strokeStyle = "rgba(" + a.c + "," + o + ")";
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      // packets
      for (i = packets.length - 1; i >= 0; i--) {
        var pk = packets[i]; pk.t += pk.sp;
        if (pk.t >= 1) { packets.splice(i, 1); continue; }
        var x = lerp(pk.a.x, pk.b.x, pk.t), y = lerp(pk.a.y, pk.b.y, pk.t);
        ctx.beginPath(); ctx.arc(x, y, 2.4, 0, 6.28);
        ctx.fillStyle = "rgba(" + pk.c + ",1)";
        ctx.shadowBlur = 10; ctx.shadowColor = "rgba(" + pk.c + ",1)";
        ctx.fill(); ctx.shadowBlur = 0;
      }
      // nodes
      for (i = 0; i < nodes.length; i++) {
        var p2 = nodes[i], pr = p2.r + Math.sin(p2.pulse) * .5;
        ctx.beginPath(); ctx.arc(p2.x, p2.y, pr, 0, 6.28);
        ctx.fillStyle = "rgba(" + p2.c + ",.9)";
        ctx.fill();
      }
      if (t % 26 === 0) spawnPacket();
      rAF(frame);
    }
    var rt;
    function remeasure() { size(); build(); }
    window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(remeasure, 200); });
    window.addEventListener("load", remeasure);
    document.addEventListener("j5:ready", remeasure);
    // ResizeObserver fires when the element gets/changes its box — fixes 0-width init
    if ("ResizeObserver" in window) {
      new ResizeObserver(function () {
        var w = canvas.getBoundingClientRect().width;
        if (Math.abs(w - W) > 2) remeasure();
      }).observe(canvas);
    }
    if (!opts.static) {
      canvas.parentElement.addEventListener("mousemove", function (e) {
        var r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
      });
      canvas.parentElement.addEventListener("mouseleave", function () { mouse.x = mouse.y = -9999; });
    }
    // pause when offscreen
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) {
        running = es[0].isIntersecting;
        if (running) rAF(frame);
      }, { threshold: 0 }).observe(canvas);
    }
    size(); build();
    if (reduce) { // draw one static frame
      frame(); running = false;
    } else { rAF(frame); }
  }
  NetworkCanvas($("#net"), { count: 52, link: 155 });
  NetworkCanvas($("#net2"), { count: 34, link: 140 });

  /* ---------------- NOC LATENCY GRAPH ---------------- */
  (function noc() {
    var cv = $("#nocGraph"); if (!cv || !cv.getContext) return;
    var ctx = cv.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, data = [], MAX = 60, running = false;
    var nowEl = $("#nocNow"), avgEl = $("#nocAvg"), pkEl = $("#nocPk"), clockEl = $("#nocClock"), logEl = $("#nocLog");
    var base = 12;
    function size() {
      var r = cv.getBoundingClientRect(); W = r.width; H = r.height;
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    for (var i = 0; i < MAX; i++) data.push(base + Math.random() * 6);
    function next() {
      var spike = Math.random() < 0.08 ? Math.random() * 22 : 0;
      var v = base + Math.random() * 7 + spike;
      data.push(v); if (data.length > MAX) data.shift();
    }
    function stats() {
      var sum = 0, pk = 0;
      for (var i = 0; i < data.length; i++) { sum += data[i]; if (data[i] > pk) pk = data[i]; }
      if (nowEl) nowEl.textContent = data[data.length - 1].toFixed(1);
      if (avgEl) avgEl.textContent = (sum / data.length).toFixed(1);
      if (pkEl) pkEl.textContent = pk.toFixed(1);
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      // grid
      ctx.strokeStyle = "rgba(126,148,181,.09)"; ctx.lineWidth = 1;
      for (var gy = 0; gy <= 4; gy++) { var y = (H / 4) * gy; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      var top = 46, pad = 14;
      function px(i) { return (i / (MAX - 1)) * W; }
      function py(v) { return H - pad - (v / top) * (H - pad * 2); }
      // area
      var grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, "rgba(52,224,196,.28)"); grad.addColorStop(1, "rgba(52,224,196,0)");
      ctx.beginPath(); ctx.moveTo(0, H);
      for (var i = 0; i < data.length; i++) ctx.lineTo(px(i), py(data[i]));
      ctx.lineTo(W, H); ctx.closePath(); ctx.fillStyle = grad; ctx.fill();
      // line
      ctx.beginPath();
      for (i = 0; i < data.length; i++) { var X = px(i), Y = py(data[i]); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }
      ctx.strokeStyle = "#34E0C4"; ctx.lineWidth = 2; ctx.lineJoin = "round";
      ctx.shadowBlur = 8; ctx.shadowColor = "rgba(52,224,196,.6)"; ctx.stroke(); ctx.shadowBlur = 0;
      // head dot
      var lx = px(data.length - 1), ly = py(data[data.length - 1]);
      ctx.beginPath(); ctx.arc(lx, ly, 3.4, 0, 6.28); ctx.fillStyle = "#34E0C4";
      ctx.shadowBlur = 12; ctx.shadowColor = "#34E0C4"; ctx.fill(); ctx.shadowBlur = 0;
    }
    function clock() {
      var d = new Date();
      var p = function (n) { return (n < 10 ? "0" : "") + n; };
      if (clockEl) clockEl.textContent = p(d.getHours()) + ":" + p(d.getMinutes()) + ":" + p(d.getSeconds());
    }
    var logs = [
      ["ospf", "adyacencia establecida · área 0", 0],
      ["bgp", "prefijo anunciado · AS-PATH ok", 0],
      ["hci", "clúster saludable · 0 alertas", 0],
      ["sec", "política Zero Trust aplicada", 0],
      ["wan", "túnel IPsec activo · 20/20 sedes", 0],
      ["qos", "priorización de tráfico crítico", 0],
      ["ha", "failover vPC verificado", 0],
      ["mon", "latencia dentro de umbral", 1]
    ];
    function pushLog() {
      if (!logEl) return;
      var l = logs[Math.floor(Math.random() * logs.length)];
      var d = new Date(), p = function (n) { return (n < 10 ? "0" : "") + n; };
      var ts = p(d.getHours()) + ":" + p(d.getMinutes()) + ":" + p(d.getSeconds());
      var cls = l[2] ? "w" : "b";
      var row = document.createElement("div");
      row.innerHTML = '<span class="' + cls + '">[' + ts + "]</span> " + l[0].toUpperCase() + " · " + l[1];
      logEl.insertBefore(row, logEl.firstChild);
      while (logEl.children.length > 5) logEl.removeChild(logEl.lastChild);
    }
    var acc = 0, lastLog = 0;
    function loop(ts) {
      if (!running) return;
      draw();
      rAF(loop);
    }
    var iv;
    function start() {
      if (running) return; running = true;
      size();
      rAF(loop);
      iv = setInterval(function () { next(); stats(); clock(); }, 900);
      setInterval(pushLog, 2600);
      pushLog(); stats(); clock();
    }
    window.addEventListener("resize", function () { if (running) size(); });
    if (reduce) { size(); next(); stats(); clock(); draw(); pushLog(); return; }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) start();
      }, { threshold: 0.2 }).observe(cv);
    } else start();
    // safety: start on scroll if it enters the viewport and IO hasn't fired
    var fb = function () {
      if (running) { window.removeEventListener("scroll", fb); return; }
      var r = cv.getBoundingClientRect();
      if (r.top < innerHeight && r.bottom > 0) start();
    };
    window.addEventListener("scroll", fb, { passive: true });
  })();

  /* ---------------- CONTACT FORM (mailto) ---------------- */
  (function form() {
    var f = $("#leadForm"); if (!f) return;
    var note = $("#formNote");
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = $("#f-name"), email = $("#f-email"), org = $("#f-org"), msg = $("#f-msg");
      var ok = true;
      [name, email].forEach(function (i) { i.classList.remove("err"); });
      if (!name.value.trim()) { name.classList.add("err"); ok = false; }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.value)) { email.classList.add("err"); ok = false; }
      if (!ok) { note.textContent = "Revise los campos marcados, por favor."; note.classList.remove("ok"); return; }
      var body =
        "Nombre: " + name.value + "\n" +
        "Empresa: " + (org.value || "—") + "\n" +
        "Correo: " + email.value + "\n\n" +
        (msg.value || "(sin mensaje)");
      var url = "mailto:contacto@j5data.com.mx?subject=" +
        encodeURIComponent("Contacto web · " + name.value) +
        "&body=" + encodeURIComponent(body);
      window.location.href = url;
      note.textContent = "Abriendo su cliente de correo…";
      note.classList.add("ok");
    });
  })();

  /* ---------------- SMOOTH SCROLL (Lenis) + TELEMETRY HUD/RAIL ---------------- */
  (function scrollExperience() {
    // Lenis smooth scroll (buttery descent). Falls back to native if unavailable.
    if (window.Lenis && !reduce) {
      try {
        lenis = new window.Lenis({ duration: 1.1, smoothWheel: true, wheelMultiplier: 0.95, lerp: 0.09 });
        var raf = function (t) { lenis.raf(t); rAF(raf); };
        rAF(raf);
      } catch (e) { lenis = null; }
    }

    // Themed telemetry: a signal descending through the network layers.
    var STAGES = [
      { sec: "hero", cap: "BORDE" },
      { sec: "servicios", cap: "ENRUTAMIENTO" },
      { sec: "resultados", cap: "NÚCLEO" },
      { sec: "metodologia", cap: "ORQUESTACIÓN" },
      { sec: "casos", cap: "DESPLIEGUE" },
      { sec: "contacto", cap: "ENLACE" }
    ];
    var items = $$("#prail li");
    var hDepth = $("#hudDepth"), hLat = $("#hudLat"), hTh = $("#hudTh"), hHops = $("#hudHops"), hPhase = $("#hudPhase"), hBar = $("#hudBar");
    var lastStage = -1, ticking = false;
    function ease(x) { return 1 - Math.pow(1 - x, 2); }
    function update() {
      ticking = false;
      var h = document.documentElement, max = h.scrollHeight - h.clientHeight;
      var p = max > 0 ? clamp(window.scrollY / max, 0, 1) : 0;
      var idx = 0;
      for (var i = 0; i < STAGES.length; i++) {
        var el = document.getElementById(STAGES[i].sec);
        if (el && el.getBoundingClientRect().top <= innerHeight * 0.42) idx = i;
      }
      if (hDepth) {
        var e = ease(p);
        hDepth.textContent = Math.round(p * 100) + "%";
        var lat = 46 * (1 - e) + 0.4 * e; hLat.textContent = (lat < 10 ? lat.toFixed(1) : Math.round(lat)) + " ms";
        var th = 1 + 399 * e; hTh.textContent = (th < 10 ? th.toFixed(1) : Math.round(th)) + " Gbps";
        hHops.textContent = 1 + Math.round(p * 11);
        hBar.style.transform = "scaleX(" + p.toFixed(4) + ")";
        if (idx !== lastStage) {
          lastStage = idx;
          hPhase.textContent = STAGES[idx].cap;
          items.forEach(function (it, i) { it.classList.toggle("is-active", i === idx); it.classList.toggle("is-done", i < idx); });
        }
      }
    }
    function onScroll() { if (!ticking) { ticking = true; rAF(update); } }
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", update);
    window.addEventListener("load", update);
  })();

  /* ---------------- SMOOTH ANCHOR ---------------- */
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href");
      if (id.length < 2) return;
      var t = document.querySelector(id);
      if (!t) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(t, { offset: -10, duration: 1.2 });
      else t.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    });
  });

  /* ---------------- YEAR / small niceties ---------------- */
})();
