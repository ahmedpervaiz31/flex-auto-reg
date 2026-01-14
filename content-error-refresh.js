(function() {
    const pageText = document.body ? document.body.innerText.toLowerCase() : '';
    const errorPatterns = [
        /runtime error/,
        /service(?:s)? (?:is|are)? unavailable/,
        /unavailable service/,
        /temporarily unavailable/,
        /unavailable/,
        /server error/,
        /service unavailable/,
        /error 503/,
        /error 500/,
        /an unexpected error has occurred/,
        /please try again later/,
        /unable to process your request at this time/,
        /something went wrong/
    ];
    if (errorPatterns.some(re => re.test(pageText))) {
        console.log("[AutoReg] Detected error, refreshing in 5 seconds...");
        setTimeout(() => {
            location.reload();
        }, 5000);
    }
})();