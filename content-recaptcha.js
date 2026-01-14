(function solveRecaptcha() {
    console.log("content-recaptcha.js loaded in:", window.location.href);
  
    var solved = false;
    const recaptchaStatus = "#recaptcha-accessible-status";
    var recaptchaInitialStatus = qSelector(recaptchaStatus)
      ? qSelector(recaptchaStatus).innerText
      : "";
  
    function qSelector(selector) {
      return document.querySelector(selector);
    }
  
    let isRecaptchaFrame = () => {
      return /https:\/\/www.google.com\/recaptcha\/api2\/anchor/.test(
        window.location.href
      );
    };
  
    let captchaInterval;
  
    chrome.storage.local.get(["formFilled"], function (data) {
      var mainPageURL =
        window.location != window.parent.location
          ? document.referrer
          : document.location.href;
  
      if (mainPageURL.includes("https://flexstudent.nu.edu.pk")) {
        if (data.formFilled) {
          captchaInterval = setInterval(() => {
            if (isRecaptchaFrame()) {
              console.log("⏳ Clicking captcha checkbox...");
              let el = document.getElementsByClassName(
                "recaptcha-checkbox-checkmark"
              )[0];
              if (el) el.click();
            }
  
            if (
              qSelector(recaptchaStatus) &&
              qSelector(recaptchaStatus).innerText != recaptchaInitialStatus
            ) {
              solved = true;
              console.log("SOLVED CAPTCHA");
              clearInterval(captchaInterval);
              chrome.storage.local.set({ solved: solved });
              solved = false;
            }
          }, 500);
        }
      }
    });
  })();
  
  