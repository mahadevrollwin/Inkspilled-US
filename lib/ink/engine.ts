import { HERO_VIDEO } from "@/lib/config";
import { WORK, type InkName } from "@/lib/data";
import { applyChrome, chrome, watchChrome } from "@/lib/ink/chrome";
import { FRAGMENT_SHADER } from "@/lib/ink/shader";
import { StainLayer, pageInk } from "@/lib/ink/stains";
import { parseKey, sameView, type Route } from "@/lib/routes";

const pad = (n: number) => String(n).padStart(2, "0");
const clamp = (v: number, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (t: number) => t * t * (3 - 2 * t);
const spread = (tau: number, T: number) =>
  tau <= 0 ? 0 : clamp(0.64 * (1 - Math.exp(-tau / 0.3)) + (0.36 * Math.log(1 + tau / 0.8)) / Math.log(1 + T / 0.8));

const hex = (h: string) => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => c / 255);
};

const INKS = {
  red: { core: hex("#3A0705"), lit: hex("#EE2F27"), palA: hex("#EE2F27"), palB: hex("#6A1A8C") },
  green: { core: hex("#062710"), lit: hex("#78C145"), palA: hex("#78C145"), palB: hex("#0F7DC2") },
  blue: { core: hex("#04163A"), lit: hex("#1E8FD6"), palA: hex("#0F7DC2"), palB: hex("#7A2E9E") },
};
const HEROPAL = { palA: hex("#0F7DC2"), palB: hex("#EE2F27") };
const STY = {
  tendril: [24, 70, 20, 44, 0.5, 9, 70],
  fibre: [16, 26, 40, 66, 0.3, 5, 150],
  bloom: [38, 18, 12, 34, 0.95, 4, 60],
  bleed: [28, 40, 10, 100, 0.6, 14, 40],
  row: [10, 16, 12, 26, 0.5, 12, 120],
  card: [12, 14, 10, 26, 0.6, 6, 90],
  blob: [16, 20, 14, 30, 0.7, 7, 80],
} as const;

type StyleName = keyof typeof STY;
type InkDef = (typeof INKS)[InkName];

type InkSpec = {
  o: [number, number];
  ink: InkName;
  st: StyleName;
  delay: number;
  reach?: number;
  seed: number;
};

type Station = {
  el: HTMLElement;
  mode: "heroA" | "heroB" | "panel" | "foot";
  creep: number;
  inks: InkSpec[];
  noDraw?: boolean;
  top?: boolean;
  cell?: number;
  tau: number;
  scrub: number;
  target: boolean;
  amts: number[];
  mseed: number;
};

type Item = {
  el: HTMLElement;
  box: HTMLElement;
  kind: "row" | "card" | "visible";
  ink: InkName;
  amt: number;
  tau: number;
  ox: number;
  oy: number;
  seed: number;
  hov: boolean;
  tag?: boolean;
  cell?: number;
};

type Geo = { rect: number[]; mrect: number[]; ox: number; oy: number; Rfull: number; radf: number };

type View = {
  route: Route;
  stations: Station[];
  items: Item[];
  onResize?: () => void;
  frame?: () => void;
};

type Draw = {
  g: Geo;
  R: number;
  pal: { palA: number[]; palB: number[] } | null;
  media: number;
  st: readonly number[];
  ink: InkDef;
  seed: number;
  mtype: number;
  lobe: number;
  phase: number[];
  amt?: number;
  fade?: number;
  mask?: boolean;
  cell?: number;
};

export type EngineOptions = {
  fontFamily: string;
  /** Every photo the ink can blend in; packed into one texture. */
  images: string[];
  onCommit: (route: Route, fromHistory: boolean) => void;
  onOpenReel: () => void;
  onOpenTalk: () => void;
};

const DROP_R = 12;
const N = 4;
// Photos are packed into one texture: ATLAS_COLS per row, 4:3 cells, at most ATLAS_MAX_ROWS rows.
const ATLAS_COLS = 4;
const ATLAS_MAX_ROWS = 10;
const CELL_W = 512;
const CELL_H = 384;

function compile(g: WebGLRenderingContext, fs: string) {
  const pr = g.createProgram();
  if (!pr) throw new Error("Could not create the ink program");
  (
    [
      [g.VERTEX_SHADER, "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}"],
      [g.FRAGMENT_SHADER, fs],
    ] as const
  ).forEach(([t, src]) => {
    const s = g.createShader(t);
    if (!s) throw new Error("Could not create an ink shader");
    g.shaderSource(s, src);
    g.compileShader(s);
    if (!g.getShaderParameter(s, g.COMPILE_STATUS)) {
      const log = g.getShaderInfoLog(s) || "no log";
      throw new Error(`ink ${t === g.FRAGMENT_SHADER ? "fragment" : "vertex"} shader (${src.length} chars): ${log}`);
    }
    g.attachShader(pr, s);
  });
  g.linkProgram(pr);
  g.useProgram(pr);
  const b = g.createBuffer();
  g.bindBuffer(g.ARRAY_BUFFER, b);
  g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), g.STATIC_DRAW);
  const l = g.getAttribLocation(pr, "p");
  g.enableVertexAttribArray(l);
  g.vertexAttribPointer(l, 2, g.FLOAT, false, 0, 0);
  return pr;
}

function initStation(s: Omit<Station, "tau" | "scrub" | "target" | "amts" | "mseed"> & Partial<Station>): Station {
  const station = s as Station;
  station.tau = 0;
  station.scrub = 0;
  station.target = false;
  station.amts = station.inks.map(() => 0);
  station.inks.forEach((k) => {
    k.seed = Math.random() * 40;
  });
  station.mseed = Math.random() * 40;
  return station;
}

export class InkEngine {
  private reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  private touch = window.matchMedia("(hover: none)").matches;
  private ac = new AbortController();
  private viewAbort: AbortController | null = null;
  private unwatch = () => {};
  private alive = true;
  private raf = 0;

  private gl: WebGLRenderingContext | null = null;
  private U: Record<string, WebGLUniformLocation | null> = {};
  private vtex: WebGLTexture | null = null;
  private ttex: WebGLTexture | null = null;
  private ptex: WebGLTexture | null = null;
  private videoReady = false;
  private videoAR = 16 / 9;
  private atlasReady = false;
  private atlasCanvas: HTMLCanvasElement | null = null;
  private atlasRows = 1;
  private cells = new Map<string, number>();
  private typeReady = false;

  private thumbGL: WebGLRenderingContext | null = null;
  private thumbProg: WebGLProgram | null = null;
  private thumbCanvas: HTMLCanvasElement | null = null;
  private stains: StainLayer | null = null;

  private vw = 0;
  private vh = 0;
  private dpr = 1;
  private quality = 1;
  private view: View | null = null;
  route: Route;

  private loaded: boolean;
  private loadT0 = performance.now();

  private ptr = { x: window.innerWidth * 0.5, y: window.innerHeight * 0.5, moved: 0 };
  private blob = {
    x: 0,
    y: 0,
    amt: 0,
    tau: 0,
    ink: "blue" as InkName,
    pal: "blue" as InkName,
    seed: Math.random() * 40,
    hov: false,
    cell: -1,
  };
  private flood: {
    state: "idle" | "in" | "out";
    amt: number;
    x: number;
    y: number;
    ink: InkName;
    route: Route | null;
    seed: number;
    fromHistory: boolean;
  } = { state: "idle", amt: 0, x: 0, y: 0, ink: "blue", route: null, seed: Math.random() * 40, fromHistory: false };

  private foot: Station;
  private drop = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    state: "docked" as "docked" | "follow" | "flow",
    docked: null as Station | null,
    t: 0,
    from: null as { x: number; y: number } | null,
    ink: INKS.green.core.slice(),
    fromInk: null as number[] | null,
  };
  private trail: { x: number; y: number; r: number }[] = [];
  private trailClock = 0;
  private typeCurZ = 0;
  private heroMorph = 0;

  private A: Record<string, Float32Array> = {};
  private fade = new Float32Array(N);
  private mask = new Float32Array(N);
  private atlas = new Float32Array(N * 4);
  private radii = new WeakMap<Element, number>();
  private pa = new Float32Array(N * 3);
  private pb = new Float32Array(N * 3);
  private trA = new Float32Array(18);
  private last = performance.now();
  private time = 0;
  private slow = 0;

  constructor(
    private opts: EngineOptions,
    route: Route,
  ) {
    this.route = route;
    this.loaded = this.reduced;
    this.foot = initStation({
      el: document.getElementById("contact") as HTMLElement,
      mode: "foot",
      creep: 12,
      inks: [
        { o: [0.5, 1.0], ink: "blue", st: "tendril", delay: 0, seed: 0 },
        { o: [0.1, 1.02], ink: "red", st: "bleed", delay: 0.3, reach: 0.3, seed: 0 },
        { o: [0.92, 1.02], ink: "green", st: "fibre", delay: 0.55, reach: 0.26, seed: 0 },
      ],
    });
    (["rect", "orig", "st", "st2", "core", "light", "mrect", "phase"] as const).forEach((k) => {
      this.A[k] = new Float32Array(N * 4);
    });
  }

  start() {
    const { signal } = this.ac;
    chrome.locked = !this.reduced;
    applyChrome();
    this.unwatch = watchChrome();
    this.bindInput(signal);
    const stainCanvas = document.getElementById("stains");
    if (stainCanvas instanceof HTMLCanvasElement) this.stains = new StainLayer(stainCanvas, this.reduced);
    this.initGL();
    this.resize();
    this.attach(true);
    if (this.drop.docked) {
      const g = this.inkGeo(this.drop.docked, this.drop.docked.inks[0]);
      this.drop.x = g.ox;
      this.drop.y = g.oy;
    }
    if (!this.gl) {
      this.finishLoader();
      document.querySelectorAll<HTMLElement>(".on-ink,.panel .cap,.foot .inner").forEach((e) => {
        e.style.opacity = "1";
      });
    }
    this.raf = requestAnimationFrame(this.frame);
  }

  destroy() {
    this.alive = false;
    cancelAnimationFrame(this.raf);
    this.ac.abort();
    this.viewAbort?.abort();
    this.unwatch();
    this.gl = null;
    this.thumbGL = null;
  }

  scrollToAnchor(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY + (id === "work" ? 0 : -20);
    const top = id === "contact" ? document.documentElement.scrollHeight : y;
    window.scrollTo({ top, behavior: this.reduced ? "auto" : "smooth" });
  }

  goKey(key: string, x?: number, y?: number, ink?: string) {
    this.goRoute(parseKey(key, this.view?.route ?? this.route), x, y, ink, false);
  }

  goRoute(route: Route, x?: number, y?: number, ink?: string, fromHistory = false) {
    if (this.flood.state !== "idle") return;
    const current = this.view?.route ?? this.route;
    if (
      route.type === "home" &&
      current.type === "home" &&
      route.variant === current.variant &&
      route.anchor
    ) {
      this.scrollToAnchor(route.anchor);
      return;
    }
    if (sameView(route, current) && !(route.type === "home" && route.anchor)) return;
    const color = (ink || "blue") as InkName;
    if (this.reduced || !this.gl) {
      this.route = route;
      this.opts.onCommit(route, fromHistory);
      return;
    }
    this.flood = {
      state: "in",
      amt: 0,
      x: x ?? this.vw / 2,
      y: y ?? this.vh / 2,
      ink: INKS[color] ? color : "blue",
      route,
      seed: this.flood.seed,
      fromHistory,
    };
    chrome.flooding = true;
    chrome.locked = true;
    applyChrome();
    document.getElementById("cur")?.classList.remove("on");
  }

  attach(resetDrop: boolean) {
    this.heroMorph = 0;
    this.viewAbort?.abort();
    this.viewAbort = new AbortController();
    const signal = this.viewAbort.signal;
    const route = this.route;
    const stations: Station[] = [];
    const items: Item[] = [];
    const hooks: Pick<View, "onResize" | "frame"> = {};

    if (route.type === "home") {
      const hero = document.getElementById("hero");
      const about = document.getElementById("aboutPanel");
      if (!hero || !about) return;
      if (route.variant === "b") {
        stations.push(
          initStation({
            el: hero,
            mode: "heroB",
            creep: 10,
            inks: [{ o: [0.5, 0.5], ink: "green", st: "tendril", delay: 0, seed: 0 }],
            noDraw: true,
          }),
        );
      } else {
        stations.push(
          initStation({
            el: hero,
            mode: "heroA",
            creep: 12,
            inks: [
              { o: [0.28, 0.42], ink: "green", delay: 0, st: "tendril", seed: 0 },
              { o: [0.7, 0.3], ink: "blue", delay: 0.28, st: "fibre", seed: 0 },
              { o: [0.56, 0.74], ink: "red", delay: 0.55, st: "bloom", seed: 0 },
            ],
          }),
        );
      }
      stations.push(
        initStation({
          el: about,
          mode: "panel",
          creep: 11,
          inks: [{ o: [0.35, 0.4], ink: "red", st: "fibre", delay: 0, seed: 0 }],
          cell: this.cellOf(about.dataset.img),
        }),
      );
      document.querySelectorAll<HTMLElement>("#svc li").forEach((li) => {
        const cell = this.cellOf(li.dataset.img);
        const it = this.makeItem(li, li, "row", (li.dataset.color || "red") as InkName, { cell });
        this.hoverize(it, signal);
        items.push(it);
      });
      document.querySelectorAll<HTMLElement>(".card").forEach((c) => {
        const th = c.querySelector<HTMLElement>(".thumb");
        if (!th) return;
        const cell = this.cellOf(c.dataset.img);
        const it = this.makeItem(c, th, "card", (c.dataset.ink || "blue") as InkName, { tag: true, cell });
        this.hoverize(it, signal);
        items.push(it);
        const canvas = th.querySelector("canvas");
        if (canvas) this.paintThumb(canvas, it.ink, it.seed, cell);
      });
      const work = document.getElementById("work");
      const track = document.getElementById("track");
      const wbar = document.getElementById("wbar");
      const wpos = document.getElementById("wpos");
      const stmt = document.getElementById("statement");
      const heroPin = document.getElementById("heroPin");
      const words = stmt ? [...stmt.querySelectorAll<HTMLElement>(".w")] : [];
      if (work && track) hooks.onResize = () => {
        work.style.height = `${track.scrollWidth - this.vw + this.vh + 40}px`;
      };
      hooks.frame = () => {
        if (work && track && wbar && wpos) {
          const b = work.getBoundingClientRect();
          const range = Math.max(1, work.offsetHeight - this.vh);
          const p = clamp(-b.top / range);
          track.style.transform = `translateX(${-p * Math.max(0, track.scrollWidth - this.vw + 40)}px)`;
          wbar.style.setProperty("--wp", `${(p * 100).toFixed(1)}%`);
          wpos.textContent = `${pad(Math.min(WORK.length, 1 + Math.floor(p * WORK.length * 0.999)))} / ${pad(WORK.length)}`;
        }
        if (stmt) {
          const b = stmt.getBoundingClientRect();
          const p = clamp((this.vh * 0.85 - b.top) / (this.vh * 0.75));
          const n = words.length;
          words.forEach((w, i) => {
            w.style.opacity = (0.13 + 0.87 * smooth(clamp(p * n * 1.1 - i))).toFixed(3);
          });
        }
        const hs = stations[0];
        const morph = route.variant === "a" ? this.heroMorph : 0;
        const coverage = route.variant === "b" ? (1 - this.typeQ()) * smooth(clamp(this.typeP() * 2.2)) : Math.max(...hs.amts);
        const hv = coverage * (1 - morph);
        heroPin?.style.setProperty("--tp", smooth(clamp((hv - 0.3) / 0.3)).toFixed(3));
        heroPin?.style.setProperty("--hm", morph.toFixed(3));
        const veil = document.getElementById("heroVeil");
        if (veil) veil.style.opacity = smooth(clamp((morph - 0.08) / 0.72)).toFixed(3);
        const title = document.getElementById("heroTitle");
        if (title) {
          title.style.opacity = "1";
          title.style.color = morph > 0.84 ? "transparent" : "";
        }
        stations[1].el.style.setProperty("--cp", smooth(clamp((stations[1].amts[0] - 0.5) / 0.25)).toFixed(3));
      };
      if (route.variant === "b") {
        const fonts = document.fonts;
        (fonts?.load ? fonts.load(`800 100px ${this.opts.fontFamily}`) : Promise.resolve())
          .catch(() => undefined)
          .then(() => {
            if (this.view?.route.type === "home" && this.view.route.variant === "b") this.buildType();
          });
      } else {
        this.typeReady = false;
        this.prepareHeroType();
      }
    } else {
      const panel = document.getElementById("pagePanel");
      if (!panel) return;
      const ink = (panel.dataset.ink || "blue") as InkName;
      stations.push(
        initStation({
          el: panel,
          mode: "panel",
          top: true,
          creep: 12,
          cell: this.cellOf(panel.dataset.img),
          inks: [
            { o: [0.18, 0.3], ink, st: route.type === "post" ? "bleed" : "fibre", delay: 0, seed: 0 },
            { o: [0.82, 0.8], ink: ink === "blue" ? "red" : "blue", st: "bloom", delay: 0.45, reach: 0.42, seed: 0 },
          ],
        }),
      );
      document.querySelectorAll<HTMLElement>("[data-frame]").forEach((f) => {
        items.push(this.makeItem(f, f, "visible", (f.dataset.frame || ink) as InkName, { ox: 0.25, oy: 0.3, cell: this.cellOf(f.dataset.img) }));
      });
      document.querySelectorAll<HTMLElement>("[data-row]").forEach((a) => {
        const it = this.makeItem(a, a, "row", (a.dataset.row || "blue") as InkName);
        this.hoverize(it, signal);
        items.push(it);
      });
      document.querySelectorAll<HTMLElement>(".rcard").forEach((c) => {
        const th = c.querySelector<HTMLElement>(".thumb");
        if (!th) return;
        const cell = this.cellOf(c.dataset.img);
        const it = this.makeItem(c, th, "card", (c.dataset.ink || "blue") as InkName, { tag: true, cell });
        this.hoverize(it, signal);
        items.push(it);
        const canvas = th.querySelector("canvas");
        if (canvas) this.paintThumb(canvas, it.ink, it.seed, cell);
      });
      const rb = document.getElementById("readbar");
      const body = document.querySelector<HTMLElement>(".post-body");
      hooks.frame = () => {
        panel.style.setProperty("--cp", smooth(clamp((Math.max(...stations[0].amts) - 0.5) / 0.25)).toFixed(3));
        if (rb && body) {
          const b = body.getBoundingClientRect();
          rb.style.setProperty("--rp", `${(clamp((this.vh * 0.4 - b.top) / (b.height - this.vh * 0.3)) * 100).toFixed(1)}%`);
        }
      };
    }

    document.querySelectorAll<HTMLElement>("[data-blob]").forEach((li) => {
      li.addEventListener(
        "pointerenter",
        (e) => {
          if (e.pointerType === "touch") return;
          if (this.blob.amt < 0.05) {
            this.blob.x = e.clientX;
            this.blob.y = e.clientY;
          }
          this.blob.hov = true;
          this.blob.ink = (li.dataset.blob || "blue") as InkName;
          this.blob.pal = (li.dataset.pal || this.blob.ink) as InkName;
          this.blob.cell = this.cellOf(li.dataset.img) ?? -1;
        },
        { signal },
      );
      li.addEventListener("pointerleave", () => {
        this.blob.hov = false;
      }, { signal });
    });
    this.blob.hov = false;
    this.blob.amt = 0;
    this.view = { route, stations, items, ...hooks };
    this.stains?.load(route);
    if (resetDrop && stations[0]) {
      this.foot.tau = 0;
      this.drop.state = "docked";
      this.drop.docked = stations[0];
      stations[0].tau = 0;
    }
    this.resize();
  }

  private bindInput(signal: AbortSignal) {
    const cur = document.getElementById("cur");
    window.addEventListener(
      "pointermove",
      (e) => {
        this.ptr.x = e.clientX;
        this.ptr.y = e.clientY;
        this.ptr.moved = performance.now();
        if (this.touch || !cur) return;
        const t = (e.target as Element | null)?.closest?.("[data-cursor]") as HTMLElement | null;
        if (t) {
          cur.textContent = t.dataset.cursor || "";
          cur.classList.add("on");
        } else cur.classList.remove("on");
        cur.style.left = `${e.clientX}px`;
        cur.style.top = `${e.clientY}px`;
      },
      { signal, passive: true },
    );
    window.addEventListener("resize", () => {
      this.resize();
      if (this.view?.route.type === "home" && this.view.route.variant === "b") this.buildType();
      else if (this.view?.route.type === "home") this.buildHeroType();
    }, { signal });
    document.addEventListener(
      "click",
      (e) => {
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        const target = e.target as Element | null;
        if (this.view && !target?.closest?.("input,textarea,.switch,dialog,[role=dialog]")) {
          const src = target?.closest?.("[data-ink],[data-color],[data-blob]") as HTMLElement | null;
          this.stains?.add(e.clientX, e.clientY, src?.dataset.ink || src?.dataset.color || src?.dataset.blob || pageInk(this.view.route));
        }
        if (target?.closest?.("[data-talk]")) {
          e.preventDefault();
          this.opts.onOpenTalk();
          return;
        }
        const g = target?.closest?.("[data-go]") as HTMLElement | null;
        if (g) {
          e.preventDefault();
          const key = g.dataset.go || "home";
          this.goKey(key, e.clientX || this.vw / 2, e.clientY || this.vh / 2, g.dataset.ink || g.dataset.color || g.dataset.row || g.dataset.blob);
          return;
        }
        const t = target?.closest?.("[data-goto]") as HTMLElement | null;
        if (t) {
          e.preventDefault();
          const a = t.dataset.goto || "";
          const onHome = this.view?.route.type === "home";
          if (a === "contact" || (onHome && document.getElementById(a))) this.scrollToAnchor(a);
          else this.goKey(a, e.clientX, e.clientY, "blue");
          return;
        }
        if (target?.closest?.("[data-reel]")) this.opts.onOpenReel();
      },
      { signal },
    );
    window.addEventListener(
      "keydown",
      (e) => {
        if (e.key !== "Enter") return;
        const g = (e.target as Element | null)?.closest?.("[data-go][tabindex]") as HTMLElement | null;
        if (!g) return;
        const r = g.getBoundingClientRect();
        this.goKey(g.dataset.go || "home", r.left + r.width / 2, r.top + r.height / 2, g.dataset.ink || g.dataset.color || g.dataset.blob);
      },
      { signal },
    );
  }

  private initGL() {
    const attrs: WebGLContextAttributes = { antialias: false, premultipliedAlpha: true, alpha: true, powerPreference: "high-performance" };
    const found = document.getElementById("ink");
    let cv = found instanceof HTMLCanvasElement ? found : null;
    let gl: WebGLRenderingContext | null = cv?.getContext("webgl", attrs) ?? null;
    if (cv && gl?.isContextLost()) {
      const fresh = document.createElement("canvas");
      fresh.id = "ink";
      fresh.setAttribute("aria-hidden", "true");
      fresh.className = cv.className;
      cv.replaceWith(fresh);
      cv = fresh;
      gl = cv.getContext("webgl", attrs);
    }
    this.gl = gl;
    if (!gl || !cv) {
      chrome.noWebgl = true;
      applyChrome();
      return;
    }
    try {
      const prog = compile(gl, FRAGMENT_SHADER);
      ["uView", "uDpr", "uTime", "uScroll", "uCount", "uRect", "uOrig", "uSt", "uSt2", "uCore", "uLight", "uMRect", "uPhase", "uFade", "uPalA", "uPalB", "uTexAR", "uTex0", "uDrop", "uDropInk", "uTrail", "uType", "uTypeP", "uTypeCur", "uVid", "uMorph", "uMask", "uPhoto", "uAtlas"].forEach((n) => {
        this.U[n] = gl.getUniformLocation(prog, n);
      });
      gl.uniform1i(this.U.uTex0, 0);
      gl.uniform1i(this.U.uType, 1);
      gl.uniform1i(this.U.uPhoto, 2);
      const mk = () => {
        const t = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, t);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0]));
        [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach((k) => gl.texParameteri(gl.TEXTURE_2D, k, gl.CLAMP_TO_EDGE));
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        return t;
      };
      this.vtex = mk();
      this.ttex = mk();
      this.ptex = mk();
      this.loadAtlas();
    } catch (err) {
      console.error(err);
      this.gl = null;
      chrome.noWebgl = true;
      applyChrome();
      return;
    }
    const video = document.getElementById("heroVideo") as HTMLVideoElement | null;
    if (HERO_VIDEO && video) {
      video.src = HERO_VIDEO;
      video.play().catch(() => undefined);
      video.addEventListener("loadeddata", () => {
        this.videoReady = true;
        this.videoAR = video.videoWidth / video.videoHeight;
      });
    }
  }

  private cellOf(url?: string) {
    return url ? this.cells.get(url) : undefined;
  }

  private cellUV(c?: number) {
    if (c == null || c < 0) return [0, 0, 0, 0];
    return [(c % ATLAS_COLS) / ATLAS_COLS, Math.floor(c / ATLAS_COLS) / this.atlasRows, 1 / ATLAS_COLS, 1 / this.atlasRows];
  }

  private loadAtlas() {
    const urls = this.opts.images.slice(0, ATLAS_COLS * ATLAS_MAX_ROWS);
    if (!urls.length) return;
    this.atlasRows = Math.ceil(urls.length / ATLAS_COLS);
    urls.forEach((url, i) => this.cells.set(url, i));
    const load = (url: string) =>
      new Promise<HTMLImageElement | null>((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.decoding = "async";
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = url;
      });
    Promise.all(urls.map(load)).then((imgs) => {
      const gl = this.gl;
      if (!this.alive || !gl || !this.ptex) return;
      const canvas = document.createElement("canvas");
      canvas.width = ATLAS_COLS * CELL_W;
      canvas.height = this.atlasRows * CELL_H;
      const x = canvas.getContext("2d");
      if (!x) return;
      imgs.forEach((img, i) => {
        if (!img) {
          this.cells.delete(urls[i]);
          return;
        }
        const ar = CELL_W / CELL_H;
        let sw = img.naturalWidth;
        let sh = img.naturalHeight;
        if (sw / sh > ar) sw = sh * ar;
        else sh = sw / ar;
        x.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, (i % ATLAS_COLS) * CELL_W, Math.floor(i / ATLAS_COLS) * CELL_H, CELL_W, CELL_H);
      });
      gl.bindTexture(gl.TEXTURE_2D, this.ptex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, canvas);
      this.atlasCanvas = canvas;
      this.atlasReady = true;
      // Items attached before the atlas finished may have missed their cell.
      this.view?.items.forEach((it) => {
        if (it.cell == null) return;
        const canvas = it.kind === "card" ? it.box.querySelector("canvas") : null;
        if (canvas) this.paintThumbImg(canvas, it.ink, it.cell);
      });
    });
  }

  private paintThumbImg(canvas: HTMLCanvasElement, inkKey: InkName, cell: number) {
    const atlas = this.atlasCanvas;
    const x = canvas.getContext("2d", { willReadFrequently: true });
    if (!atlas || !x) return;
    const W = canvas.width;
    const H = canvas.height;
    let sw = CELL_W;
    let sh = CELL_H;
    if (W / H > CELL_W / CELL_H) sh = (CELL_W * H) / W;
    else sw = (CELL_H * W) / H;
    const sx = (cell % ATLAS_COLS) * CELL_W + (CELL_W - sw) / 2;
    const sy = Math.floor(cell / ATLAS_COLS) * CELL_H + (CELL_H - sh) / 2;
    x.drawImage(atlas, sx, sy, sw, sh, 0, 0, W, H);
    const d = x.getImageData(0, 0, W, H);
    const p = d.data;
    const deep = INKS[inkKey].core.map((v) => v * 1.4 * 255);
    const paper = [232, 228, 223];
    for (let i = 0; i < p.length; i += 4) {
      const l = (p[i] * 0.299 + p[i + 1] * 0.587 + p[i + 2] * 0.114) / 255;
      const k = clamp((1 - l) * 1.15 - 0.05);
      p[i] = paper[0] + (deep[0] - paper[0]) * k;
      p[i + 1] = paper[1] + (deep[1] - paper[1]) * k;
      p[i + 2] = paper[2] + (deep[2] - paper[2]) * k;
    }
    x.putImageData(d, 0, 0);
  }

  private paintThumb(canvas: HTMLCanvasElement, inkKey: InkName, seed: number, cell?: number) {
    if (this.atlasReady && cell != null && cell >= 0) {
      this.paintThumbImg(canvas, inkKey, cell);
      return;
    }
    if (!this.thumbGL) {
      this.thumbCanvas = document.createElement("canvas");
      this.thumbGL = this.thumbCanvas.getContext("webgl", { preserveDrawingBuffer: true });
      if (!this.thumbGL) return;
      this.thumbProg = compile(
        this.thumbGL,
        FRAGMENT_SHADER.replace(
          /void main\(\)\{[\s\S]*$/,
          `uniform float uSeed; uniform vec2 uSize; uniform vec3 uDeep;
    void main(){ vec2 uv=gl_FragCoord.xy/uSize; uv.y=1.0-uv.y;
      vec3 c=fluid(uv*vec2(uSize.x/uSize.y,1.0), uSeed, uPalA[0], uPalB[0], uPalA[0]); float l=dot(c,vec3(0.3,0.55,0.15));
      vec3 col=mix(vec3(0.91,0.895,0.875), uDeep, smoothstep(0.06,0.6,l)); col*=0.97+0.05*noise(gl_FragCoord.xy*0.6);
      gl_FragColor=vec4(col,1.0); }`,
        ),
      );
    }
    const g = this.thumbGL;
    const pr = this.thumbProg;
    const thumbCanvas = this.thumbCanvas;
    if (!g || !pr || !thumbCanvas) return;
    const I = INKS[inkKey];
    thumbCanvas.width = canvas.width;
    thumbCanvas.height = canvas.height;
    g.viewport(0, 0, canvas.width, canvas.height);
    g.uniform1f(g.getUniformLocation(pr, "uSeed"), seed);
    g.uniform2f(g.getUniformLocation(pr, "uSize"), canvas.width, canvas.height);
    g.uniform1f(g.getUniformLocation(pr, "uTime"), seed * 3);
    g.uniform3fv(g.getUniformLocation(pr, "uPalA"), [...I.palA, ...Array(9).fill(0)]);
    g.uniform3fv(g.getUniformLocation(pr, "uPalB"), [...I.palB, ...Array(9).fill(0)]);
    g.uniform3fv(g.getUniformLocation(pr, "uDeep"), I.core.map((v) => v * 1.4));
    g.drawArrays(g.TRIANGLES, 0, 3);
    canvas.getContext("2d")?.drawImage(thumbCanvas, 0, 0);
  }

  private prepareHeroType() {
    const run = () => {
      if (this.view?.route.type === "home" && this.view.route.variant === "a") this.buildHeroType();
    };
    const fonts = document.fonts;
    const title = document.getElementById("heroTitle");
    if (!fonts?.load || !title) {
      run();
      return;
    }
    const loads = [title, title.querySelector("span")].flatMap((el) => {
      if (!el) return [];
      const cs = getComputedStyle(el);
      return [fonts.load(`${cs.fontStyle} ${cs.fontWeight} 120px ${cs.fontFamily}`)];
    });
    Promise.all(loads).catch(() => undefined).then(run);
  }

  private buildHeroType() {
    const title = document.getElementById("heroTitle");
    const veil = document.getElementById("heroVeil");
    const spread = title?.querySelector("span");
    const lead = title ? [...title.childNodes].find((node): node is Text => node.nodeType === Node.TEXT_NODE && !!node.textContent?.trim()) : undefined;
    const spreadText = spread?.firstChild;
    if (!title || !veil || !spread || !lead || !(spreadText instanceof Text)) return;
    const origin = veil.getBoundingClientRect();
    if (origin.width < 2 || origin.height < 2) return;
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(origin.width * scale);
    canvas.height = Math.round(origin.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "#000";
    this.paintLine(ctx, lead, title, scale, origin);
    this.paintLine(ctx, spreadText, spread, scale, origin);
    const url = canvas.toDataURL("image/png");
    for (const prefix of ["mask", "-webkit-mask"]) {
      veil.style.setProperty(`${prefix}-image`, `url("${url}")`);
      veil.style.setProperty(`${prefix}-size`, "100% 100%");
      veil.style.setProperty(`${prefix}-repeat`, "no-repeat");
      veil.style.setProperty(`${prefix}-position`, "0 0");
    }
    this.typeReady = true;
  }

  private paintLine(ctx: CanvasRenderingContext2D, node: Text, el: HTMLElement, scale: number, origin: DOMRect) {
    const cs = getComputedStyle(el);
    const raw = node.textContent ?? "";
    const range = document.createRange();
    const lines: { text: string; left: number; top: number }[] = [];
    for (let i = 0; i < raw.length; i++) {
      const ch = raw[i];
      if (/\s/.test(ch)) {
        if (lines.length) lines[lines.length - 1].text += ch;
        continue;
      }
      range.setStart(node, i);
      range.setEnd(node, i + 1);
      const rect = range.getBoundingClientRect();
      if (rect.width < 0.4) continue;
      const prev = lines[lines.length - 1];
      if (!prev || Math.abs(rect.top - prev.top) > Math.max(3, rect.height * 0.45)) {
        lines.push({ text: ch, left: rect.left, top: rect.top });
      } else prev.text += ch;
    }
    if (!lines.length) return;
    const size = parseFloat(cs.fontSize) * scale;
    ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${size}px ${cs.fontFamily}`;
    const tracking = cs.letterSpacing;
    if ("letterSpacing" in ctx) {
      const px = tracking && tracking !== "normal" ? parseFloat(tracking) : 0;
      ctx.letterSpacing = Number.isFinite(px) ? `${px * scale}px` : "0px";
    }
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    const sample = ctx.measureText("Hg");
    const ascent = sample.fontBoundingBoxAscent || sample.actualBoundingBoxAscent;
    for (const line of lines) {
      let text = line.text.replace(/\s+/g, " ").trim();
      if (!text) continue;
      if (cs.textTransform === "uppercase") text = text.toLocaleUpperCase();
      else if (cs.textTransform === "lowercase") text = text.toLocaleLowerCase();
      ctx.fillText(text, (line.left - origin.left) * scale, (line.top - origin.top) * scale + ascent);
    }
  }

  private buildType() {
    const family = this.opts.fontFamily;
    this.uploadType((x, _scale, W, H) => {
      x.textBaseline = "alphabetic";
      let size = Math.min(W * 0.24, H * 0.33);
      x.font = `800 ${size}px ${family}`;
      const fit = Math.max(x.measureText("SPILLED").width, x.measureText("INK").width);
      if (fit > W * 0.92) {
        size *= (W * 0.92) / fit;
        x.font = `800 ${size}px ${family}`;
      }
      const lh = size * 0.86;
      const top = H * 0.5 - lh * 0.95;
      x.textAlign = "left";
      x.fillText("INK", W * 0.04, top + lh * 0.82);
      x.textAlign = "right";
      x.fillText("SPILLED", W * 0.96, top + lh * 1.78);
    });
  }

  private uploadType(draw: (ctx: CanvasRenderingContext2D, scale: number, W: number, H: number) => void) {
    const gl = this.gl;
    if (!gl || !this.ttex) return;
    const W = Math.min(1600, Math.round(this.vw));
    const H = Math.round((W * this.vh) / this.vw);
    if (W < 2 || H < 2 || this.vw < 2) return;
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const x = c.getContext("2d");
    if (!x) return;
    x.fillStyle = "#000";
    x.fillRect(0, 0, W, H);
    x.fillStyle = "#fff";
    draw(x, W / this.vw, W, H);
    const blur = (k: number) => {
      const s = document.createElement("canvas");
      s.width = Math.max(2, Math.round(W / k));
      s.height = Math.max(2, Math.round(H / k));
      const sx = s.getContext("2d");
      if (!sx) return x.getImageData(0, 0, W, H).data;
      sx.imageSmoothingQuality = "high";
      sx.drawImage(c, 0, 0, s.width, s.height);
      const s2 = document.createElement("canvas");
      s2.width = Math.max(2, Math.round(s.width / 2));
      s2.height = Math.max(2, Math.round(s.height / 2));
      s2.getContext("2d")?.drawImage(s, 0, 0, s2.width, s2.height);
      const o = document.createElement("canvas");
      o.width = W;
      o.height = H;
      const ox = o.getContext("2d");
      if (!ox) return x.getImageData(0, 0, W, H).data;
      ox.imageSmoothingQuality = "high";
      ox.drawImage(s2, 0, 0, W, H);
      return ox.getImageData(0, 0, W, H).data;
    };
    const R = x.getImageData(0, 0, W, H).data;
    const G = blur(6);
    const B = blur(22);
    const out = new Uint8Array(W * H * 3);
    for (let i = 0, j = 0; i < R.length; i += 4, j += 3) {
      out[j] = R[i];
      out[j + 1] = G[i];
      out[j + 2] = B[i];
    }
    gl.bindTexture(gl.TEXTURE_2D, this.ttex);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, W, H, 0, gl.RGB, gl.UNSIGNED_BYTE, out);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4);
    this.typeReady = true;
  }

  /** Corner radius as a fraction of the short side; negative when the top-right corner is square. */
  private radFrac(el: Element, w: number, h: number) {
    let r = this.radii.get(el);
    if (r == null) {
      const cs = getComputedStyle(el);
      const tl = parseFloat(cs.borderTopLeftRadius) || 0;
      r = (parseFloat(cs.borderTopRightRadius) || 0) < 0.5 && tl > 0 ? -tl : tl;
      this.radii.set(el, r);
    }
    return Math.sign(r) * Math.min(0.5, Math.abs(r) / Math.max(1, Math.min(w, h)));
  }

  private resize = () => {
    this.radii = new WeakMap();
    this.vw = document.documentElement.clientWidth;
    this.vh = window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, this.vw < 900 ? 1.2 : 1.5) * this.quality;
    const cv = document.getElementById("ink") as HTMLCanvasElement | null;
    if (this.gl && cv) {
      cv.width = Math.round(this.vw * this.dpr);
      cv.height = Math.round(this.vh * this.dpr);
      this.gl.viewport(0, 0, cv.width, cv.height);
    }
    this.view?.onResize?.();
  };

  private makeItem(el: HTMLElement, box: HTMLElement, kind: Item["kind"], ink: InkName, extra?: Partial<Item>): Item {
    return { el, box: box || el, kind, ink, amt: 0, tau: 0, ox: 0.5, oy: 0.5, seed: Math.random() * 40, hov: false, ...extra };
  }

  private hoverize(it: Item, signal: AbortSignal) {
    const box = it.kind === "row" ? it.el : it.box;
    box.addEventListener(
      "pointerenter",
      (e) => {
        if (e.pointerType === "touch") return;
        const r = box.getBoundingClientRect();
        if (it.amt < 0.03) {
          it.ox = clamp((e.clientX - r.left) / r.width);
          it.oy = clamp((e.clientY - r.top) / r.height);
        }
        it.hov = true;
      },
      { signal },
    );
    box.addEventListener("pointerleave", () => {
      it.hov = false;
    }, { signal });
    it.el.addEventListener("focus", () => {
      it.ox = 0.5;
      it.oy = 0.5;
      it.hov = true;
    }, { signal });
    it.el.addEventListener("blur", () => {
      it.hov = false;
    }, { signal });
  }

  private stScrub(s: Station) {
    if (s.mode === "heroA") {
      const range = s.el.offsetHeight - this.vh;
      return 1 - clamp(window.scrollY / (range * 0.8));
    }
    if (s.mode === "heroB") return 1 - this.typeQ();
    const b = (s.mode === "panel" ? s.el.closest("section") || s.el : s.el).getBoundingClientRect();
    const enter = clamp((this.vh * 0.62 - b.top) / (this.vh * 0.3));
    if (s.mode === "foot") return enter;
    if (s.top) return Math.min(clamp((this.vh * 0.9 - b.top) / (this.vh * 0.3)), clamp((b.bottom - this.vh * 0.3) / (this.vh * 0.35)));
    return Math.min(enter, clamp((b.bottom - this.vh * 0.5) / (this.vh * 0.35)));
  }

  private inkGeo(s: Station, k: InkSpec): Geo {
    if (s.mode === "heroA" || s.mode === "heroB") {
      const ox = k.o[0] * this.vw;
      const oy = k.o[1] * this.vh;
      return {
        rect: [-300, -300, this.vw + 600, this.vh + 600],
        mrect: [0, 0, this.vw, this.vh],
        ox,
        oy,
        Rfull: Math.max(Math.hypot(ox, oy), Math.hypot(this.vw - ox, oy), Math.hypot(ox, this.vh - oy), Math.hypot(this.vw - ox, this.vh - oy)) * 1.02 + 160,
        radf: 0,
      };
    }
    const b = s.el.getBoundingClientRect();
    let x = b.left;
    const y = b.top;
    let w = b.width;
    let h = b.height;
    if (s.mode === "foot") {
      x = -300;
      w = this.vw + 600;
      h += 400;
    }
    const ox = b.left + k.o[0] * b.width;
    const oy = b.top + k.o[1] * b.height;
    const far = Math.max(
      Math.hypot(ox - x, oy - y),
      Math.hypot(x + w - ox, oy - y),
      Math.hypot(ox - x, Math.min(y + h, b.bottom) - oy),
      Math.hypot(x + w - ox, Math.min(y + h, b.bottom) - oy),
    );
    return { rect: [x, y, w, h], mrect: [b.left, b.top, b.width, b.height], ox, oy, Rfull: far + (s.mode === "foot" ? 200 : 110), radf: s.mode === "panel" ? this.radFrac(s.el, b.width, b.height) : 0 };
  }

  private soak(it: { hov: boolean; tau: number; amt: number }, dt: number, creep: number) {
    if (it.hov) {
      it.tau += dt;
      it.amt = this.reduced ? 1 : Math.max(it.amt, spread(it.tau, creep));
    } else {
      it.amt = this.reduced ? 0 : clamp(it.amt - dt / 0.45);
      if (it.amt === 0) it.tau = 0;
    }
  }

  private typeRatio() {
    if (!this.view || this.view.route.type !== "home") return 0;
    const variant = this.view.route.variant;
    if (variant !== "b" && !(variant === "a" && this.heroMorph > 0.65)) return 0;
    const h = document.getElementById("hero");
    if (!h) return 0;
    return clamp(window.scrollY / Math.max(1, h.offsetHeight - this.vh));
  }

  private updateHeroMorph(dt: number) {
    const hero = this.view?.stations[0];
    const homeA = this.view?.route.type === "home" && this.view.route.variant === "a" && hero?.mode === "heroA";
    if (!homeA || this.reduced || !this.typeReady || this.heroMorph >= 0.999) return;
    const bloom = hero.inks.findIndex((ink) => ink.st === "bloom");
    const amt = bloom >= 0 ? hero.amts[bloom] : 0;
    const done = amt > 0.72 && hero.scrub > 0.92;
    this.heroMorph = clamp(this.heroMorph + (done ? dt / 1.15 : -dt / 0.45));
  }
  private typeP() {
    return smooth(clamp(this.typeRatio() / 0.62));
  }
  private typeQ() {
    return clamp((this.typeRatio() - 0.66) / 0.3);
  }

  private finishLoader() {
    this.loaded = true;
    document.getElementById("loader")?.classList.add("done");
    chrome.locked = this.flood.state !== "idle";
    applyChrome();
  }

  private frame = (now: number) => {
    if (!this.alive) return;
    const raw = (now - this.last) / 1000;
    const dt = Math.min(0.05, raw);
    this.last = now;
    this.time += dt;
    this.slow = raw > 0.03 ? this.slow + 1 : Math.max(0, this.slow - 1);
    if (this.slow > 24 && this.quality > 0.4) {
      this.quality *= 0.82;
      this.slow = 0;
      this.resize();
    }
    if (!this.loaded) {
      const p = clamp((now - this.loadT0) / 1300);
      const num = document.getElementById("num");
      if (num) num.textContent = String(Math.round(smooth(p) * 100)).padStart(3, "0");
      if (p >= 1) this.finishLoader();
    }
    const view = this.view;
    if (!view) {
      this.raf = requestAnimationFrame(this.frame);
      return;
    }
    const { vw, vh } = this;
    const ST = view.stations.concat([this.foot]);
    for (const s of ST) {
      s.scrub = this.stScrub(s);
      s.target = s.scrub > 0.04;
    }
    const ready = this.loaded && (now - this.loadT0 > 1500 || this.reduced);
    for (const s of ST) {
      const isDock = this.drop.state === "docked" && this.drop.docked === s;
      if (isDock && s.target && ready && this.flood.state === "idle") s.tau += dt;
      if (isDock && !s.target && this.flood.state === "idle") {
        const g = this.inkGeo(s, s.inks[0]);
        s.tau = 0;
        this.drop.state = "follow";
        this.drop.x = s.mode === "heroA" ? vw * 0.5 : g.ox;
        this.drop.y = s.mode === "heroA" ? vh * 0.5 : g.oy;
        this.drop.vx = this.drop.vy = 0;
      }
      s.amts = s.inks.map((k) => (this.reduced && s.tau > 0 ? s.scrub : spread(s.tau - k.delay, s.creep) * s.scrub));
    }
    this.updateHeroMorph(dt);
    if (this.drop.state === "follow") {
      let best: Station | null = null;
      for (const s of ST) if (s.target && (!best || s.scrub > best.scrub)) best = s;
      if (best) {
        this.drop.state = "flow";
        this.drop.from = { x: this.drop.x, y: this.drop.y };
        this.drop.t = 0;
        this.drop.docked = best;
        this.drop.fromInk = this.drop.ink.slice();
      } else {
        const k = 1 - Math.exp(-dt * (this.touch ? 3 : 6.5));
        const nx = lerp(this.drop.x, this.ptr.x, k);
        const ny = lerp(this.drop.y, this.ptr.y, k);
        this.drop.vx = (nx - this.drop.x) / dt;
        this.drop.vy = (ny - this.drop.y) / dt;
        this.drop.x = nx;
        this.drop.y = ny;
      }
    }
    if (this.drop.state === "flow") {
      const s = this.drop.docked;
      if (!s || !s.target) this.drop.state = "follow";
      else if (this.drop.from && this.drop.fromInk) {
        this.drop.t += dt / (this.reduced ? 0.01 : 0.85);
        const t = clamp(this.drop.t);
        const e = t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) ** 3) / 2;
        const g = this.inkGeo(s, s.inks[0]);
        const f = this.drop.from;
        const mx = (f.x + g.ox) / 2 + (g.oy - f.y) * 0.18;
        const my = (f.y + g.oy) / 2 - (f.x - g.ox) * 0.18;
        const nx = (1 - e) * (1 - e) * f.x + 2 * (1 - e) * e * mx + e * e * g.ox;
        const ny = (1 - e) * (1 - e) * f.y + 2 * (1 - e) * e * my + e * e * g.oy;
        this.drop.vx = (nx - this.drop.x) / dt;
        this.drop.vy = (ny - this.drop.y) / dt;
        this.drop.x = nx;
        this.drop.y = ny;
        this.drop.ink = this.drop.fromInk.map((v, i) => lerp(v, INKS[s.inks[0].ink].core[i], e));
        if (t >= 1) {
          this.drop.state = "docked";
          s.tau = 0;
          this.stains?.add(g.ox, g.oy, s.inks[0].ink, 1.3);
        }
      }
    }
    if (this.drop.state === "docked" && this.drop.docked) {
      const g = this.inkGeo(this.drop.docked, this.drop.docked.inks[0]);
      this.drop.x = g.ox;
      this.drop.y = g.oy;
      this.drop.vx *= 0.8;
      this.drop.vy *= 0.8;
    }

    if (this.touch) {
      (["row", "card"] as const).forEach((kind) => {
        let best: Item | null = null;
        let bd = 1e9;
        view.items.forEach((it) => {
          if (it.kind !== kind) return;
          const r = it.box.getBoundingClientRect();
          const d = Math.abs(r.top + r.height / 2 - vh / 2) + (r.left > vw || r.right < 0 ? 1e6 : 0);
          if (d < bd && d < r.height * 0.6) {
            bd = d;
            best = it;
          }
        });
        view.items.forEach((it) => {
          if (it.kind === kind) it.hov = it === best;
        });
      });
    }
    view.items.forEach((it) => {
      if (it.kind === "visible") {
        const r = it.box.getBoundingClientRect();
        const c = r.top + r.height / 2;
        it.hov = c > vh * 0.1 && c < vh * 0.9;
      }
      this.soak(it, dt, it.kind === "row" ? 3 : it.kind === "visible" ? 6 : 4);
      if (it.kind === "row") it.el.style.setProperty("--cp", smooth(clamp((it.amt - 0.25) / 0.3)).toFixed(3));
    });
    const topTag = view.items.reduce<Item | null>((best, it) => (it.tag && (!best || it.amt > best.amt) ? it : best), null);
    const viewTag = document.getElementById("viewTag");
    if (viewTag) {
      if (this.touch && topTag && topTag.amt > 0.01) {
        const r = topTag.box.getBoundingClientRect();
        viewTag.style.transform = `translate(${r.left + 18}px,${r.bottom - 30}px)`;
        viewTag.style.opacity = smooth(clamp((topTag.amt - 0.4) / 0.3)).toFixed(3);
      } else viewTag.style.opacity = "0";
    }
    this.soak(this.blob, dt, 3);
    {
      const k = 1 - Math.exp(-dt * 7);
      this.blob.x = lerp(this.blob.x, this.ptr.x, k);
      this.blob.y = lerp(this.blob.y, this.ptr.y, k);
    }
    view.frame?.();
    const footEl = document.getElementById("contact");
    footEl?.style.setProperty("--cp", smooth(clamp((Math.max(...this.foot.amts) - 0.4) / 0.25)).toFixed(3));

    if (this.flood.state === "in") {
      this.flood.amt = clamp(this.flood.amt + dt / 0.8);
      if (this.flood.amt >= 1 && this.flood.route) {
        const route = this.flood.route;
        this.route = route;
        this.opts.onCommit(route, this.flood.fromHistory);
        const s = this.view?.stations[0];
        if (s) {
          const g = this.inkGeo(s, s.inks[0]);
          this.flood.x = g.ox;
          this.flood.y = g.oy;
        }
        this.flood.state = "out";
      }
    } else if (this.flood.state === "out") {
      this.flood.amt = clamp(this.flood.amt - dt / 0.95);
      if (this.flood.amt <= 0) {
        this.flood.state = "idle";
        chrome.flooding = false;
        chrome.locked = !this.loaded ? true : false;
        applyChrome();
      }
    }

    this.stains?.draw(now, vw, vh);
    const active = this.view;
    if (!active) {
      this.raf = requestAnimationFrame(this.frame);
      return;
    }
    if (!this.gl) {
      this.raf = requestAnimationFrame(this.frame);
      return;
    }
    this.draw(now, dt, active);
    this.raf = requestAnimationFrame(this.frame);
  };

  private draw(now: number, dt: number, view: View) {
    const gl = this.gl;
    if (!gl) return;
    const { vw, vh } = this;
    const ST = view.stations.concat([this.foot]);
    const list: Draw[] = [];
    for (const s of ST) {
      if (s.noDraw) continue;
      s.inks.forEach((k, i) => {
        const a = s.amts[i];
        if (a <= 0.002) return;
        const g = this.inkGeo(s, k);
        if (g.oy + g.Rfull < -50) return;
        if (g.oy - g.Rfull > vh + 50) return;
        list.push({
          g,
          R: lerp(10, g.Rfull * (k.reach || 1), a),
          pal: s.mode === "heroA" ? HEROPAL : null,
          media: s.mode === "foot" ? 0 : smooth(clamp((a - 0.3) / 0.4)),
          st: STY[k.st],
          ink: INKS[k.ink],
          seed: k.seed,
          mtype: s.mode === "foot" ? 0 : s.cell != null && this.atlasReady ? 3 : s.mode === "heroA" && this.videoReady ? 2 : 1,
          cell: s.cell,
          lobe: s.mode === "panel" ? 120 : 140,
          phase: [this.reduced ? 1 : smooth(clamp((s.tau - k.delay - 0.4) / 7)), 1, 0, s.mseed],
          mask: s.mode === "heroA",
        });
      });
    }
    const hov: Draw[] = [];
    view.items.forEach((it) => {
      if (it.amt <= 0.002) return;
      const r = it.box.getBoundingClientRect();
      if (r.bottom < -40 || r.top > vh + 40 || r.right < 0 || r.left > vw) return;
      if (it.kind === "row") {
        const ox = it.ox * vw;
        const oy = r.top + r.height / 2;
        const photo = it.cell != null && this.atlasReady;
        hov.push({
          amt: it.amt,
          g: { rect: [-40, r.top, vw + 80, r.height], mrect: [0, r.top, vw, r.height], ox, oy, Rfull: 0, radf: 0 },
          R: lerp(6, Math.max(ox, vw - ox) + 120, it.amt),
          media: photo ? smooth(clamp((it.amt - 0.15) / 0.45)) : 0,
          st: STY.row,
          ink: INKS[it.ink],
          seed: it.seed,
          mtype: photo ? 3 : 0,
          cell: it.cell,
          lobe: 10,
          phase: [smooth(clamp((it.tau - 0.3) / 2.5)), 0.7, 0.08, photo ? it.seed : 0],
          pal: null,
        });
        return;
      }
      const ox = r.left + it.ox * r.width;
      const oy = r.top + it.oy * r.height;
      const far = Math.max(Math.hypot(ox - r.left, oy - r.top), Math.hypot(r.right - ox, oy - r.top), Math.hypot(ox - r.left, r.bottom - oy), Math.hypot(r.right - ox, r.bottom - oy)) + 40;
      const photo = it.cell != null && this.atlasReady;
      hov.push({
        amt: it.amt,
        g: { rect: [r.left, r.top, r.width, r.height], mrect: [r.left, r.top, r.width, r.height], ox, oy, Rfull: 0, radf: 0 },
        R: lerp(6, far, it.amt),
        media: smooth(clamp((it.amt - 0.2) / 0.5)),
        fade: photo ? 1 : 0.46,
        st: STY.card,
        ink: INKS[it.ink],
        seed: it.seed,
        mtype: photo ? 3 : 1,
        cell: it.cell,
        lobe: 14,
        phase: [smooth(clamp((it.tau - 0.3) / 3)), 0.7, this.radFrac(it.box, r.width, r.height), it.seed],
        pal: null,
      });
    });
    if (this.blob.amt > 0.002) {
      const W = Math.min(340, vw * 0.4);
      const H = W * 0.72;
      hov.push({
        amt: this.blob.amt,
        g: { rect: [this.blob.x - W / 2, this.blob.y - H / 2, W, H], mrect: [this.blob.x - W / 2, this.blob.y - H / 2, W, H], ox: this.blob.x, oy: this.blob.y, Rfull: 0, radf: 0 },
        R: lerp(4, W * 0.75, this.blob.amt),
        media: smooth(clamp((this.blob.amt - 0.2) / 0.45)),
        st: STY.blob,
        ink: INKS[this.blob.ink],
        seed: this.blob.seed,
        mtype: this.atlasReady && this.blob.cell >= 0 ? 3 : 1,
        cell: this.blob.cell,
        lobe: 30,
        phase: [smooth(clamp((this.blob.tau - 0.3) / 3)), 0.8, 0.45, this.blob.seed + 7],
        pal: INKS[this.blob.pal],
      });
    }
    hov.sort((a, b) => (b.amt || 0) - (a.amt || 0));
    let draw = list.concat(hov);
    if (this.flood.amt > 0) {
      const far = Math.hypot(Math.max(this.flood.x, vw - this.flood.x), Math.max(this.flood.y, vh - this.flood.y)) + 260;
      const fa = this.flood.state === "in" ? 1 - (1 - this.flood.amt) ** 3 : smooth(this.flood.amt);
      draw = draw.slice(0, N - 1).concat([
        {
          g: { rect: [-300, -300, vw + 600, vh + 600], mrect: [0, 0, vw, vh], ox: this.flood.x, oy: this.flood.y, Rfull: 0, radf: 0 },
          R: lerp(10, far, fa),
          media: 0.35 * fa,
          st: STY.tendril,
          ink: INKS[this.flood.ink] || INKS.blue,
          seed: this.flood.seed,
          mtype: 1,
          lobe: 120,
          phase: [0.5, 1, 0, this.flood.seed],
          pal: null,
        },
      ]);
    }
    draw = draw.slice(0, N);
    const UN: Record<string, string> = { rect: "uRect", orig: "uOrig", st: "uSt", st2: "uSt2", core: "uCore", light: "uLight", mrect: "uMRect", phase: "uPhase" };
    this.fade.fill(1);
    this.mask.fill(0);
    draw.forEach((r, i) => {
      this.fade[i] = r.fade ?? 1;
      this.mask[i] = r.mask ? 1 : 0;
      this.atlas.set(this.cellUV(r.cell), i * 4);
      const g = r.g;
      const s = r.st;
      const I = r.ink;
      const P = r.pal || I;
      this.A.rect.set(g.rect, i * 4);
      this.A.orig.set([g.ox, g.oy, r.R, r.media], i * 4);
      this.A.st.set([s[0], s[1], s[2], r.seed], i * 4);
      this.A.st2.set([s[3], s[4], s[5], s[6]], i * 4);
      this.A.core.set([...I.core, r.mtype], i * 4);
      this.A.light.set([...I.lit, r.lobe], i * 4);
      this.A.mrect.set(g.mrect, i * 4);
      this.A.phase.set([r.phase[0], r.phase[1], r.phase[2] || g.radf || 0, r.phase[3]], i * 4);
      this.pa.set(P.palA, i * 3);
      this.pb.set(P.palB, i * 3);
    });
    const video = document.getElementById("heroVideo") as HTMLVideoElement | null;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.vtex);
    if (this.videoReady && video && video.readyState >= 2) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, video);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.ttex);

    const variant = view.route.type === "home" ? view.route.variant : null;
    const morph = variant === "a" ? this.heroMorph : 0;
    const spilled = variant === "b";
    const typeOn = spilled && this.typeReady && this.typeQ() < 1;
    const typeAmt = typeOn ? 1 : 0;
    const idle = this.reduced ? 0 : 0.05 * (1 - Math.exp(-this.time / 8));
    const formed = spilled || morph > 0.72;
    const near = now - this.ptr.moved < 1200 && (spilled || morph > 0.35) && this.typeRatio() < 0.6;
    this.typeCurZ = lerp(this.typeCurZ, near ? 1 : 0, 1 - Math.exp(-dt * 4));
    gl.uniform4f(this.U.uTypeP, formed ? Math.max(this.typeP(), idle) : 0, typeAmt, formed ? this.typeQ() : 0, 0);
    gl.uniform1f(this.U.uMorph, morph);
    gl.uniform1fv(this.U.uMask, this.mask);
    gl.uniform3f(this.U.uTypeCur, this.ptr.x, this.ptr.y, this.touch ? 0 : this.typeCurZ);
    gl.uniform1f(this.U.uVid, this.videoReady ? 1 : 0);

    const hoverAmt = Math.max(0, this.blob.amt, ...view.items.filter((i) => i.kind !== "visible").map((i) => i.amt));
    const dockAmt = this.drop.state === "docked" && this.drop.docked ? Math.max(...this.drop.docked.amts) : 0;
    const dr = (!this.loaded || this.flood.state !== "idle" ? 0 : DROP_R) * (1 - smooth(clamp(dockAmt / 0.07))) * (1 - smooth(clamp(hoverAmt / 0.15)));
    const speed = Math.hypot(this.drop.vx, this.drop.vy);
    this.trailClock += dt;
    if (this.trailClock > 0.016) {
      this.trailClock = 0;
      if (speed > 60 && !this.reduced && dr > 1) this.trail.unshift({ x: this.drop.x, y: this.drop.y, r: DROP_R * clamp(speed / 900, 0.45, 0.9) });
      if (this.trail.length > 6) this.trail.pop();
    }
    this.trail.forEach((p) => {
      p.r *= Math.exp(-dt * 6);
    });
    this.trA.fill(0);
    this.trail.forEach((p, i) => this.trA.set([p.x, p.y, dr > 0 ? p.r : 0], i * 3));

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(this.U.uCount, draw.length);
    gl.uniform1fv(this.U.uFade, this.fade);
    for (const k in UN) gl.uniform4fv(this.U[UN[k]], this.A[k]);
    gl.uniform3fv(this.U.uPalA, this.pa);
    gl.uniform3fv(this.U.uPalB, this.pb);
    gl.uniform2f(this.U.uTexAR, this.videoAR, 1);
    gl.uniform4fv(this.U.uAtlas, this.atlas);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.ptex);
    gl.uniform4f(this.U.uDrop, this.drop.x, this.drop.y, dr, 0);
    gl.uniform3fv(this.U.uDropInk, this.drop.ink);
    gl.uniform3fv(this.U.uTrail, this.trA);
    gl.uniform2f(this.U.uView, vw, vh);
    gl.uniform1f(this.U.uDpr, this.dpr);
    gl.uniform1f(this.U.uTime, this.time);
    gl.uniform1f(this.U.uScroll, window.scrollY);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}
