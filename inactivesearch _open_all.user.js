// ==UserScript==
// @name         inactivesearch - openAll in new tab
// @namespace    http://tampermonkey.net/
// @version      2026-10-13
// @description  Add a button which opens all results on the page in new tabs
// @author       @bence04
// @match        https://www.inactivesearch.com/*
// @match        https://inactivesearch.com/*
// @match        https://www.inactivesearch.it/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=inactivesearch.com
// @grant        GM_openInTab
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    // Village links: Travian position details or map coordinates
    const VILLAGE_LINK_RE = /position_details\.php|karte\.php\?.*[xy]=/i;

    function getPositionLinks() {
        const seen = new Set();
        const pick = (root) => {
            root.querySelectorAll('a[href]').forEach(a => {
                if (VILLAGE_LINK_RE.test(a.href)) seen.add(a.href);
            });
        };
        // Prefer links inside result tables, fall back to the whole page
        document.querySelectorAll('table').forEach(pick);
        if (seen.size === 0) pick(document);
        return [...seen];
    }

    function openTab(url) {
        if (typeof GM_openInTab === 'function') {
            // Not blocked by the popup blocker
            GM_openInTab(url, { active: false, insert: true, setParent: true });
        } else {
            window.open(url, '_blank');
        }
    }

    function showConfirmationDialog(linkCount, callback) {
        if (localStorage.getItem('travianSkipConfirm') === 'true') {
            callback(true);
            return;
        }

        const overlay = document.createElement('div');
        Object.assign(overlay.style, {
            position: 'fixed', inset: '0', backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: '99999', display: 'flex', justifyContent: 'center', alignItems: 'center'
        });

        const dialog = document.createElement('div');
        Object.assign(dialog.style, {
            background: '#fff', color: '#111', padding: '20px', borderRadius: '8px',
            boxShadow: '0 0 10px rgba(0,0,0,0.3)', maxWidth: '420px', fontFamily: 'sans-serif'
        });
        dialog.innerHTML = `
            <p style="white-space: pre-line; margin-top: 0;">Are you sure you want to open all (${linkCount}) village links in new tabs?</p>
            <label><input type="checkbox" class="is-dont-ask"> Don't ask again</label><br><br>
            <button type="button" class="is-yes">Yes, open all</button>
            <button type="button" class="is-no">Cancel</button>
        `;

        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        dialog.querySelector('.is-yes').onclick = () => {
            if (dialog.querySelector('.is-dont-ask').checked) {
                localStorage.setItem('travianSkipConfirm', 'true');
            }
            overlay.remove();
            callback(true);
        };
        dialog.querySelector('.is-no').onclick = () => {
            overlay.remove();
            callback(false);
        };
    }

    function openAllLinks() {
        const links = getPositionLinks();
        if (links.length === 0) {
            alert('No village links found on this page.');
            return;
        }
        showConfirmationDialog(links.length, (confirmed) => {
            if (confirmed) links.forEach(openTab);
        });
    }

    function addOpenAllButton() {
        if (document.getElementById('is-open-all-btn')) return;

        // Floating button, independent from the site's layout
        const button = document.createElement('button');
        button.id = 'is-open-all-btn';
        button.type = 'button';
        button.textContent = 'Open All Villages';
        Object.assign(button.style, {
            position: 'fixed', right: '20px', bottom: '20px', zIndex: '99998',
            padding: '10px 16px', borderRadius: '8px', border: 'none',
            background: '#2f7d32', color: '#fff', fontWeight: '600',
            cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
        });
        button.onclick = openAllLinks;
        document.body.appendChild(button);
    }

    addOpenAllButton();
})();
