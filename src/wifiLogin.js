export const firewallUrl = "http://192.168.249.1:1000";

export async function getLoginPage() {
  try {
    const response = await fetch(firewallUrl + '/logout?', { method: 'GET' });
    const text = await response.text();
    const loginPageUrl = text.match(/"http[^"]+"/)[0].replace(/"/g, '');
    return loginPageUrl;
  } catch (error) {
    throw new Error("Error fetching login page");
  }
}

export async function getMagic(loginPageUrl) {
  try {
    const response = await fetch(loginPageUrl);
    const text = await response.text();
    const magicToken = text.match(/"magic" value="([^"]*)"/)[1];
    return magicToken;
  } catch (error) {
    throw new Error("Error fetching magic token");
  }
}

export async function doLogin(username, password, magicToken) {
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);
  formData.append('magic', magicToken);
  formData.append('submit', 'Continue');

  try {
    const response = await fetch(firewallUrl + '/', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    const text = await response.text();
    const logoutUrl = text.match(/http[^"]*logout[^"]*/)[0];
    const keepAliveUrl = text.match(/http[^"]*keepalive[^"]*/)[0];
    return { logoutUrl, keepAliveUrl };
  } catch (error) {
    throw new Error("Error during login");
  }
}
