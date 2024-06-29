// ==UserScript==
// @name         Auto-Scroll with Element Isolation (Complete)
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  Auto-scroll functionality with customizable element isolation
// @match        *://*/*
// @grant        GM_getValue
// @grant        GM_setValue
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
            <input type="range" id="tm-scrollSpeed" min="4" max="30" value="10" step="0.1">
            <label for="tm-scrollSpeed">Scroll Speed: <span id="tm-speedDisplay">10.0</span> px/s</label>
            <button id="tm-startScroll">Start Scroll</button>
            <button id="tm-stopScroll">Stop Scroll</button>
            <div id="tm-scrollInfo"></div>
            <input type="text" id="tm-contentSelector" placeholder="Enter content selector">
            <button id="tm-updateSelector">Update Selector</button>
            <button id="tm-toggleIsolation">Toggle Isolation</button>
        `;
        controlPanel.style.cssText = 'position: fixed; top: 10px; right: 10px; z-index: 9999; background: white; padding: 10px; border: 1px solid black;';
        document.body.appendChild(controlPanel);
        log('Control panel added');

        // Create isolation container
        const isolationContainer = document.createElement('div');
        isolationContainer.id = 'tm-isolationContainer';
        isolationContainer.style.cssText = 'display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: white; overflow-y: auto; padding: 20px; box-sizing: border-box; z-index: 9998;';
        document.body.appendChild(isolationContainer);

        // Auto-scroll functionality
        let isScrolling = false;
        let lastScrollTime = 0;
        let totalScrolled = 0;
        const startScroll = document.getElementById('tm-startScroll');
        const stopScroll = document.getElementById('tm-stopScroll');
        const scrollSpeed = document.getElementById('tm-scrollSpeed');
        const speedDisplay = document.getElementById('tm-speedDisplay');
        const scrollInfo = document.getElementById('tm-scrollInfo');
        const contentSelector = document.getElementById('tm-contentSelector');
        const updateSelector = document.getElementById('tm-updateSelector');
        const toggleIsolation = document.getElementById('tm-toggleIsolation');

        // Load saved content selector
        contentSelector.value = GM_getValue('contentSelector', '');

        function updateSpeedDisplay() {
            const speed = parseFloat(scrollSpeed.value);
            speedDisplay.textContent = speed.toFixed(1);
            log(`Speed updated: ${speed.toFixed(1)} px/s`);
        }

        scrollSpeed.addEventListener('input', updateSpeedDisplay);
        updateSpeedDisplay();

        function getMaxScroll(element) {
            return element.scrollHeight - element.clientHeight;
        }

        function scrollStep(timestamp) {
            if (!isScrolling) return;

            if (lastScrollTime === 0) lastScrollTime = timestamp;
            const elapsed = timestamp - lastScrollTime;

            if (elapsed > 1000 / 60) { // Limit to 60 FPS
                const speed = parseFloat(scrollSpeed.value);
                const scrollAmount = (speed * elapsed) / 1000;
                totalScrolled += scrollAmount;

                const scrollElement = isIsolated ? isolationContainer : window;
                const maxScroll = getMaxScroll(isIsolated ? isolationContainer : document.documentElement);
                const newScrollPosition = Math.min(totalScrolled, maxScroll);

                scrollElement.scrollTo(0, newScrollPosition);
                lastScrollTime = timestamp;

                log(`Scrolled to ${newScrollPosition.toFixed(2)} pixels`);
                scrollInfo.textContent = `Total scrolled: ${totalScrolled.toFixed(2)} pixels`;

                // Check if scroll actually happened
                const currentScroll = isIsolated ? isolationContainer.scrollTop : (window.pageYOffset || document.documentElement.scrollTop);
                log(`Current scroll position: ${currentScroll}`);

                if (currentScroll >= maxScroll) {
                    log('Reached end of content, stopping scroll');
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
            totalScrolled = isIsolated ? isolationContainer.scrollTop : (window.pageYOffset || document.documentElement.scrollTop);
            requestAnimationFrame(scrollStep);
        });

        stopScroll.addEventListener('click', function() {
            log('Stop scroll clicked');
            isScrolling = false;
        });

        let isIsolated = false;

        function isolateElement() {
            const selector = GM_getValue('contentSelector', '');
            if (selector) {
                const element = document.querySelector(selector);
                if (element) {
                    isIsolated = true;
                    isolationContainer.innerHTML = '';
                    const clonedElement = element.cloneNode(true);
                    isolationContainer.appendChild(clonedElement);
                    isolationContainer.style.display = 'block';
                    document.body.style.overflow = 'hidden';
                    log('Element isolated');
                } else {
                    log('Selected element not found');
                    alert('Selected element not found. Please check your selector.');
                }
            } else {
                log('No selector specified');
                alert('Please specify a selector before toggling isolation.');
            }
        }

        function restoreOriginalLayout() {
            isIsolated = false;
            isolationContainer.style.display = 'none';
            isolationContainer.innerHTML = '';
            document.body.style.overflow = '';
            log('Original layout restored');
        }

        toggleIsolation.addEventListener('click', function() {
            if (isIsolated) {
                restoreOriginalLayout();
            } else {
                isolateElement();
            }
            // Reset scrolling when toggling isolation
            isScrolling = false;
            totalScrolled = 0;
        });

        updateSelector.addEventListener('click', function() {
            const newSelector = contentSelector.value;
            GM_setValue('contentSelector', newSelector);
            log(`Content selector updated to: ${newSelector}`);
            if (isIsolated) {
                restoreOriginalLayout();
                isolateElement();
            }
        });

        log('Script setup complete');
    });
})();