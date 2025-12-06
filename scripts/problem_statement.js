let SHOW_LEVEL = null;

chrome.storage.local.get(['SHOW_LEVEL'], function(data) {
    if (data.SHOW_LEVEL !== undefined) {
        SHOW_LEVEL = data.SHOW_LEVEL;
    }
    else {
        chrome.storage.local.set({ SHOW_LEVEL: true });
        SHOW_LEVEL = true;
    }
});

(function() {
    console.log("Statement page");
    showLevel();
    updateCategories();
    showRecommendations();
})();

async function showLevel() {
    if (SHOW_LEVEL === null) setTimeout(showLevel, 100);

    if (!SHOW_LEVEL) return;

    console.log("Showing problem levels...");
    
    // Extract problem id from URL
    const urlParams = new URLSearchParams(window.location.search);
    const problem_id = urlParams.get('id');

    const problem_level = await getProblemLevel(problem_id);

    // DOM manipulation
    const exercise_div = document.getElementsByClassName("statement")[0]?.children[0];
    if (!exercise_div) {
        console.error("Could not find statement element");
        return;
    }

    // Create div and append in the first position
    const level_div = document.createElement("div");
    level_div.style.cssText = `
        font-size: 16px;
        margin-bottom: 10px;
        margin-top: -10px;
    `;
    
    exercise_div.insertBefore(level_div, exercise_div.children[0]);
    
    // Create progress bar with initial 0 value, then animate to actual value
    await createProgressBarWithAnimation(level_div, problem_level);
}
