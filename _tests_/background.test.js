import { firewallUrl, getLoginPage, getMagic, doLogin } from '../src/wifiLogin.js';

global.fetch = jest.fn();

describe('WiFi Login Functions', () => {
  
  beforeEach(() => {
    jest.clearAllMocks(); // Clear any previous mock calls
  });

  test('getLoginPage fetches login page URL successfully', async () => {
    const mockResponse = 'Some content with "http://192.168.249.1:1000/login" URL';
    
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        text: () => Promise.resolve(mockResponse),
        ok: true,
      })
    );

    const loginPageUrl = await getLoginPage();
    expect(loginPageUrl).toBe('http://192.168.249.1:1000/login');
    expect(fetch).toHaveBeenCalledWith(firewallUrl + '/logout?', { method: 'GET' });
  });

  test('getLoginPage throws an error on failure', async () => {
    fetch.mockImplementationOnce(() => Promise.reject(new Error('Network Error')));

    await expect(getLoginPage()).rejects.toThrow('Error fetching login page');
  });

  test('getMagic fetches magic token successfully', async () => {
    const mockLoginPageContent = 'Some content with "magic" value="mockMagicToken"';
    
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        text: () => Promise.resolve(mockLoginPageContent),
        ok: true,
      })
    );

    const magicToken = await getMagic('http://192.168.249.1:1000/login');
    expect(magicToken).toBe('mockMagicToken');
    expect(fetch).toHaveBeenCalledWith('http://192.168.249.1:1000/login');
  });

  test('getMagic throws an error on failure', async () => {
    fetch.mockImplementationOnce(() => Promise.reject(new Error('Network Error')));

    await expect(getMagic('http://192.168.249.1:1000/login')).rejects.toThrow('Error fetching magic token');
  });

  test('doLogin sends login data successfully', async () => {
    const mockResponseContent = `
      Successful login! 
      <a href="http://192.168.249.1:1000/logout">logout</a>
      <a href="http://192.168.249.1:1000/keepalive">keepalive</a>
    `;
    
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        text: () => Promise.resolve(mockResponseContent),
        ok: true,
      })
    );

    const { logoutUrl, keepAliveUrl } = await doLogin('your-username', 'your-password', 'mockMagicToken');
    
    expect(logoutUrl).toBe('http://192.168.249.1:1000/logout');
    expect(keepAliveUrl).toBe('http://192.168.249.1:1000/keepalive');
    expect(fetch).toHaveBeenCalledWith(firewallUrl + '/', {
      method: 'POST',
      body: expect.any(URLSearchParams),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
  });

  test('doLogin throws an error on failure', async () => {
    fetch.mockImplementationOnce(() => Promise.reject(new Error('Network Error')));

    await expect(doLogin('your-username', 'your-password', 'mockMagicToken')).rejects.toThrow('Error during login');
  });
});
