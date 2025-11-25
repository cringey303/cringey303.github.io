// script.js

document.addEventListener('DOMContentLoaded', () => {
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-links a');

    const options = {
        root: null, // it is the viewport
        rootMargin: '0px',
        threshold: 0.6 // 60% of the section must be visible
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Remove active class from all nav links
                navLinks.forEach(link => {
                    link.classList.remove('active');
                });

                // Find the corresponding nav link and add active class
                const id = entry.target.getAttribute('id');
                const activeLink = document.querySelector(`.nav-links a[href="#${id}"]`);
                if (activeLink) {
                    activeLink.classList.add('active');
                }
            }
        });
    }, options);

    // Observe each section
    sections.forEach(section => {
        observer.observe(section);
    });

    // --- Lightbox functionality --- //
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxVideo = document.getElementById('lightbox-video');

    const lightboxTriggers = document.querySelectorAll('.lightbox-trigger');

    lightboxTriggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            lightbox.style.display = 'flex'; // Use flex to center content
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

    // Video on hover functionality for project cards
    const hoverContainers = document.querySelectorAll('.video-on-hover');

    hoverContainers.forEach(container => {
        const video = container.querySelector('video');
        if (!video) return; // Safety check

        container.addEventListener('mouseenter', () => {
            // The play() method returns a promise, which can cause an error in some browsers if interrupted.
            // We catch it to prevent console noise.
            video.currentTime = 49;
            video.play().catch(error => {});
        });

        container.addEventListener('mouseleave', () => {
            video.load();
        });
    });

    // --- Cursor link hover effect ---
    const interactiveElements = document.querySelectorAll('a, .btn, .lightbox-trigger, .nav-logo');
    const body = document.querySelector('body');

    interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            body.classList.add('link-hovered');
        });
        el.addEventListener('mouseleave', () => {
            body.classList.remove('link-hovered');
        });
    });

    // --- Wandering Snake -- //
    const snake = document.createElement('a');
    snake.href = 'snake/';
    snake.target = '_blank';
    snake.textContent = '🐍';
    snake.style.position = 'fixed';
    snake.style.fontSize = '2.5rem';
    snake.style.textDecoration = 'none';
    snake.style.zIndex = '2147483647'; // show above everything
    snake.style.userSelect = 'none';
    snake.style.cursor = 'none';
    snake.style.opacity = '0.4'
    document.body.appendChild(snake);

    //animation vars
    //x,y random spawn
    let x = Math.random() * (window.innerWidth - 50);
    let y = Math.random() * (window.innerHeight - 50);
    //speed
    let dx = 1;
    let dy = 1;

    //movement logic (dvd logo)
    function animateSnake() {
        const { innerWidth, innerHeight } = window;
        x += dx;
        y += dy;
        // bounce off left/right walls
        if (x + 40 >= innerWidth || x <= 0) {
            dx = -dx;
        }
        //top/bottom
        if (y + 40 >= innerHeight || y <= 0) {
            dy = -dy;
        }
        // Apply new position
        snake.style.left = `${x}px`;
        snake.style.top = `${y}px`;

        requestAnimationFrame(animateSnake);
    }
    animateSnake();

    //custom Cursor integration
    snake.addEventListener('mouseenter', () => body.classList.add('link-hovered'));
    snake.addEventListener('mouseleave', () => body.classList.remove('link-hovered'));
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

    //calculate percentage scrolled
    var scrolled = (scrollTop/(scrollHeight - viewportHeight)) * 100;

    //set width of progress bar
    document.getElementById("progressBar").style.width = scrolled + "%"
}
// --- Custom Cursor Logic ---
const cursorDot = document.querySelector('.cursor-dot');
const cursorCircle = document.querySelector('.cursor-circle');

let dotX = 0, dotY = 0;
let circleX = 0, circleY = 0;

window.addEventListener('mousemove', (e) => {
    dotX = e.clientX;
    dotY = e.clientY;
});

const animateCursor = () => {
    // Move dot instantly
    cursorDot.style.left = `${dotX}px`;
    cursorDot.style.top = `${dotY}px`;

    // Move circle with a delay (easing/lerping)
    // The closer the divisor (e.g., 8), the faster the trail
    circleX += (dotX - circleX) / 8;
    circleY += (dotY - circleY) / 8;

    cursorCircle.style.left = `${circleX}px`;
    cursorCircle.style.top = `${circleY}px`;

    requestAnimationFrame(animateCursor);
};

animateCursor();

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