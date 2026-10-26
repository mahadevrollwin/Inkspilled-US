import { POSTS, SERVICES, WORK, type InkName } from "@/lib/data";
import { routeKey, type Route } from "@/lib/routes";

type Stain = { x: number; y: number; r: number; ink: InkName; v: number; rot: number; t: number };

const DEEP: Record<InkName, [number, number, number]> = { red: [58, 7, 5], green: [6, 39, 16], blue: [4, 22, 58] };
const LIT: Record<InkName, [number, number, number]> = { red: [238, 47, 39], green: [120, 193, 69], blue: [30, 143, 214] };
const MAX = 28;

const clamp = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (t: number) => t * t * (3 - 2 * t);

function rnd(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = Math.imul(s ^ (s >>> 15), s | 1) ^ (s + Math.imul(s ^ (s >>> 7), s | 61));
    return ((s ^ (s >>> 14)) >>> 0) / 4294967296;
  };
}

export function pageInk(route: Route): InkName {
  if (route.type === "home") return "red";
  const list = route.type === "work" ? WORK : route.type === "service" ? SERVICES : POSTS;
  return list.find((it) => it.id === route.id)?.ink ?? "red";
}

export class StainLayer {
  private stains: Stain[] = [];
  private sprites = new Map<string, HTMLCanvasElement>();
  private ctx: CanvasRenderingContext2D | null;
  private key = "";

  constructor(
    private canvas: HTMLCanvasElement,
    private reduced: boolean,
  ) {
    this.ctx = canvas.getContext("2d");
  }

  load(route: Route) {
    this.key = `ink-stains:${routeKey(route)}`;
    this.stains = [];
    try {
      const raw = JSON.parse(sessionStorage.getItem(this.key) || "[]") as Omit<Stain, "t">[];
      this.stains = raw.filter((s) => s && s.ink in DEEP).map((s) => ({ ...s, t: -1e9 }));
    } catch {}
  }

  add(x: number, y: number, ink: string | undefined, scale = 1) {
    const name: InkName = ink && ink in DEEP ? (ink as InkName) : "red";
    this.stains.push({
      x,
      y: y + window.scrollY,
      r: (34 + Math.random() * 30) * scale,
      ink: name,
      v: Math.floor(Math.random() * 4),
      rot: Math.random() * Math.PI * 2,
      t: performance.now(),
    });
    if (this.stains.length > MAX) this.stains.shift();
    try {
      sessionStorage.setItem(this.key, JSON.stringify(this.stains.map(({ x, y, r, ink, v, rot }) => ({ x, y, r, ink, v, rot }))));
    } catch {}
  }

  draw(now: number, vw: number, vh: number) {
    const x = this.ctx;
    if (!x) return;
    if (this.canvas.width !== vw || this.canvas.height !== vh) {
      this.canvas.width = vw;
      this.canvas.height = vh;
    }
    x.clearRect(0, 0, vw, vh);
    for (const s of this.stains) {
      const y = s.y - window.scrollY;
      if (y < -s.r * 2 || y > vh + s.r * 2) continue;
      const k = this.reduced ? 1 : smooth(clamp((now - s.t) / 900));
      const R = s.r * (0.35 + 0.65 * k) * 2.2;
      x.save();
      x.globalAlpha = 0.55 * k;
      x.translate(s.x, y);
      x.rotate(s.rot);
      x.drawImage(this.sprite(s.ink, s.v), -R, -R, R * 2, R * 2);
      x.restore();
    }
  }

  private sprite(ink: InkName, v: number) {
    const key = `${ink}${v}`;
    const hit = this.sprites.get(key);
    if (hit) return hit;
    const S = 256;
    const c = document.createElement("canvas");
    c.width = c.height = S;
    const x = c.getContext("2d");
    if (!x) return c;
    const r = rnd(v * 97 + ink.length * 13 + 5);
    const [R, G, B] = DEEP[ink];
    const [lr, lg, lb] = LIT[ink];
    for (let i = 0; i < 46; i++) {
      const a = r() * Math.PI * 2;
      const d = r() ** 1.6 * S * 0.2;
      const cx = S / 2 + Math.cos(a) * d;
      const cy = S / 2 + Math.sin(a) * d;
      const rr = S * (0.05 + r() * 0.12);
      const gr = x.createRadialGradient(cx, cy, 0, cx, cy, rr);
      gr.addColorStop(0, `rgba(${lr},${lg},${lb},.20)`);
      gr.addColorStop(0.7, `rgba(${lr},${lg},${lb},.11)`);
      gr.addColorStop(1, `rgba(${lr},${lg},${lb},0)`);
      x.fillStyle = gr;
      x.beginPath();
      x.arc(cx, cy, rr, 0, Math.PI * 2);
      x.fill();
    }
    x.globalCompositeOperation = "source-atop";
    x.strokeStyle = `rgba(${R},${G},${B},.30)`;
    x.lineWidth = S * 0.008;
    x.beginPath();
    for (let i = 0; i <= 40; i++) {
      const a = (i / 40) * Math.PI * 2;
      const rr = S * (0.27 + r() * 0.035);
      const px = S / 2 + Math.cos(a) * rr;
      const py = S / 2 + Math.sin(a) * rr;
      if (i) x.lineTo(px, py);
      else x.moveTo(px, py);
    }
    x.closePath();
    x.stroke();
    x.globalCompositeOperation = "source-over";
    for (let i = 0; i < 6; i++) {
      const a = r() * Math.PI * 2;
      const d = S * (0.3 + r() * 0.15);
      const rr = S * (0.006 + r() * 0.014);
      x.fillStyle = `rgba(${lr},${lg},${lb},.5)`;
      x.beginPath();
      x.arc(S / 2 + Math.cos(a) * d, S / 2 + Math.sin(a) * d, rr, 0, Math.PI * 2);
      x.fill();
    }
    this.sprites.set(key, c);
    return c;
  }
}
