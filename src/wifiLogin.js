// Simulating the Bash script logic in JavaScript

const firewallUrl = "http://192.168.249.1:1000";

// Fetch the login page
async function getLoginPage() {
    const response = await fetch(`${firewallUrl}/logout?`, {
        method: 'GET',
        mode: 'cors',
        credentials: 'include' // Ensure to include cookies
    });
    const text = await response.text();
    const loginPageUrl = text.match(/"htt[^"]*"/)[0].replace(/"/g, ''); // Extract login page URL
    return loginPageUrl;
}

// Fetch the magic token from the login page
async function getMagic(loginPageUrl) {
    const response = await fetch(loginPageUrl, {
        method: 'GET',
        mode: 'cors',
        credentials: 'include' // Ensure to include cookies
    });
    const text = await response.text();
    const magic = text.match(/"magic" value="([^"]*)"/)[1]; // Extract magic token
    return magic;
}

// Perform the login
async function doLogin(username, password, magicToken) {
    const response = await fetch(firewallUrl + "/", {
        method: 'POST',
        mode: 'cors',
        credentials: 'include', // Ensure to include cookies
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&magic=${magicToken}&submit=Continue`
    });
    
    const text = await response.text();
    const logoutUrl = text.match(/http[^"]*logout[^"]*/)[0];
    const keepAliveUrl = text.match(/http[^"]*keepalive[^"]*/)[0];
    
    return { logoutUrl, keepAliveUrl };
}
