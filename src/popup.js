document.getElementById('save').addEventListener('click', function() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    chrome.storage.sync.set({ username, password }, function() {
        console.log('Credentials saved');
        alert('Credentials saved successfully!');
    });
});
