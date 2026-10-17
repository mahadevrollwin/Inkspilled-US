import { PostLink, SectionHead, Words } from "@/components/bits";
import { POSTS, SERVICES, WORK, pad } from "@/lib/data";

export function HomeView({ variant }: { variant: "a" | "b" }) {
  return (
    <>
      {variant === "b" ? <HeroB /> : <HeroA />}
      <section id="about" className="gutter min-[901px]:min-h-[190vh]">
        <div className="site-wrap relative z-[3] grid items-center gap-8 pt-[110px] pb-[60px] min-[901px]:sticky min-[901px]:top-0 min-[901px]:min-h-[100vh] min-[901px]:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] min-[901px]:gap-14">
          <p id="statement" className="font-display relative z-[3] m-0 text-[clamp(30px,3.5vw,58px)] leading-[1.12] font-semibold tracking-[-0.025em] text-pretty">
            <Words text="We are a " />
            <span className="it w text-[1.12em] text-[var(--red)]">motion-first</span>
            <Words text=" studio. We find the one movement that says who a brand is, then carry it through every " />
            <span className="it w text-[1.12em] text-[#4E9A22]">film, ad and post</span>
            <Words text=", so the brand moves the same way in Dubai, Mumbai and " />
            <span className="it w text-[1.12em] text-[var(--blue)]">New York.</span>
          </p>
          <div className="grid min-w-0 gap-[22px]">
            <div id="aboutPanel" className="panel relative grid h-[min(68vh,640px)] content-end p-7 text-cream [--cp:0] max-[900px]:h-[60vh]">
              <div className="cap label flex justify-between gap-3 opacity-[var(--cp)]">
                <span>The studio</span>
                <span>Based in Dubai</span>
              </div>
            </div>
            <div className="relative z-[3] grid grid-cols-3 gap-4 border-t border-rule pt-4">
              <div>
                <b className="font-display block text-[30px] leading-none font-bold tracking-[-0.03em]">3</b>
                <span className="text-[13px] text-muted">Markets: UAE, India, USA</span>
              </div>
              <div>
                <b className="font-display block text-[30px] leading-none font-bold tracking-[-0.03em]">5</b>
                <span className="text-[13px] text-muted">Disciplines under one roof</span>
              </div>
              <div>
                <b className="font-display block text-[30px] leading-none font-bold tracking-[-0.03em]">1</b>
                <span className="text-[13px] text-muted">Hand on every frame</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="gutter relative z-[3] pt-[16vh] pb-[12vh]">
        <div className="site-wrap">
          <SectionHead title={<>What we <span className="it text-[1.1em]">make</span></>} aside={<p className="m-0 max-w-[26em] text-muted">Hover a discipline, then click to open it.</p>} />
          <ul id="svc" className="m-0 list-none p-0">
            {SERVICES.map((service) => (
              <li key={service.id} data-cursor="Open" data-go={`service-${service.id}`} tabIndex={0} role="link" aria-label={service.name} className="group relative cursor-none border-t border-rule last:border-b max-[900px]:cursor-auto">
                <div aria-hidden className="pointer-events-none absolute inset-y-0 left-1/2 w-screen -translate-x-1/2 overflow-hidden opacity-0 transition-opacity duration-700 ease-ink group-hover:opacity-100 group-focus-within:opacity-100">
                  <img src={service.image} alt="" className="h-full w-full object-cover motion-safe:group-hover:animate-svc-drift motion-safe:group-focus-within:animate-svc-drift" />
                  <div className="absolute inset-0 bg-paper/30" />
                </div>
                <a href={`/services/${service.id}`} tabIndex={-1} className="relative z-[1] grid grid-cols-1 items-center gap-6 py-[clamp(22px,3vw,40px)] text-ink no-underline min-[901px]:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_auto]">
                  <h3 className="font-display text-[clamp(34px,5.6vw,96px)] leading-[0.9] font-extrabold tracking-[-0.04em] uppercase transition-transform duration-500 ease-ink group-hover:translate-x-6 group-focus-within:translate-x-6">{service.name}</h3>
                  <span className="font-serif text-[clamp(19px,1.7vw,26px)] leading-[1.25] italic">{service.desc}</span>
                  <span className="font-mono text-[11px] leading-[1.6] font-medium tracking-[0.12em] uppercase max-[900px]:text-left min-[901px]:text-right">{service.tags}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="work" className="relative">
        <div className="sticky top-0 grid h-[100vh] grid-rows-[auto_1fr] overflow-hidden pt-[104px]">
          <div className="gutter relative z-[3] mb-7 flex flex-wrap items-end justify-between gap-6">
            <h2 className="font-display text-[clamp(46px,7vw,124px)] leading-[0.86] font-extrabold tracking-[-0.035em] uppercase">
              Selected <span className="it text-[1.1em]">work</span>
            </h2>
            <div className="label flex items-center gap-3.5">
              <span id="wpos">01 / {pad(WORK.length)}</span>
              <span className="relative h-px w-40 bg-rule">
                <i id="wbar" className="absolute top-[-1px] left-0 h-[3px] w-[var(--wp,0%)] bg-ink" />
              </span>
            </div>
          </div>
          <div id="track" className="flex items-center gap-7 pb-[6vh] pl-[max(24px,env(safe-area-inset-left,0px))] will-change-transform">
            {WORK.map((work, i) => (
              <article key={work.id} className="card grid w-[clamp(280px,34vw,560px)] shrink-0 cursor-none gap-3.5 even:mt-[9vh] max-[900px]:w-[78vw] max-[900px]:cursor-auto max-[900px]:even:mt-0" data-cursor="View case" data-go={`work-${work.id}`} data-ink={work.ink} tabIndex={0} role="link" aria-label={`${work.t} case study`}>
                <a href={`/work/${work.id}`} tabIndex={-1} className="contents text-inherit no-underline">
                  <div className="thumb relative z-[1] aspect-[4/5] max-h-[58vh] w-full">
                    <canvas width={480} height={600} className="absolute inset-0 block h-full w-full" />
                  </div>
                  <div className="relative z-[3] grid grid-cols-[auto_minmax(0,1fr)_auto] items-baseline gap-x-3.5 gap-y-1">
                    <span className="font-mono text-[11.5px] font-medium text-muted tabular-nums">{pad(i + 1)}</span>
                    <b className="font-display text-[clamp(20px,1.7vw,26px)] leading-[1.1] font-bold tracking-[-0.02em] uppercase">{work.t}</b>
                    <span className="font-serif text-[18px] leading-[1.2] text-muted italic">{work.k}</span>
                  </div>
                </a>
              </article>
            ))}
            <p className="label relative z-[3] w-[16em] shrink-0 text-muted">Sample projects with stand-in footage. Swap in your case studies.</p>
          </div>
        </div>
      </section>

      <section id="journal" className="gutter pt-[18vh] pb-[22vh]">
        <div className="site-wrap">
          <SectionHead title={<>Jour<span className="it text-[1.1em]">nal</span></>} aside={<p className="m-0 max-w-[26em] text-muted">Notes from the studio on motion, film and brand.</p>} />
          <ul className="m-0 list-none p-0">
            {POSTS.map((post) => (
              <PostLink key={post.id} post={post} />
            ))}
          </ul>
          <p className="label mt-[18px] text-muted">Sample posts</p>
        </div>
      </section>
    </>
  );
}

function HeroA() {
  return (
    <section id="hero" aria-label="Showreel" className="relative h-[240vh]">
      <div id="heroPin" data-cursor="Play reel" data-reel className="hero-fg gutter sticky top-0 z-[3] grid h-[100vh] cursor-none grid-rows-[auto_1fr_auto] py-24 pb-8 [--tp:0] max-[900px]:cursor-auto">
        <div className="label flex justify-between gap-5">
          <span>
            <span className="mr-2.5 inline-block h-[7px] w-[7px] animate-[pulse-dot_1.4s_ease-in-out_infinite] rounded-full bg-brand-red align-[1px] motion-reduce:animate-none" />
            Showreel 2026
          </span>
          <span>Dubai · India · USA</span>
        </div>
        <h1 className="font-display self-center text-[clamp(68px,13.2vw,236px)] leading-[0.84] font-extrabold tracking-[-0.05em] uppercase">
          Made to <span className="it block pl-[0.42em] text-[1.18em] leading-[0.8] tracking-[-0.03em]">spread.</span>
        </h1>
        <div className="grid grid-cols-1 items-end gap-5 min-[901px]:grid-cols-3">
          <p className="m-0 max-w-[26em] text-[15px]">A motion-first creative studio. Ads, brand films, identity and social for brands that need to move.</p>
          <span className="label min-[901px]:justify-self-center">Click anywhere to play the reel</span>
          <span className="label min-[901px]:text-right">Scroll to pull the ink back</span>
        </div>
      </div>
    </section>
  );
}

function HeroB() {
  return (
    <section id="hero" aria-label="Inkspilled" className="relative h-[240vh]">
      <div id="heroPin" data-cursor="Play reel" data-reel className="hero-fg gutter sticky top-0 z-[3] grid h-[100vh] cursor-none grid-rows-[auto_1fr_auto] py-24 pb-8 [--tp:0] max-[900px]:cursor-auto">
        <div className="label flex justify-between gap-5">
          <span>
            <span className="mr-2.5 inline-block h-[7px] w-[7px] animate-[pulse-dot_1.4s_ease-in-out_infinite] rounded-full bg-brand-red align-[1px] motion-reduce:animate-none" />
            Showreel 2026
          </span>
          <span>Dubai · India · USA</span>
        </div>
        <h1 className="sr-only">Inkspilled. Made to spread.</h1>
        <div className="mid self-center" aria-hidden />
        <div className="grid grid-cols-1 items-end gap-5 min-[901px]:grid-cols-3">
          <p className="m-0 max-w-[26em] text-[15px]">A motion-first creative studio. Move over the letters and the ink starts to bleed.</p>
          <span className="label min-[901px]:justify-self-center">Click to play the reel</span>
          <span className="label min-[901px]:text-right">Scroll to spill it</span>
        </div>
      </div>
    </section>
  );
}
