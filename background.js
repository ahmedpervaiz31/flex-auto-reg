// 1. Existing Installation Logs
chrome.runtime.onInstalled.addListener(() => console.log("Watchdog Installed."));

// 2. The Watchdog: Listen for navigation failures or error pages
chrome.webNavigation.onCompleted.addListener((details) => {
    // Only act on the Flex Portal
    if (details.url.includes("flexstudent.nu.edu.pk")) {
        
        chrome.scripting.executeScript({
            target: { tabId: details.tabId },
            func: () => {
                const errorTitles = ["504", "502", "503", "404", "timeout", "unavailable", "error"];
                const pageTitle = document.title.toLowerCase();
                const pageBody = document.body.innerText.toLowerCase();
                
                // Returns true if the page looks like a server error or is completely empty
                return errorTitles.some(t => pageTitle.includes(t) || pageBody.includes(t)) || 
                       document.body.children.length === 0;
            }
        }, (results) => {
            if (chrome.runtime.lastError) return;
            
            const isErrorPage = results[0]?.result;
            if (isErrorPage) {
                chrome.storage.local.get(['refreshInterval'], (data) => {
                    const retryDelay = data.refreshInterval ? data.refreshInterval * 1000 : 10000;
                    
                    console.log(`Server Error. Retrying in ${retryDelay / 1000}s...`);
                    
                    setTimeout(() => {
                        chrome.tabs.reload(details.tabId);
                    }, retryDelay);
                });
            }
        });
    }
});
// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Message received in background.js:", request);

    // Save credentials if sent
    if (request.action === "saveCreds" && request.rollNo && request.password) {
        chrome.storage.local.set(
            { rollNo: request.rollNo, password: request.password },
            () => {
                console.log("Credentials saved to storage.");
                sendResponse({ status: "ok" });
            }
        );
        return true; // keep message channel open for async
    }

    // Save refresh interval if sent
    if (request.action === "saveInterval" && request.refreshInterval) {
        chrome.storage.local.set(
            { refreshInterval: request.refreshInterval },
            () => {
                console.log(`Refresh interval set to ${request.refreshInterval}s`);
                sendResponse({ status: "ok" });
            }
        );
        return true;
    }

    // Clear stored data
    if (request.action === "clearData") {
        chrome.storage.local.remove(["rollNo", "password"], () => {
            console.log("Credentials removed from storage.");
            sendResponse({ status: "ok" });
        });
        return true;
    }
});
