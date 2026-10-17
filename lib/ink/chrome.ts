export const chrome = { locked: false, flooding: false, noWebgl: false };

export function applyChrome() {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("locked", chrome.locked);
  root.classList.toggle("flooding", chrome.flooding);
  root.classList.toggle("no-webgl", chrome.noWebgl);
}

export function watchChrome() {
  const root = document.documentElement;
  const obs = new MutationObserver(() => {
    const drifted =
      chrome.locked !== root.classList.contains("locked") ||
      chrome.flooding !== root.classList.contains("flooding") ||
      chrome.noWebgl !== root.classList.contains("no-webgl");
    if (drifted) applyChrome();
  });
  obs.observe(root, { attributes: true, attributeFilter: ["class"] });
  return () => obs.disconnect();
}
