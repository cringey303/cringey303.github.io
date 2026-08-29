// router.js — lightweight in-place page swapper.
//
// Turns the multi-folder site into a single-page app: internal nav links swap
// the <body> and page-specific <head> assets in place instead of triggering a
// full document load. Pages are prefetched on idle so the swap is instant.
//
// Every folder's index.html remains a complete, standalone page, so direct
// URLs, refreshes, and no-JS all keep working exactly as before.

(function () {
    if (window.__spaRouter) return;
    window.__spaRouter = true;

    // Normalised route key -> canonical URL to fetch / push.
    var ROUTES = {
        "": "/",
        "projects": "/projects/",
        "about": "/about/",
        "education": "/education/",
        "contact": "/contact/"
    };

    var docCache = {};        // route key -> Promise<string html>
    var loadedScripts = {};   // absolute src -> true (don't re-execute)
    var currentKey = null;    // route key currently rendered

    // Anything already on the first page is considered loaded.
    [].forEach.call(document.querySelectorAll('script[src]'), function (s) {
        loadedScripts[s.src] = true;
    });

    function routeKey(pathname) {
        return pathname.replace(/index\.html$/, "").replace(/^\/+|\/+$/g, "");
    }

    function isRoute(pathname) {
        return routeKey(pathname) in ROUTES;
    }

    function abs(url) {
        return new URL(url, location.origin).href;
    }

    function fetchDoc(key) {
        if (!docCache[key]) {
            docCache[key] = fetch(ROUTES[key], { credentials: "same-origin" })
                .then(function (r) {
                    if (!r.ok) throw new Error("HTTP " + r.status);
                    return r.text();
                })
                .catch(function (err) {
                    docCache[key] = null; // allow a retry later
                    throw err;
                });
        }
        return docCache[key];
    }

    // --- <head> reconciliation ---------------------------------------------

    function stylesheetsOf(docHead) {
        return [].map.call(
            docHead.querySelectorAll('link[rel="stylesheet"]'),
            function (l) {
                return { href: abs(l.getAttribute("href")), media: l.getAttribute("media") || "" };
            }
        );
    }

    // Adds any missing stylesheets in a non-applying state and resolves once
    // they have parsed. Returns an `activate()` that flips the new sheets on
    // and drops the old ones — call it in the same synchronous tick as the
    // body swap so the visual change is atomic (no flash of unstyled content).
    function syncStylesheets(newDoc) {
        var desired = stylesheetsOf(newDoc.head);
        var desiredHrefs = desired.map(function (d) { return d.href; });
        var currentLinks = [].slice.call(document.head.querySelectorAll('link[rel="stylesheet"]'));
        var currentHrefs = currentLinks.map(function (l) { return l.href; });

        // preconnects: add once, never wait on or remove.
        [].forEach.call(newDoc.head.querySelectorAll('link[rel="preconnect"]'), function (pc) {
            var href = abs(pc.getAttribute("href"));
            var have = [].some.call(document.head.querySelectorAll('link[rel="preconnect"]'), function (e) {
                return e.href === href;
            });
            if (have) return;
            var l = document.createElement("link");
            l.rel = "preconnect";
            l.href = href;
            if (pc.hasAttribute("crossorigin")) l.crossOrigin = pc.getAttribute("crossorigin") || "";
            document.head.appendChild(l);
        });

        var pending = [];
        desired.forEach(function (d) {
            if (currentHrefs.indexOf(d.href) !== -1) return;
            var link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = d.href;
            link.setAttribute("data-spa-media", d.media);
            link.setAttribute("data-spa-pending", "1");
            link.media = "print"; // parsed but not applied yet
            pending.push(new Promise(function (resolve) {
                link.addEventListener("load", resolve);
                link.addEventListener("error", resolve);
                setTimeout(resolve, 2000);
            }));
            document.head.appendChild(link);
        });

        return Promise.all(pending).then(function () {
            return function activate() {
                [].forEach.call(document.head.querySelectorAll('link[data-spa-pending="1"]'), function (l) {
                    var m = l.getAttribute("data-spa-media");
                    if (m) l.media = m; else l.removeAttribute("media");
                    l.removeAttribute("data-spa-pending");
                });
                currentLinks.forEach(function (l) {
                    if (desiredHrefs.indexOf(l.href) === -1) l.remove();
                });
            };
        });
    }

    function syncIcon(newDoc) {
        var want = newDoc.head.querySelector('link[rel~="icon"]');
        var have = document.head.querySelector('link[rel~="icon"]');
        if (want) {
            var href = abs(want.getAttribute("href"));
            if (have) {
                have.href = href;
            } else {
                var l = document.createElement("link");
                l.rel = "icon";
                l.href = href;
                var t = want.getAttribute("type");
                if (t) l.type = t;
                document.head.appendChild(l);
            }
        } else if (have) {
            have.remove();
        }
    }

    // --- <body> swap ------------------------------------------------------

    function swapBody(newDoc, deferredScripts) {
        var incoming = newDoc.body;

        [].forEach.call(incoming.querySelectorAll("script"), function (s) {
            deferredScripts.push(s);
            s.parentNode.removeChild(s);
        });

        var body = document.body;
        [].slice.call(body.attributes).forEach(function (a) { body.removeAttribute(a.name); });
        [].slice.call(incoming.attributes).forEach(function (a) { body.setAttribute(a.name, a.value); });
        body.innerHTML = incoming.innerHTML;
    }

    function runScripts(scripts) {
        scripts.forEach(function (s) {
            var src = s.getAttribute("src");
            var el = document.createElement("script");
            if (src) {
                var full = abs(src);
                if (loadedScripts[full]) return;
                loadedScripts[full] = true;
                [].slice.call(s.attributes).forEach(function (a) { el.setAttribute(a.name, a.value); });
                el.removeAttribute("defer");
                el.removeAttribute("async");
            } else {
                el.textContent = s.textContent;
            }
            document.body.appendChild(el);
        });
    }

    // --- page lifecycle --------------------------------------------------

    function initPage() {
        var page = document.body.getAttribute("data-page");
        try {
            if (page === "home" && typeof window.initHomePage === "function") window.initHomePage();
            else if (page === "sub" && typeof window.initSubPage === "function") window.initSubPage();
        } catch (err) {
            console.error("page init failed", err);
        }
    }

    var navToken = 0;

    function navigate(pathname, push) {
        var key = routeKey(pathname);
        if (!(key in ROUTES)) { location.href = pathname; return; }
        if (key === currentKey) {
            if (push) window.scrollTo(0, 0);
            return;
        }

        var token = ++navToken;

        fetchDoc(key).then(function (html) {
            if (token !== navToken) return;
            var newDoc = new DOMParser().parseFromString(html, "text/html");
            return syncStylesheets(newDoc).then(function (activate) {
                if (token !== navToken) return;

                var deferredScripts = [];
                swapBody(newDoc, deferredScripts);   // new markup, new sheets still inert
                activate();                          // flip sheets + drop old — same tick
                document.title = newDoc.title || document.title;
                syncIcon(newDoc);

                if (push) {
                    history.pushState({ spa: true }, "", ROUTES[key]);
                    window.scrollTo(0, 0);
                }

                currentKey = key;
                runScripts(deferredScripts);
                initPage();
            });
        }).catch(function (err) {
            console.warn("router falling back to full navigation:", err);
            location.href = pathname;
        });
    }

    // --- wiring ---------------------------------------------------------

    document.addEventListener("click", function (e) {
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

        var a = e.target.closest && e.target.closest("a[href]");
        if (!a) return;
        if (a.target === "_blank" || a.hasAttribute("download") || a.getAttribute("rel") === "external") return;

        var href = a.getAttribute("href");
        if (!href || href.charAt(0) === "#") return;

        var url;
        try { url = new URL(href, location.href); } catch (_) { return; }
        if (url.origin !== location.origin || !isRoute(url.pathname)) return;

        e.preventDefault();
        if (routeKey(url.pathname) === routeKey(location.pathname)) {
            window.scrollTo(0, 0);
            return;
        }
        navigate(url.pathname, true);
    });

    window.addEventListener("popstate", function () {
        if (isRoute(location.pathname)) navigate(location.pathname, false);
    });

    // Warm the cache: prefetch the other routes and the "other" design's CSS.
    function warm() {
        Object.keys(ROUTES).forEach(function (k) {
            if (k !== routeKey(location.pathname)) fetchDoc(k).catch(function () {});
        });
        [
            "/style.css",
            "/projects/style.css",
            "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css",
            "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css",
            "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap"
        ].forEach(function (href) {
            var l = document.createElement("link");
            l.rel = "prefetch";
            l.href = href;
            document.head.appendChild(l);
        });
    }
    if ("requestIdleCallback" in window) requestIdleCallback(warm);
    else setTimeout(warm, 300);

    currentKey = routeKey(location.pathname);
    history.replaceState({ spa: true }, "");
    initPage();
})();
