(() => {
    "use strict";

    const root = document.documentElement;
    const hero = document.querySelector(".hero");
    const polaroid = document.querySelector(".polaroid");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

    if (!hero || !polaroid || reducedMotion.matches || !finePointer.matches) return;

    let animationFrame = 0;
    let nextX = 0;
    let nextY = 0;

    const render = () => {
        animationFrame = 0;
        root.style.setProperty("--pointer-x", `${nextX.toFixed(2)}px`);
        root.style.setProperty("--pointer-y", `${nextY.toFixed(2)}px`);
    };

    const scheduleRender = () => {
        if (!animationFrame) animationFrame = window.requestAnimationFrame(render);
    };

    hero.addEventListener("pointermove", (event) => {
        const bounds = hero.getBoundingClientRect();
        const horizontal = (event.clientX - bounds.left) / bounds.width - 0.5;
        const vertical = (event.clientY - bounds.top) / bounds.height - 0.5;

        nextX = horizontal * 7;
        nextY = vertical * 5;
        scheduleRender();
    }, { passive: true });

    hero.addEventListener("pointerleave", () => {
        nextX = 0;
        nextY = 0;
        scheduleRender();
    });
})();
