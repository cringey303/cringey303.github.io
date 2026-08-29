// script.js — home ("Supreme") page behaviour.
// Exposes window.initHomePage(); router.js calls it on load and after each
// in-place navigation. Safe to call more than once.

function updateSupremeClock() {
    const clockElement = document.getElementById('supreme-clock');
    if (!clockElement) return;

    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Los_Angeles",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
    }).formatToParts(new Date());

    const getPart = (type) => parts.find(p => p.type === type)?.value || "";
    const city = 'SF';

    clockElement.innerText =
        `${getPart("month")}/${getPart("day")}/${getPart("year")} ` +
        `${getPart("hour")}:${getPart("minute")}${getPart("dayPeriod").toLowerCase()} ${city}`;
}

window.initHomePage = function initHomePage() {
    // --- Clock ---
    if (window.__supremeClockTimer) clearInterval(window.__supremeClockTimer);
    updateSupremeClock();
    window.__supremeClockTimer = setInterval(updateSupremeClock, 1000);

    // --- Logo Confetti ---
    const logo = document.getElementById('confetti');
    if (logo && !logo.__wired) {
        logo.__wired = true;
        logo.addEventListener('click', () => {
            const rect = logo.getBoundingClientRect();
            const x = (rect.left + rect.width / 2) / window.innerWidth;
            const y = (rect.top + rect.height / 2) / window.innerHeight;

            if (typeof confetti === 'function') {
                confetti({
                    particleCount: 99,
                    spread: 999,
                    origin: { x: x, y: y },
                    colors: ['#663399'],
                    disableForReducedMotion: true
                });
            }
        });
    }
};

// Standalone fallback: if router.js isn't present, self-initialise.
document.addEventListener('DOMContentLoaded', () => {
    if (window.__spaRouter) return;
    if (document.body.getAttribute('data-page') === 'home') window.initHomePage();
});
