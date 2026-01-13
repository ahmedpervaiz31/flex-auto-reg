if (window.location.href.includes('CourseRegistration')) {
    console.log("Already on CourseRegistration page, skipping redirect");
} else {
    setTimeout(() => {
        console.log("checking selectors");
        
        // Find the Course Registration link directly
        const courseRegLink = document.querySelector("a[href*='CourseRegistration']");
        
        if (courseRegLink) {
            const href = courseRegLink.getAttribute('href');
            console.log("✅ Found Course Registration link:", href);
            
            // Extract dump parameter
            const match = href.match(/dump=([^&]+)/);
            const dumpParam = match ? match[1] : "";
            
            if (dumpParam) {
                console.log("✅ Found dump parameter:", dumpParam);
                window.location.href = `https://flexstudent.nu.edu.pk/Student/CourseRegistration?dump=${dumpParam}`;
            } else {
                console.log("⚠️ No dump parameter, redirecting without it");
                window.location.href = "https://flexstudent.nu.edu.pk/Student/CourseRegistration";
            }
        } else {
            console.log("❌ Course Registration link not found yet");
        }
    }, 2000);
}