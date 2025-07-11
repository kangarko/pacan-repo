const PIXEL_ID = document.currentScript.getAttribute("data-pixel-id");

function initializeFacebookPixel(f, b, e, v, n, t, s) {
    if (f.fbq) return;
    n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = "2.0";
    n.queue = [];
    t = b.createElement(e);
    t.async = !0;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
}

initializeFacebookPixel(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");

window.fbq("init", PIXEL_ID);

function setFbcCookie() {
    const urlParams = new URLSearchParams(window.location.search);
    const fbclid = urlParams.get("fbclid");

    if (fbclid) {
        const timestamp = Math.floor(Date.now() / 1000);

        document.cookie = `_fbc=fb.1.${timestamp}.${fbclid}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    }
}

setFbcCookie();