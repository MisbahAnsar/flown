export function scrollToSection(sectionId: string) {
  const element = document.getElementById(sectionId);
  if (!element) {
    return;
  }

  element.scrollIntoView({ behavior: "smooth", block: "start" });

  if (window.location.hash) {
    window.history.replaceState(null, "", window.location.pathname);
  }
}
