"use client";

import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
import { faBehance, faInstagram, faLinkedinIn, faYoutube } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { usePathname, useRouter } from "next/navigation";
import { memo, useEffect, useLayoutEffect, useRef, useState, type Ref } from "react";
import { flushSync } from "react-dom";
import { ReelsDialog } from "@/components/ReelsDialog";
import { contentImages, setContent, type Content } from "@/lib/data";
import { InkEngine } from "@/lib/ink/engine";
import { applyChrome } from "@/lib/ink/chrome";
import { parsePath, pathFor, routeKey, sameView, titleFor, type Route } from "@/lib/routes";
import { HomeView } from "@/components/views/HomeView";
import { JournalView } from "@/components/views/JournalView";
import { ServiceView } from "@/components/views/ServiceView";
import { WorkView } from "@/components/views/WorkView";

config.autoAddCss = false;

const SOCIALS = [
  { name: "Instagram", icon: faInstagram },
  { name: "LinkedIn", icon: faLinkedinIn },
  { name: "Behance", icon: faBehance },
  { name: "YouTube", icon: faYoutube },
];

const Loader = memo(function Loader() {
  return (
    <div
      id="loader"
      aria-hidden
      className="loader fixed inset-0 z-30 grid content-end bg-ink text-cream transition-transform duration-1000 ease-ink"
      style={{ padding: "0 max(24px, env(safe-area-inset-right, 0px)) calc(28px + env(safe-area-inset-bottom, 0px)) max(24px, env(safe-area-inset-left, 0px))" }}
    >
      <div className="flex items-end justify-between gap-5">
        <span id="num" className="font-display text-[clamp(90px,20vw,300px)] leading-[0.8] font-extrabold tracking-[-0.05em] tabular-nums">
          000
        </span>
        <span className="flex gap-2.5 pb-[18px]">
          <span className="block h-3 w-3 rounded-full bg-brand-red" />
          <span className="block h-3 w-3 rounded-full bg-brand-green" />
          <span className="block h-3 w-3 rounded-full bg-brand-blue" />
        </span>
      </div>
    </div>
  );
});

const Cursor = memo(function Cursor() {
  return (
    <div id="cur" aria-hidden className="cur pointer-events-none fixed top-0 left-0 z-[14] rounded-full bg-cream px-4 py-3 font-mono text-[11px] font-medium tracking-[0.14em] text-ink uppercase transition-transform duration-[350ms] ease-ink" />
  );
});

const ViewTag = memo(function ViewTag() {
  return (
    <span id="viewTag" aria-hidden className="label pointer-events-none fixed top-0 left-0 z-[3] text-cream opacity-0">
      View case →
    </span>
  );
});

function Stage({ route }: { route: Route }) {
  if (route.type === "work") return <WorkView id={route.id} />;
  if (route.type === "service") return <ServiceView id={route.id} />;
  if (route.type === "post") return <JournalView id={route.id} />;
  return <HomeView variant={route.variant} />;
}

export function Site({ fontFamily, content }: { fontFamily: string; content: Content }) {
  setContent(content);
  const [images] = useState(() => contentImages(content));
  const pathname = usePathname();
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;
  const [route, setRoute] = useState<Route>(() => parsePath(pathname));
  const routeRef = useRef(route);
  routeRef.current = route;
  const engineRef = useRef<InkEngine | null>(null);
  const ignorePath = useRef<string | null>(null);
  const [reelOpen, setReelOpen] = useState(false);
  const [talkOpen, setTalkOpen] = useState(false);

  useLayoutEffect(() => {
    const engine = new InkEngine(
      {
        fontFamily,
        images,
        onCommit(next, fromHistory) {
          flushSync(() => setRoute(next));
          window.scrollTo(0, 0);
          engine.attach(true);
          document.title = titleFor(next);
          const href = pathFor(next);
          if (!fromHistory && window.location.pathname !== href) {
            ignorePath.current = href;
            routerRef.current.push(href, { scroll: false });
          }
          if (next.type === "home" && next.anchor) {
            const anchor = next.anchor;
            requestAnimationFrame(() => engine.scrollToAnchor(anchor));
          }
        },
        onOpenReel() {
          setReelOpen(true);
        },
        onOpenTalk() {
          setTalkOpen(true);
        },
      },
      routeRef.current,
    );
    engineRef.current = engine;
    engine.start();
    const hash = window.location.hash.replace(/^#/, "");
    if (hash && document.getElementById(hash)) requestAnimationFrame(() => engine.scrollToAnchor(hash));
    return () => {
      engine.destroy();
      if (engineRef.current === engine) engineRef.current = null;
    };
  }, [fontFamily, images]);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    if (ignorePath.current === pathname) {
      ignorePath.current = null;
      return;
    }
    const next = parsePath(pathname);
    if (sameView(next, engine.route)) return;
    engine.goRoute(next, window.innerWidth / 2, window.innerHeight / 2, "blue", true);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setTalkOpen(false);
      setReelOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useLayoutEffect(() => {
    applyChrome();
  });

  return (
    <>
      <Loader />
      <canvas id="stains" aria-hidden className="pointer-events-none fixed inset-0 z-[1] block h-[100vh] w-full mix-blend-multiply" />
      <canvas id="ink" aria-hidden className="pointer-events-none fixed inset-0 z-[2] block h-[100vh] w-full" />
      <video id="heroVideo" muted loop playsInline preload="auto" aria-hidden className="pointer-events-none fixed top-0 left-0 h-[2px] w-[2px] opacity-0" />
      <Cursor />
      <ViewTag />
      <Nav />
      <div className="switch fixed bottom-[calc(20px+env(safe-area-inset-bottom,0px))] left-[max(20px,env(safe-area-inset-left,0px))] z-[11] flex items-center gap-1 rounded-full bg-ink p-[5px] text-cream" role="group" aria-label="Homepage hero style" hidden={route.type !== "home"}>
        <span className="font-mono px-2 pl-2.5 text-[10.5px] font-medium tracking-[0.12em] text-cream/60 uppercase max-[900px]:hidden">Hero style</span>
        <button type="button" data-go="home" data-ink="blue" aria-pressed={route.type === "home" && route.variant === "a"} className={`font-mono rounded-full px-[13px] py-2.5 text-[10.5px] font-medium tracking-[0.12em] uppercase ${route.type === "home" && route.variant === "a" ? "bg-cream text-ink" : "bg-transparent text-inherit"}`}>
          Bloom
        </button>
        <button type="button" data-go="home-b" data-ink="green" aria-pressed={route.type === "home" && route.variant === "b"} className={`font-mono rounded-full px-[13px] py-2.5 text-[10.5px] font-medium tracking-[0.12em] uppercase ${route.type === "home" && route.variant === "b" ? "bg-cream text-ink" : "bg-transparent text-inherit"}`}>
          Spilled type
        </button>
      </div>
      <main id="app">
        <Stage key={routeKey(route)} route={route} />
      </main>
      <Footer />
      <TalkDialog open={talkOpen} onClose={() => setTalkOpen(false)} />
      <ReelsDialog open={reelOpen} onClose={() => setReelOpen(false)} />
    </>
  );
}

function Nav() {
  const links = [
    ["about", "About"],
    ["services", "Services"],
    ["work", "Work"],
    ["journal", "Journal"],
  ] as const;
  const [glass, setGlass] = useState(false);
  useLayoutEffect(() => {
    const onScroll = () => setGlass(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <nav aria-label="Main" data-glass={glass ? "" : undefined} className={`fixed top-0 right-0 left-0 z-[12] grid grid-cols-[1fr_auto] items-center gap-5 border-b pt-[calc(20px+env(safe-area-inset-top,0px))] pr-[max(28px,env(safe-area-inset-right,0px))] pb-[18px] pl-[max(28px,env(safe-area-inset-left,0px))] transition-[background-color,color,border-color,box-shadow,backdrop-filter] duration-500 ease-ink min-[901px]:grid-cols-[1fr_auto_1fr] ${glass ? "border-ink/10 bg-paper/70 text-ink shadow-[0_10px_30px_rgba(12,10,11,0.06)] backdrop-blur-xl backdrop-saturate-150" : "border-transparent bg-transparent text-white mix-blend-difference"}`}>
      <a href="/" data-go="home" className="font-display text-[20px] leading-none font-extrabold tracking-[-0.03em] text-inherit lowercase no-underline">
        inkspilled
      </a>
      <ul className="m-0 hidden list-none gap-[30px] p-0 min-[901px]:flex">
        {links.map(([id, label]) => (
          <li key={id}>
            <a href={`/#${id}`} data-goto={id} className="font-mono text-[11.5px] font-medium tracking-[0.14em] text-inherit uppercase no-underline">
              {label}
            </a>
          </li>
        ))}
      </ul>
      <button type="button" data-talk className="font-mono cursor-pointer justify-self-end rounded-full border border-current bg-transparent px-[18px] py-[11px] text-[11.5px] font-medium tracking-[0.14em] text-inherit uppercase">
        Let’s talk
      </button>
    </nav>
  );
}

function TalkDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const nameRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    nameRef.current?.focus();
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="talk-title" aria-hidden={!open} inert={!open} className={`fixed inset-0 z-[26] grid place-items-center p-5 transition-opacity duration-500 ease-ink motion-reduce:transition-none ${open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}>
      <button type="button" aria-label="Close contact form" className="absolute inset-0 cursor-pointer border-0 bg-[rgba(12,10,11,.62)]" onClick={onClose} />
      <div className={`relative z-[1] max-h-[min(720px,calc(100vh-40px))] w-[min(520px,100%)] overflow-auto rounded-[28px] bg-paper px-7 py-8 text-ink shadow-[0_30px_80px_rgba(12,10,11,.28)] transition duration-500 ease-ink motion-reduce:transition-none motion-reduce:transform-none ${open ? "translate-y-0 scale-100" : "translate-y-8 scale-95"}`}>
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="label text-muted mb-3">Contact</p>
            <h2 id="talk-title" className="font-display m-0 text-[clamp(36px,5vw,56px)] leading-[0.9] font-extrabold tracking-[-0.04em] uppercase">
              Let’s <span className="it text-[1.05em]">talk</span>
            </h2>
          </div>
          <button type="button" className="font-mono shrink-0 cursor-pointer rounded-full border border-ink/20 bg-transparent px-4 py-2.5 text-[11px] font-medium tracking-[0.14em] text-ink uppercase" onClick={onClose}>
            Close
          </button>
        </div>
        <p className="m-0 mb-6 max-w-[28em] text-[15px] text-muted">Tell us what you are making. We reply from the Dubai studio.</p>
        <BriefForm idPrefix="talk" tone="ink" nameRef={nameRef} />
      </div>
    </div>
  );
}

function Footer() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = window.setInterval(tick, 15000);
    return () => window.clearInterval(id);
  }, []);
  const time = (zone: string) =>
    now
      ? new Intl.DateTimeFormat("en-GB", { timeZone: zone, hour: "2-digit", minute: "2-digit" }).format(now)
      : "--:--";
  return (
    <footer id="contact" className="foot relative grid min-h-[125vh] content-end overflow-hidden pt-[30vh] pr-[max(28px,env(safe-area-inset-right,0px))] pb-[max(28px,10vh)] pl-[max(28px,env(safe-area-inset-left,0px))] text-cream [--cp:0]">
      <div className="inner relative z-[3] w-full opacity-[var(--cp)]">
        <p className="font-display m-0 mb-12 text-[clamp(34px,5.6vw,88px)] leading-[0.95] font-extrabold tracking-[-0.045em] text-balance uppercase">
          Let’s <span className="it text-[1.5em]">spill</span>
          <span className="block">something</span>
        </p>
        <h2 className="label mb-[22px] font-medium">Start a project</h2>
        <div className="grid grid-cols-1 gap-11 min-[901px]:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <BriefForm idPrefix="f" tone="cream" />
          <div>
            <h3 className="font-mono m-0 mb-3.5 text-[11.5px] font-medium tracking-[0.14em] text-cream/60 uppercase">Studios, local time</h3>
            <ul className="m-0 grid list-none gap-2.5 p-0">
              <Clock label="Dubai" time={time("Asia/Dubai")} />
              <Clock label="India" time={time("Asia/Kolkata")} />
              <Clock label="New York" time={time("America/New_York")} />
            </ul>
            <p className="mt-4 mb-0 text-[14px] text-cream/60">Inkspilled Technologies LLC, Dubai</p>
          </div>
          <div className="min-[901px]:text-right">
            <h3 className="font-mono m-0 mb-3.5 text-[11.5px] font-medium tracking-[0.14em] text-cream/60 uppercase">Follow</h3>
            <ul className="m-0 flex list-none flex-wrap gap-3 p-0 min-[901px]:justify-end">
              {SOCIALS.map(({ name, icon }) => (
                <li key={name}>
                  <a href="#contact" data-goto="contact" aria-label={name} title={name} className="grid h-12 w-12 place-items-center rounded-full border border-cream/35 text-[20px] text-inherit transition-colors duration-300 hover:border-cream hover:bg-cream hover:text-ink">
                    <FontAwesomeIcon icon={icon} className="h-5 w-5" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="font-mono mt-16 flex flex-wrap justify-between gap-3 border-t border-cream/20 pt-5 text-[12px] leading-[1.4] text-cream/60">
          <span>© 2026 Inkspilled</span>
          <span>Inkspilled.com</span>
        </div>
      </div>
    </footer>
  );
}

function BriefForm({ idPrefix, tone, nameRef }: { idPrefix: string; tone: "cream" | "ink"; nameRef?: Ref<HTMLInputElement> }) {
  const [msg, setMsg] = useState("");
  const light = tone === "cream";
  const label = light ? "text-cream/60" : "text-muted";
  const field = light ? "border-cream/35 text-cream focus:border-cream" : "border-ink/25 text-ink focus:border-ink";
  const note = light ? "text-cream/70" : "text-muted";
  const button = light ? "bg-cream text-ink" : "bg-ink text-cream";
  return (
    <form
      noValidate
      className="grid gap-3.5"
      onSubmit={(e) => {
        e.preventDefault();
        setMsg("This demo form isn’t connected yet. Wire it to your inbox or CRM.");
      }}
    >
      <label className="grid gap-1" htmlFor={`${idPrefix}-name`}>
        <span className={`font-mono text-[11px] font-medium tracking-[0.12em] uppercase ${label}`}>Name</span>
        <input ref={nameRef} id={`${idPrefix}-name`} autoComplete="name" className={`font-sans border-0 border-b bg-transparent px-0 py-2 text-[18px] leading-[1.4] focus:outline-none ${field}`} />
      </label>
      <label className="grid gap-1" htmlFor={`${idPrefix}-email`}>
        <span className={`font-mono text-[11px] font-medium tracking-[0.12em] uppercase ${label}`}>Email</span>
        <input id={`${idPrefix}-email`} type="email" autoComplete="email" className={`font-sans border-0 border-b bg-transparent px-0 py-2 text-[18px] leading-[1.4] focus:outline-none ${field}`} />
      </label>
      <label className="grid gap-1" htmlFor={`${idPrefix}-brief`}>
        <span className={`font-mono text-[11px] font-medium tracking-[0.12em] uppercase ${label}`}>What are you making?</span>
        <textarea id={`${idPrefix}-brief`} rows={3} className={`font-sans resize-y border-0 border-b bg-transparent px-0 py-2 text-[18px] leading-[1.4] focus:outline-none ${field}`} />
      </label>
      <button type="submit" className={`font-mono justify-self-start cursor-pointer rounded-full border-0 px-6 py-4 text-[11.5px] font-medium tracking-[0.14em] uppercase ${button}`}>
        Send brief
      </button>
      <p className={`m-0 min-h-[1.4em] text-[14px] ${note}`} aria-live="polite">
        {msg}
      </p>
    </form>
  );
}

function Clock({ label, time }: { label: string; time: string }) {
  return (
    <li className="flex justify-between gap-4 tabular-nums">
      <span>{label}</span>
      <span className="font-mono text-[14px]">{time}</span>
    </li>
  );
}
