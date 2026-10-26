import type { ServiceItem } from "@/lib/data";

export function ServiceInkRow({ service }: { service: ServiceItem }) {
  return (
    <li
      data-cursor="Open"
      data-go={`service-${service.id}`}
      data-color={service.ink}
      data-img={service.image}
      tabIndex={0}
      role="link"
      aria-label={service.name}
      className="relative cursor-none border-t border-rule [--cp:0] last:border-b max-[900px]:cursor-auto"
    >
      <a href={`/services/${service.id}`} tabIndex={-1} className="ink-fg relative z-[1] grid grid-cols-1 items-center gap-6 py-[clamp(22px,3vw,40px)] no-underline min-[901px]:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_auto]">
        <h3 className="font-display translate-x-[calc(var(--cp)*24px)] text-[clamp(34px,5.6vw,96px)] leading-[0.9] font-extrabold tracking-[-0.04em] uppercase transition-transform duration-500 ease-ink">{service.name}</h3>
        <span className="font-serif text-[clamp(19px,1.7vw,26px)] leading-[1.25] italic">{service.desc}</span>
        <span className="font-mono text-[11px] leading-[1.6] font-medium tracking-[0.12em] uppercase max-[900px]:text-left min-[901px]:text-right">{service.tags}</span>
      </a>
    </li>
  );
}
