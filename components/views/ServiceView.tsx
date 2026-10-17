import type { CSSProperties } from "react";
import { findService, findWork, pad, PROCESS, SERVICES } from "@/lib/data";

export function ServiceView({ id }: { id: string }) {
  const service = findService(id) ?? SERVICES[0];
  const related = service.related.map((workId) => findWork(workId)).filter((item) => item != null);
  const tone = { "--c": `var(--${service.ink})` } as CSSProperties;
  return (
    <>
      <section className="gutter relative z-[3] pt-[138px] pb-11" style={tone}>
        <div className="site-wrap grid gap-[26px]">
          <a href="/#services" data-go="services" className="label inline-flex w-fit items-center gap-2.5 text-inherit no-underline">
            ← All services
          </a>
          <div className="label text-muted flex items-center gap-2.5">
            <span className="h-[9px] w-[9px] rounded-full" style={{ background: `var(--${service.ink})` }} />
            Service
          </div>
          <h1 className="font-display text-[clamp(56px,10.5vw,176px)] leading-[0.85] font-extrabold tracking-[-0.05em] uppercase">{service.name}</h1>
          <div className="grid grid-cols-1 items-end gap-8 min-[901px]:grid-cols-[minmax(0,1.3fr)_auto]">
            <p className="font-serif m-0 max-w-[30em] text-[clamp(22px,2.3vw,36px)] leading-[1.28] text-pretty">{service.intro}</p>
            <button type="button" data-talk className="font-mono justify-self-start cursor-pointer rounded-full border-0 bg-ink px-6 py-[17px] text-[11.5px] font-medium tracking-[0.14em] text-cream uppercase">
              Start a project
            </button>
          </div>
        </div>
      </section>
      <section className="gutter py-2.5 pb-10">
        <div className="site-wrap">
          <div id="pagePanel" data-ink={service.ink} className="relative grid h-[min(56vh,560px)] content-end p-6 text-cream [--cp:0]">
            <div className="label relative z-[3] opacity-[var(--cp)]">{service.desc}</div>
          </div>
        </div>
      </section>
      <section className="gutter relative z-[3] py-[9vh]" style={tone}>
        <div className="site-wrap grid grid-cols-1 gap-7 min-[901px]:grid-cols-2 min-[901px]:gap-14">
          <div>
            <div className="label">What’s included</div>
            <p className="font-serif mt-3 text-[clamp(22px,2.3vw,36px)] leading-[1.28] text-pretty">Everything below is handled in-house, from the first idea to the final file.</p>
          </div>
          <ul className="m-0 mt-4 list-none p-0">
            {service.includes.map((item) => (
              <li key={item} className="font-display flex items-baseline gap-4 border-t border-rule py-4 text-[clamp(20px,1.9vw,30px)] leading-[1.2] font-bold tracking-[-0.02em] uppercase before:h-[9px] before:w-[9px] before:shrink-0 before:-translate-y-[3px] before:rounded-full before:bg-[var(--c,var(--ink))] before:content-['']">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="gutter relative z-[3] py-[9vh]" style={tone}>
        <div className="site-wrap">
          <div className="label">How we work</div>
          <ol className="m-0 mt-5 grid list-none grid-cols-1 gap-5 p-0 min-[901px]:grid-cols-5">
            {PROCESS.map((step, i) => (
              <li key={step[0]} className="grid content-start gap-2.5 border-t border-rule pt-[18px]">
                <span className="font-serif text-[clamp(44px,4.5vw,72px)] leading-[0.9] text-[var(--c)] italic">{pad(i + 1)}</span>
                <b className="font-display text-[20px] leading-[1.1] font-bold tracking-[-0.02em] uppercase">{step[0]}</b>
                <span className="text-[14.5px] text-muted">{step[1]}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <section className="gutter relative z-[3] py-[9vh]">
        <div className="site-wrap">
          <div className="label">Formats we deliver</div>
          <ul className="m-0 mt-[18px] flex list-none flex-wrap gap-2.5 p-0">
            {service.formats.map((format) => (
              <li key={format} className="font-mono rounded-full border border-rule px-[18px] py-3 text-[13px] font-medium tracking-[0.06em]">
                {format}
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="gutter pt-[6vh] pb-[12vh]">
        <div className="site-wrap">
          <div className="label relative z-[3]">Related work</div>
          <div className="mt-5 grid grid-cols-1 gap-7 min-[901px]:grid-cols-2">
            {related.map((work) => (
              <article key={work.id} className="rcard grid min-w-0 cursor-none gap-3.5 max-[900px]:cursor-auto" data-go={`work-${work.id}`} data-ink={work.ink} data-cursor="View case" tabIndex={0} role="link">
                <a href={`/work/${work.id}`} tabIndex={-1} className="contents text-inherit no-underline">
                  <div className="thumb relative z-[1] aspect-[16/10] w-full">
                    <canvas width={640} height={400} className="absolute inset-0 block h-full w-full" />
                  </div>
                  <div className="relative z-[3]">
                    <b className="font-display text-[22px] leading-[1.1] font-bold tracking-[-0.02em] uppercase">{work.t}</b>{" "}
                    <span className="font-serif text-[18px] leading-[1.2] text-muted italic">{work.k}</span>
                  </div>
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
