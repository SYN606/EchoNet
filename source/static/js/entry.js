//    Blocked Temporary Email Domains
const blockedDomains = new Set([
    "tempmail.com", "10minutemail.com", "guerrillamail.com",
    "mailinator.com", "yopmail.com", "dispostable.com",
    "trashmail.com", "fakeinbox.com", "getnada.com"
]);

//    UUID Management (robust)
function generateUUIDv4() {
    try {
        if (crypto?.randomUUID) return crypto.randomUUID();

        if (crypto?.getRandomValues) {
            const bytes = new Uint8Array(16);
            crypto.getRandomValues(bytes);
            bytes[6] = (bytes[6] & 0x0f) | 0x40; // version
            bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant
            const hex = Array.from(bytes, b => b.toString(16).padStart(2, "0"));
            return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10, 16).join("")}`;
        }
    } catch (err) {
        console.warn("UUID generation fallback:", err);
    }

    // Math.random fallback (weak)
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        const v = (c === "x") ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function getOrSetUUID() {
    let uuid = null;
    try {
        uuid = localStorage.getItem("visitorUUID");
    } catch (err) {
        console.warn("localStorage unavailable:", err);
        uuid = window.__visitorUUID || null;
    }

    if (!uuid || typeof uuid !== "string" || uuid.length < 10) {
        uuid = generateUUIDv4();
        try {
            localStorage.setItem("visitorUUID", uuid);
        } catch {
            window.__visitorUUID = uuid;
        }
    }
    return uuid;
}

//    Hardware & Browser Info Collection (resilient)
async function getHardwareInfo() {
    const hw = {
        uuid: null,
        cores: navigator.hardwareConcurrency ?? null,
        memory: navigator.deviceMemory ? `${navigator.deviceMemory} GB` : null,
        screen: {
            width: screen?.width ?? null,
            height: screen?.height ?? null,
            availWidth: screen?.availWidth ?? null,
            availHeight: screen?.availHeight ?? null,
            colorDepth: screen?.colorDepth ?? null,
            pixelDepth: screen?.pixelDepth ?? null
        },
        cookies_enabled: navigator.cookieEnabled ?? null,
        language: navigator.language ?? null,
        languages: navigator.languages ?? [],
        timezone: Intl.DateTimeFormat().resolvedOptions()?.timeZone ?? null,
        dnt: navigator.doNotTrack ?? null,
        referrer: document.referrer || "Direct",
        touch_support: navigator.maxTouchPoints > 0,
        online: navigator.onLine ?? null,
        device_pixel_ratio: window.devicePixelRatio ?? 1,
        webdriver: navigator.webdriver ?? false,
        platform: null,
        architecture: null,
        device_model: null,
        browser_version: null,
        mobile: null,
        browser_brands: [],
        gpu: null,
        gpu_vendor: null
    };

    // User-Agent Client Hints (safe)
    if (navigator.userAgentData?.getHighEntropyValues) {
        try {
            const uaData = await navigator.userAgentData.getHighEntropyValues([
                "platform", "platformVersion", "architecture", "model", "uaFullVersion"
            ]);
            hw.platform = [uaData.platform, uaData.platformVersion].filter(Boolean).join(" ") || null;
            hw.architecture = uaData.architecture || null;
            hw.device_model = uaData.model || null;
            hw.browser_version = uaData.uaFullVersion || null;
            hw.mobile = navigator.userAgentData.mobile ?? false;
            hw.browser_brands = navigator.userAgentData.brands || [];
        } catch (err) {
            console.warn("UA hints unavailable:", err);
        }
    }

    // WebGL GPU Info (with try/catch)
    try {
        const canvas = document.createElement("canvas");
        const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
        if (gl) {
            hw.gpu = gl.getParameter(gl.RENDERER) || null;
            hw.gpu_vendor = gl.getParameter(gl.VENDOR) || null;
        }
    } catch (err) {
        console.warn("WebGL GPU info unavailable:", err);
    }

    return hw;
}

/* ==========================================================
   Email Validation Helpers
========================================================== */
function isValidEmail(email) {
    const basicPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!basicPattern.test(email)) return false;

    const domain = email.split("@").pop();
    if (!domain || blockedDomains.has(domain)) return false;

    return true;
}

/* ==========================================================
   Page Load Logic
========================================================== */
window.addEventListener("DOMContentLoaded", async () => {
    const uuid = getOrSetUUID();
    const hwInfo = await getHardwareInfo();
    hwInfo.uuid = uuid;

    // Attach to hidden input
    const hwInput = document.getElementById("hardware");
    if (hwInput) hwInput.value = JSON.stringify(hwInfo);

    // Send hardware log (with retry)
    try {
        await fetch("/log-hardware", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(hwInfo)
        });
    } catch (err) {
        console.warn("Failed to log hardware:", err);
    }

    // Email form handling
    const emailForm = document.getElementById("emailForm");
    if (!emailForm) return;

    emailForm.addEventListener("submit", async e => {
        e.preventDefault();
        const emailInputEl = document.getElementById("email");
        const emailInput = emailInputEl.value.trim().toLowerCase();
        const errorMsg = document.getElementById("errorMsg");

        if (!isValidEmail(emailInput)) {
            errorMsg?.classList.remove("hidden");
            return;
        }
        errorMsg?.classList.add("hidden");

        const payload = { uuid, email: emailInput };

        try {
            const resp = await fetch("/submit-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (resp.ok) {
                try {
                    localStorage.setItem("userEmail", emailInput);
                } catch {
                    window.__userEmail = emailInput;
                }
                window.location.href = "/meeting";
            } else {
                console.warn("Server rejected email:", await resp.text());
            }
        } catch (err) {
            console.error("Failed to submit email:", err);
        }
    });
});
