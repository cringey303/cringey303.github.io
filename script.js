// script.js

function updateSupremeClock() {
    const clockElement = document.getElementById('supreme-clock');
    if (!clockElement) return;

    const now = new Date();

    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const year = now.getFullYear();

    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    
    hours = hours % 12;
    hours = hours ? hours : 12;

    const city = 'SF'; 

    const timeString = `${month}/${day}/${year} ${hours}:${minutes}${ampm} ${city}`;

    clockElement.innerText = timeString;
}

// Update every second
setInterval(updateSupremeClock, 1000);
updateSupremeClock(); // Run immediately on load

// -- Logo Confetti --
    const logo = document.getElementById('confetti');

    if (logo) {
        logo.addEventListener('click', (e) => {

            // get position of the text for confetti origin
            const rect = logo.getBoundingClientRect();
            // convert pixels to 0-1 range required by the library
            const x = (rect.left + rect.width / 2) / window.innerWidth;
            const y = (rect.top + rect.height / 2) / window.innerHeight;

            if (typeof confetti === 'function') {
                confetti({
                    particleCount: 99,
                    spread: 999,
                    origin: { x: x, y: y },
                    colors: ['rebeccapurple'],
                    disableForReducedMotion: true
                });
            }
        });
    };