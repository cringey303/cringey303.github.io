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

    // Lightbox functionality
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxTriggers = document.querySelectorAll('.lightbox-trigger');

    lightboxTriggers.forEach(trigger => {
        trigger.addEventListener('click', () => {
            lightbox.style.display = 'flex'; // Use flex to center content
            lightboxImg.src = trigger.src;
        });
    });

    // Close lightbox when clicking on the background
    lightbox.addEventListener('click', e => {
        // We only want to close if the click is on the dark background (the lightbox itself)
        // and not on the image inside it.
        if (e.target !== lightboxImg) {
            lightbox.style.display = 'none';
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
            video.play().catch(error => {});
        });

        container.addEventListener('mouseleave', () => {
            video.pause();
            video.currentTime = 0; // Reset video to the beginning
        });
    });
});