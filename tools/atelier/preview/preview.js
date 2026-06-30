(function () {
  const tabs = document.querySelectorAll(".compare-tabs button");
  const panels = document.querySelectorAll(".compare-panel");
  if (!tabs.length) return;

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.panel;
      tabs.forEach((t) => t.classList.toggle("active", t === tab));
      panels.forEach((p) => {
        p.classList.toggle("active", p.id === target);
      });
    });
  });
})();
