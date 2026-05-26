// script.js

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

    const timeString = `${getPart("month")}/${getPart("day")}/${getPart("year")} ${getPart("hour")}:${getPart("minute")}${getPart("dayPeriod").toLowerCase()} ${city}`;

    clockElement.innerText = timeString;
}

// Update every second
setInterval(updateSupremeClock, 1000);
updateSupremeClock(); // Run immediately on load

// -- Logo Confetti --
    const logo = document.getElementById('confetti');

    if (logo) {
        logo.addEventListener('click', (e) => {

            // get position of the logo for confetti origin
            const rect = logo.getBoundingClientRect();
            // convert pixels to 0-1 range required by the library
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
    };