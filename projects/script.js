// script.js

document.addEventListener('DOMContentLoaded', () => {
    
// --- Automatic Page Highlighting --- 
const currentPath = window.location.pathname
    .replace(/\/$/, "")
    .replace("index.html", "")
    .replace(".html", "");

const navLinks = document.querySelectorAll('.nav-links a');

navLinks.forEach(link => {
    // 2. Clean the link's path the exact same way
    const linkPath = link.getAttribute('href')
        .replace(/\/$/, "")
        .replace("index.html", "")
        .replace(".html", "");
    
    // 3. Compare the cleaned versions
    if (linkPath === currentPath) {
        link.classList.add('active');
    }
});

// --- Lightbox functionality --- //
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxVideo = document.getElementById('lightbox-video');

if (lightbox) {
    const lightboxTriggers = document.querySelectorAll('.lightbox-trigger');

    lightboxTriggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            lightbox.style.display = 'flex';
            if (trigger.tagName === 'IMG') {
                lightboxImg.style.display = 'block';
                lightboxVideo.style.display = 'none';
                lightboxImg.src = trigger.src;
            } else if (trigger.tagName === 'VIDEO') {
                lightboxImg.style.display = 'none';
                lightboxVideo.style.display = 'block';
                lightboxVideo.src = trigger.currentSrc || trigger.src;
            }
        });
    });

    // Close lightbox when clicking on the background
    lightbox.addEventListener('click', e => {
        if (e.target !== lightboxImg && e.target !== lightboxVideo) {
            lightbox.style.display = 'none';
            lightboxVideo.pause();
            lightboxVideo.currentTime = 0;
        }
    });
}

// --- Montage Video Hover --- //
const hoverContainers = document.querySelectorAll('.video-on-hover');

hoverContainers.forEach(container => {
    const video = container.querySelector('video');
    if (!video) return;

    let montageInterval;
    const playDuration = 1400; // How long to play each clip (2 seconds)
    const totalCuts = 5;       // How many "scenes" to show in the loop

    container.addEventListener('mouseenter', () => {
        // Check if metadata is loaded so we know the duration
        if (isNaN(video.duration)) {
            console.log("Metadata not loaded yet");
            video.play(); // Fallback to normal play
            return;
        }

        const duration = video.duration;
        let jumpGap = 10; // Default fallback

        // 1. If video is short (< 10s), just play normally (no skipping)
        if (duration < 10) {
            video.currentTime = 0;
        } else {
            // 2. Otherwise, calculate the dynamic jump
            jumpGap = duration / totalCuts;
            
            // Start from the beginning (or user defined start)
            const startTime = parseFloat(container.getAttribute('data-start') || 0);
            video.currentTime = startTime;
        }
        
        video.muted = true;

        const playPromise = video.play();
        if (playPromise !== undefined) {
            playPromise.catch(e => console.log("Autoplay error:", e));
        }

        // 3. Only start the montage interval if the video is long enough
        if (duration >= 10) {
            montageInterval = setInterval(() => {
                if (video.currentTime + jumpGap >= duration) {
                    video.currentTime = 0; // Loop back to start
                } else {
                    video.currentTime += jumpGap; // Jump forward
                }
            }, playDuration);
        }
    });

    container.addEventListener('mouseleave', () => {
        clearInterval(montageInterval);
        video.pause();
        video.load(); // Reset to poster
    });
});

// --- Cursor link hover effect ---
const interactiveElements = document.querySelectorAll('a, .btn, .lightbox-trigger, .nav-logo, .toggle-snow');
const body = document.querySelector('body');

interactiveElements.forEach(el => {
    el.addEventListener('mouseenter', () => {
        body.classList.add('link-hovered');
    });
    el.addEventListener('mouseleave', () => {
        body.classList.remove('link-hovered');
    });
});

// --- Custom Cursor Logic ---
const cursorDot = document.querySelector('.cursor-dot');

if (cursorDot) {
    let dotX = 0, dotY = 0;

    window.addEventListener('mousemove', (e) => {
        dotX = e.clientX;
        dotY = e.clientY;
    });

    const animateCursor = () => {
        cursorDot.style.left = `${dotX}px`;
        cursorDot.style.top = `${dotY}px`;
        requestAnimationFrame(animateCursor);
    };

    animateCursor();
}

// -- Video Hover (About Section) ---
const simpleVideoContainers = document.querySelectorAll('.hover-trigger');

simpleVideoContainers.forEach(container => {
    const video = container.querySelector('video');
    if (!video) return;

    container.addEventListener('mouseenter', () => {
        // Play the video
        video.play().catch(error => {
            console.log("Autoplay prevented:", error);
        });
    });

    container.addEventListener('mouseleave', () => {
        // Pause and reset to the beginning
        video.pause();
        video.currentTime = 0; 
    });
});

// -- KU Confetti --
    const kuText = document.getElementById('ku-trigger');

    if (kuText) {
        let isExploding = false;
        
        kuText.addEventListener('mouseenter', (e) => {
            // Prevent spamming if it's already happening
            if (isExploding) return;
            isExploding = true;

            // 1. Save original text and swap to ROCK CHALK!
            const originalText = kuText.innerText;
            kuText.innerText = "ROCK CHALK!";
            kuText.classList.add('ku-text');
            

            // get position of the text for confetti origin
            const rect = kuText.getBoundingClientRect();
            // convert pixels to 0-1 range required by the library
            const x = (rect.left + rect.width / 2) / window.innerWidth;
            const y = (rect.top + rect.height / 2) / window.innerHeight;

            if (typeof confetti === 'function') {
                confetti({
                    particleCount: 99,
                    spread: 999,
                    origin: { x: x, y: y },
                    colors: ['#E8000D', '#0051BA'],
                    disableForReducedMotion: true
                });
            }

            // reset after 1 second
            setTimeout(() => {
                kuText.innerText = originalText;
                kuText.style.color = ""; // Reset color
                isExploding = false;
            }, 1000);
        });
    };

    /* toggle snow */
    const toggleSnow = document.getElementById('toggle-snow');
    if (toggleSnow) {
        toggleSnow.addEventListener('click', () => {
            document.querySelector('.snowing').classList.toggle('hidden');
        });
    }

});

// --- Scroll Progress Bar Logic ---
window.onscroll = function() {
    scrollProgress();
};

function scrollProgress() {
    //get current scroll position
    var scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    
    // get total scrollable height and viewport height
    var scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
    var viewportHeight = document.documentElement.clientHeight

    // prevent divide by zero if page is short
    if (scrollHeight - viewportHeight <= 0) return;

    //calculate percentage scrolled
    var scrolled = (scrollTop/(scrollHeight - viewportHeight)) * 100;

    //set width of progress bar
    const bar = document.getElementById("progressBar");
    if (bar) bar.style.width = scrolled + "%";
}

// Auto-update copyright year
document.getElementById('year').textContent = new Date().getFullYear();