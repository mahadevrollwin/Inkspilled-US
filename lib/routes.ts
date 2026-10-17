import { findPost, findService, findWork, POSTS, SERVICES, WORK } from "@/lib/data";

export type Route =
  | { type: "home"; variant: "a" | "b"; anchor?: string }
  | { type: "work"; id: string }
  | { type: "service"; id: string }
  | { type: "post"; id: string };

export function parseSlug(slug?: string[]): Route {
  if (!slug || slug.length === 0) return { type: "home", variant: "a" };
  return parsePath(`/${slug.join("/")}`);
}

export function parsePath(pathname: string): Route {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return { type: "home", variant: "a" };
  if (parts[0] === "spilled" && parts.length === 1) return { type: "home", variant: "b" };
  if (parts[0] === "work" && parts[1] && findWork(parts[1])) return { type: "work", id: parts[1] };
  if (parts[0] === "services" && parts[1] && findService(parts[1])) return { type: "service", id: parts[1] };
  if (parts[0] === "journal" && parts[1] && findPost(parts[1])) return { type: "post", id: parts[1] };
  return { type: "home", variant: "a" };
}

/** data-go keys from the prototype: home, home-b, work-launch, service-ads, journal-identity, or a home anchor. */
export function parseKey(key: string, current: Route | null): Route {
  if (!key || key === "home") return { type: "home", variant: "a" };
  if (key === "home-b") return { type: "home", variant: "b" };
  const dash = key.indexOf("-");
  const kind = dash < 0 ? key : key.slice(0, dash);
  const id = dash < 0 ? "" : key.slice(dash + 1);
  if (kind === "work" && id && findWork(id)) return { type: "work", id };
  if (kind === "service" && id && findService(id)) return { type: "service", id };
  if (kind === "journal" && id && findPost(id)) return { type: "post", id };
  const variant = current?.type === "home" ? current.variant : "a";
  return { type: "home", variant, anchor: key };
}

export function pathFor(route: Route): string {
  if (route.type === "home") return route.variant === "b" ? "/spilled" : "/";
  if (route.type === "work") return `/work/${route.id}`;
  if (route.type === "service") return `/services/${route.id}`;
  return `/journal/${route.id}`;
}

export function routeKey(route: Route): string {
  if (route.type === "home") return route.variant === "b" ? "home-b" : "home";
  if (route.type === "work") return `work-${route.id}`;
  if (route.type === "service") return `service-${route.id}`;
  return `journal-${route.id}`;
}

export function sameView(a: Route, b: Route): boolean {
  if (a.type !== b.type) return false;
  if (a.type === "home" && b.type === "home") return a.variant === b.variant;
  if (a.type === "work" && b.type === "work") return a.id === b.id;
  if (a.type === "service" && b.type === "service") return a.id === b.id;
  if (a.type === "post" && b.type === "post") return a.id === b.id;
  return false;
}

export function titleFor(route: Route): string {
  if (route.type === "work") return `${findWork(route.id)?.t ?? "Work"} — Inkspilled`;
  if (route.type === "service") return `${findService(route.id)?.name ?? "Services"} — Inkspilled`;
  if (route.type === "post") return `${findPost(route.id)?.title ?? "Journal"} — Inkspilled`;
  return "Inkspilled";
}

export function descriptionFor(route: Route): string {
  if (route.type === "work") return findWork(route.id)?.brief ?? "";
  if (route.type === "service") return findService(route.id)?.intro ?? "";
  if (route.type === "post") {
    const post = findPost(route.id);
    const first = post?.body.find((block) => block[0] === "p");
    return first?.[1] ?? "";
  }
  return "A motion-first creative studio. Ads, brand films, identity and social for brands that need to move.";
}

export function staticParams() {
  return [
    { slug: [] as string[] },
    { slug: ["spilled"] },
    ...WORK.map((item) => ({ slug: ["work", item.id] })),
    ...SERVICES.map((item) => ({ slug: ["services", item.id] })),
    ...POSTS.map((item) => ({ slug: ["journal", item.id] })),
  ];
}
