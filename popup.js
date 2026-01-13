document.getElementById('form').addEventListener('submit', function (event) {
    event.preventDefault();
    const rollNo = document.getElementById('rollNo').value.toUpperCase();
    const password = document.getElementById('password').value;

    chrome.storage.local.set({ 'rollNo': rollNo, 'password': password }, function () {
        document.getElementById('status').innerText = '✅ Credentials saved!';
    });
});

document.getElementById('deleteData').addEventListener('click', function () {
    chrome.storage.local.remove(['rollNo', 'password'], function () {
        document.getElementById('rollNo').value = '';
        document.getElementById('password').value = '';
        document.getElementById('status').innerText = '🗑️ Data deleted!';
    });
});

// Save refresh interval
document.getElementById('saveInterval').addEventListener('click', function () {
    const interval = parseInt(document.getElementById('interval').value, 10);
    if (interval >= 3) {
        chrome.storage.local.set({ 'refreshInterval': interval }, function () {
            document.getElementById('status').innerText = `🔄 Interval set to ${interval}s`;
        });
    } else {
        document.getElementById('status').innerText = '❌ Minimum interval is 3 seconds';
    }
});

// Load existing data on popup open
document.addEventListener('DOMContentLoaded', function () {
    chrome.storage.local.get(['rollNo', 'password', 'refreshInterval'], function (data) {
        if (data.rollNo) document.getElementById('rollNo').value = data.rollNo;
        if (data.password) document.getElementById('password').value = data.password;
        if (data.refreshInterval) document.getElementById('interval').value = data.refreshInterval;
    });
});
