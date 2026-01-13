console.log("Flexi-Fixed login content script loaded ✅");

function fillForm(rollNo, password) {
    const rollNoInput = document.getElementById('m_inputmask_4');
    const passwordInput = document.getElementById('pass');
    const rememberMeCheckbox = document.getElementById('remember');

    if (rollNoInput && passwordInput && rememberMeCheckbox) {
        rollNoInput.value = rollNo;
        passwordInput.value = password;
        rememberMeCheckbox.checked = true;

        rollNoInput.dispatchEvent(new Event('input', { bubbles: true }));
        passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
        rememberMeCheckbox.dispatchEvent(new Event('change', { bubbles: true }));

        console.log("Login form auto-filled ✅");

        chrome.storage.local.set({ 'formFilled': true });
    }
}

// Auto-fill credentials and click login
chrome.storage.local.get(['rollNo', 'password'], function (data) {
    if (data.rollNo && data.password) {
        fillForm(data.rollNo, data.password);

        setTimeout(() => {
            const signInButton = document.getElementById('m_login_signin_submit');
            if (signInButton) {
                console.log("✅ Sign in button found, clicking...");
                signInButton.click();
               
                // set flag that we just logged in
                chrome.storage.local.set({ justLoggedIn: true });
            }
        }, 3000);
    }
});
 
