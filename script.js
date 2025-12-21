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