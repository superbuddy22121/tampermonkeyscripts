// ==UserScript==
// @name         Reading View with Auto-Scroll (Adjustable Speed)
// @namespace    http://tampermonkey.net/
// @version      0.8
// @description  Create a reading view with auto-scroll functionality and directly adjustable speed
// @match        *://*/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    function log(message) {
        console.log(`[AutoScroll Debug] ${message}`);
    }

    log('Script started');

    window.addEventListener('load', function() {
        log('Window loaded');

        // Create and add the control panel
        const controlPanel = document.createElement('div');
        controlPanel.innerHTML = `
            <button id="tm-toggleReadingView">Toggle Reading View</button>
            <input type="range" id="tm-scrollSpeed" min="4" max="30" value="10" step="0.1">
            <label for="tm-scrollSpeed">Scroll Speed: <span id="tm-speedDisplay">10.0</span> px/s</label>
            <button id="tm-startScroll">Start Scroll</button>
            <button id="tm-stopScroll">Stop Scroll</button>
            <div id="tm-scrollInfo"></div>
        `;
        controlPanel.style.cssText = 'position: fixed; top: 10px; right: 10px; z-index: 9999; background: white; padding: 10px; border: 1px solid black;';
        document.body.appendChild(controlPanel);
        log('Control panel added');

        // Create the reading view container
        const readingView = document.createElement('div');
        readingView.id = 'tm-readingView';
        readingView.style.cssText = 'display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: white; overflow-y: auto; padding: 20px; box-sizing: border-box; z-index: 9998;';
        document.body.appendChild(readingView);
        log('Reading view container added');

        // Auto-scroll functionality
        let isScrolling = false;
        let lastScrollTime = 0;
        let totalScrolled = 0;
        const startScroll = document.getElementById('tm-startScroll');
        const stopScroll = document.getElementById('tm-stopScroll');
        const scrollSpeed = document.getElementById('tm-scrollSpeed');
        const speedDisplay = document.getElementById('tm-speedDisplay');
        const scrollInfo = document.getElementById('tm-scrollInfo');

        function updateSpeedDisplay() {
            const speed = parseFloat(scrollSpeed.value);
            speedDisplay.textContent = speed.toFixed(1);
            log(`Speed updated: ${speed.toFixed(1)} px/s`);
        }

        scrollSpeed.addEventListener('input', updateSpeedDisplay);
        updateSpeedDisplay();

        function getMaxScroll() {
            return Math.max(
                document.body.scrollHeight,
                document.documentElement.scrollHeight,
                document.body.offsetHeight,
                document.documentElement.offsetHeight,
                document.body.clientHeight,
                document.documentElement.clientHeight
            ) - window.innerHeight;
        }

        function scrollStep(timestamp) {
            if (!isScrolling) return;

            if (lastScrollTime === 0) lastScrollTime = timestamp;
            const elapsed = timestamp - lastScrollTime;

            if (elapsed > 1000 / 60) { // Limit to 60 FPS
                const speed = parseFloat(scrollSpeed.value);
                const scrollAmount = (speed * elapsed) / 1000;
                totalScrolled += scrollAmount;

                const maxScroll = getMaxScroll();
                const newScrollPosition = Math.min(totalScrolled, maxScroll);

                window.scrollTo(0, newScrollPosition);
                lastScrollTime = timestamp;

                log(`Scrolled to ${newScrollPosition.toFixed(2)} pixels`);
                scrollInfo.textContent = `Total scrolled: ${totalScrolled.toFixed(2)} pixels`;

                // Check if scroll actually happened
                const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
                log(`Current scroll position: ${currentScroll}`);

                if (currentScroll >= maxScroll) {
                    log('Reached end of page, stopping scroll');
                    isScrolling = false;
                    return;
                }
            }

            requestAnimationFrame(scrollStep);
        }

        startScroll.addEventListener('click', function() {
            log('Start scroll clicked');
            isScrolling = true;
            lastScrollTime = 0;
            totalScrolled = window.pageYOffset || document.documentElement.scrollTop;
            requestAnimationFrame(scrollStep);
        });

        stopScroll.addEventListener('click', function() {
            log('Stop scroll clicked');
            isScrolling = false;
        });

        log('Script setup complete');
        log(`Max scroll: ${getMaxScroll()} pixels`);
    });
})();