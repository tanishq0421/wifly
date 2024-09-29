import { getLoginPage, getMagic, doLogin } from './wifiLogin';

const MAX_RETRIES = 5;
let retryCount = 0;
let isAuthorized = false; // Track whether the user is logged in

// Function to trigger Chrome notifications
function showNotification(message) {
    const now = new Date().toLocaleTimeString();
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'WiFi Auto Login',
        message: `${message} at ${now}.`
    });
}

// Function to check the login and execute the login process with retries
async function checkAndLogin() {
    try {
        const data = await new Promise((resolve, reject) => {
            chrome.storage.sync.get(['username', 'password'], (result) => {
                if (chrome.runtime.lastError) {
                    return reject(chrome.runtime.lastError);
                }
                resolve(result);
            });
        });

        const username = data.username;
        const password = data.password;

        const loginPageUrl = await getLoginPage();
        const magicToken = await getMagic(loginPageUrl);
        const { logoutUrl, keepAliveUrl } = await doLogin(username, password, magicToken);

        console.log("Login successful");
        showNotification("Logged in successfully");
        retryCount = 0; // Reset retry count on success
        isAuthorized = true;

        // Optionally: Start keep-alive process
        startKeepAlive(keepAliveUrl);

    } catch (error) {
        retryCount++;
        console.error("Login attempt failed:", error);

        if (retryCount < MAX_RETRIES) {
            console.log(`Retrying login... (${retryCount}/${MAX_RETRIES})`);
            await checkAndLogin(); // Add await here to ensure proper retry logic
        } else {
            showNotification("Auto-login failed after multiple attempts");
            openManualLoginPopup(); // Open manual login popup or redirect
            isAuthorized = false;
        }
    }
}

// Function to start the keep-alive process
function startKeepAlive(keepAliveUrl) {
    console.log("Starting keep-alive process...");
    setInterval(async () => {
        try {
            const response = await fetch(keepAliveUrl, {
                method: 'GET',
                credentials: 'include' // Include cookies if needed
            });
            const text = await response.text();

            if (!text.includes("leave it open")) {
                console.log("Keep-alive unsuccessful; Trying to log in again");
                await checkAndLogin(); // Attempt to log in again if keep-alive fails
            } else {
                console.log("Keep-alive successful");
            }
        } catch (error) {
            console.error("Keep-alive error:", error);
        }
    }, 10000); // Adjust the interval as needed (e.g., every 10 seconds)
}

// Function to open manual login popup
function openManualLoginPopup() {
    const loginPageUrl = `${firewallUrl}/login`; // URL of the original login page
    chrome.tabs.create({ url: loginPageUrl }); // Open the login page in a new tab
}

// Monitor network status changes
function monitorNetworkStatus() {
    window.addEventListener('online', () => {
        console.log("Network reconnected, attempting login...");
        checkAndLogin(); // Trigger login when network reconnects
    });

    window.addEventListener('offline', () => {
        console.log("Network disconnected");
    });
}

// Periodic check for authorization/logout
function monitorAuthorization() {
    setInterval(async () => {
        try {
            const response = await fetch(firewallUrl + '/logout?', { method: 'GET' });
            const text = await response.text();

            if (text.includes("Requires Authorization")) {
                console.log("Authorization needed, attempting login...");
                await checkAndLogin(); // Auto-login if authorization required
            }
        } catch (error) {
            console.error("Error checking authorization:", error);
        }
    }, 60000); // Check every 60 seconds
}

// Set up periodic check using Chrome alarms for regular login check
chrome.alarms.create('autoLoginCheck', { periodInMinutes: 60 });

// Handle the alarm event to trigger the login check
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'autoLoginCheck') {
        console.log('Checking for login status...');
        checkAndLogin();
    }
});

// Monitor network and authorization status on load
chrome.runtime.onStartup.addListener(() => {
    monitorNetworkStatus();
    monitorAuthorization();
    checkAndLogin(); // Try logging in on startup
});
