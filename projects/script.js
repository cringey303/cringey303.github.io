// script.js — shared behaviour for the about / projects / education / contact pages.
// Exposes window.initSubPage(); router.js calls it on load and after each
// in-place navigation. Safe to call more than once.

// --- Scroll progress bar (global; harmless when the bar is absent) ---
function scrollProgress() {
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
    const viewportHeight = document.documentElement.clientHeight;

    if (scrollHeight - viewportHeight <= 0) return;

    const scrolled = (scrollTop / (scrollHeight - viewportHeight)) * 100;
    const bar = document.getElementById("progressBar");
    if (bar) bar.style.width = scrolled + "%";
}
window.addEventListener('scroll', scrollProgress); // named fn -> auto-deduped

window.initSubPage = function initSubPage() {

    // --- Active nav link ---
    const currentPath = window.location.pathname
        .replace(/\/$/, "")
        .replace("index.html", "")
        .replace(".html", "");

    document.querySelectorAll('.nav-links a').forEach(link => {
        const linkPath = link.getAttribute('href')
            .replace(/\/$/, "")
            .replace("index.html", "")
            .replace(".html", "");
        link.classList.toggle('active', linkPath === currentPath);
    });

    // --- Lightbox ---
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxVideo = document.getElementById('lightbox-video');

    if (lightbox) {
        document.querySelectorAll('.lightbox-trigger').forEach(trigger => {
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

        lightbox.addEventListener('click', e => {
            if (e.target !== lightboxImg && e.target !== lightboxVideo) {
                lightbox.style.display = 'none';
                lightboxVideo.pause();
                lightboxVideo.currentTime = 0;
            }
        });
    }

    // --- Montage video hover ---
    document.querySelectorAll('.video-on-hover').forEach(container => {
        const video = container.querySelector('video');
        if (!video) return;

        let montageInterval;
        const playDuration = 1400;
        const totalCuts = 5;

        container.addEventListener('mouseenter', () => {
            if (isNaN(video.duration)) {
                video.play();
                return;
            }

            const duration = video.duration;
            let jumpGap = 10;

            if (duration < 10) {
                video.currentTime = 0;
            } else {
                jumpGap = duration / totalCuts;
                const startTime = parseFloat(container.getAttribute('data-start') || 0);
                video.currentTime = startTime;
            }

            video.muted = true;

            const playPromise = video.play();
            if (playPromise !== undefined) {
                playPromise.catch(e => console.log("Autoplay error:", e));
            }

            if (duration >= 10) {
                montageInterval = setInterval(() => {
                    if (video.currentTime + jumpGap >= duration) {
                        video.currentTime = 0;
                    } else {
                        video.currentTime += jumpGap;
                    }
                }, playDuration);
            }
        });

        container.addEventListener('mouseleave', () => {
            clearInterval(montageInterval);
            video.pause();
            video.load();
        });
    });

    // --- Simple video hover (about section) ---
    document.querySelectorAll('.hover-trigger').forEach(container => {
        const video = container.querySelector('video');
        if (!video) return;

        container.addEventListener('mouseenter', () => {
            video.play().catch(error => console.log("Autoplay prevented:", error));
        });
        container.addEventListener('mouseleave', () => {
            video.pause();
            video.currentTime = 0;
        });
    });

    // --- KU Confetti ---
    const kuText = document.getElementById('ku-trigger');
    if (kuText && !kuText.__wired) {
        kuText.__wired = true;
        let isExploding = false;

        kuText.addEventListener('mouseenter', () => {
            if (isExploding) return;
            isExploding = true;

            const originalText = kuText.innerText;
            kuText.innerText = "ROCK CHALK!";
            kuText.classList.add('ku-text');

            const rect = kuText.getBoundingClientRect();
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

            setTimeout(() => {
                kuText.innerText = originalText;
                kuText.style.color = "";
                isExploding = false;
            }, 1000);
        });
    }

    // --- Toggle snow ---
    const toggleSnow = document.getElementById('toggle-snow');
    if (toggleSnow && !toggleSnow.__wired) {
        toggleSnow.__wired = true;
        toggleSnow.addEventListener('click', () => {
            document.querySelector('.snowing').classList.toggle('hidden');
        });
    }

    // --- Copyright year ---
    const year = document.getElementById('year');
    if (year) year.textContent = new Date().getFullYear();
};

// Standalone fallback: if router.js isn't present, self-initialise.
document.addEventListener('DOMContentLoaded', () => {
    if (window.__spaRouter) return;
    if (document.body.getAttribute('data-page') === 'sub') window.initSubPage();
});
