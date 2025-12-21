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
    
    // Convert to 12h format? Supreme actually uses 24h or 12h depending on region, 
    // but the screenshot shows 11:11pm, so let's do 12h.
    hours = hours % 12;
    hours = hours ? hours : 12;

    // 3. Location (You can change 'LDN' to 'NYC', 'TOK', or your city)
    const city = 'MP'; 

    const timeString = `${day}/${month}/${year} ${hours}:${minutes}${ampm} ${city}`;

    clockElement.innerText = timeString;
}

// Update every second
setInterval(updateSupremeClock, 1000);
updateSupremeClock(); // Run immediately on load