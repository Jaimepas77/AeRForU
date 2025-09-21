// background.js
// Service worker that receives messages from the content script and reads cookies
// using the chrome.cookies API. We keep this minimal and only implement the
// message necessary for this task.

/**
 * Message structure expected:
 *  { type: "GET_COOKIE", url: "<current page url>", name: "super" }
 *
 * Response:
 *  { success: true, value: "<cookie-value>" } or { success: false, error: "..." }
 */

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message && message.type === "GET_COOKIE") {
        const { url, name } = message;
        // Use chrome.cookies.get to fetch the cookie for the given url + name.
        // This can return cookies that are HttpOnly (unlike document.cookie).
        chrome.cookies.get({ url, name }, (cookie) => {
            if (chrome.runtime.lastError) {
                // Send a structured error back to the content script
                sendResponse({ success: false, error: chrome.runtime.lastError.message });
                return;
            }
            if (!cookie) {
                sendResponse({ success: false, error: "Cookie not found" });
                return;
            }
            // Found cookie: return its value
            sendResponse({ success: true, value: cookie.value });
        });

        // Return true to indicate we will send a response asynchronously.
        return true;
    }
    else if (message && message.type === "GET_COOKIES") {
        //{ type: "GET_COOKIES", url: pageUrl, names: [ "acrsession", "ACR_SessionCookie" ] }
        const { url, names } = message;
        // Use chrome.cookies.getAll to fetch all cookies for the given url.
        chrome.cookies.getAll({ url }, (cookies) => {
            if (chrome.runtime.lastError) {
                sendResponse({ success: false, error: chrome.runtime.lastError.message });
                return;
            }

            const values = {};
            for (const name of names) {
                const cookie = cookies.find((c) => c.name === name);
                values[name] = cookie ? cookie.value : null;
            }

            sendResponse({ success: true, values });
        });

        // Return true to indicate we will send a response asynchronously.
        return true;
    }
    // For other message types, do nothing (no response).
    return false;
});
