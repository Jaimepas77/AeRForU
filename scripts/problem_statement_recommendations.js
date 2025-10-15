let SHOW_RECOMMENDATIONS = null; // Recommended problems toggle

chrome.storage.local.get(['SHOW_RECOMMENDATIONS'], function(data) {
    if (data.SHOW_RECOMMENDATIONS !== undefined) {
        SHOW_RECOMMENDATIONS = data.SHOW_RECOMMENDATIONS;
    }
    else {
        chrome.storage.local.set({ SHOW_RECOMMENDATIONS: true });
        SHOW_RECOMMENDATIONS = true;
    }
});

chrome.storage.onChanged.addListener(function (changes, namespace) {
    if (namespace === 'local') {
        for (let key in changes) {
            if (key === 'SHOW_RECOMMENDATIONS') {
                SHOW_RECOMMENDATIONS = changes[key].newValue;
            }
        }
    }
});

(function() {
    console.log("Recommendations page");
    showRecommendations();
})();

async function showRecommendations() {
    if (SHOW_RECOMMENDATIONS === null) setTimeout(showRecommendations, 100);
    if (!SHOW_RECOMMENDATIONS) return;

    console.log("Showing problem recommendations...");

    const problemId = await getProblemId();
    if (!problemId) {
        console.error("Could not find problem ID in URL");
        return;
    }

    let categories = await getCachedProblemCategories(problemId);
    if (!categories || categories.length === 0) {
        console.log("No categories found for problem " + problemId);
        return;
    }

    // Create a map to store problems and their counts
    let problemCountMap = new Map();

    for (let i = 0; i < categories.length; i++) {
        let problem_info_array = await getCategoryProblems(categories[i]);

        for (let j = 0; j < problem_info_array.length; j++) {
            let prob = problem_info_array[j];
            if (prob.num.toString() === problemId.toString()) continue;
            if (problemCountMap.has(prob.num)) {
                problemCountMap.set(prob.num, problemCountMap.get(prob.num) + 1);
            } else {
                problemCountMap.set(prob.num, 1);
            }
        }
    }

    level_act = levels_dict[problemId] || null;

    // Sort problems by count in descending order
    // In case of ties, sort by level proximity to the current problem
    let sortedProblems = Array.from(problemCountMap.entries()).sort((a, b) => {
        if (b[1] === a[1]) {
            let levelA = levels_dict[a[0]] || null;
            let levelB = levels_dict[b[0]] || null;
            if (levelA !== null && levelB !== null) {
                return levelB - levelA;
            }
        }
        return b[1] - a[1];
    });

    console.log("Best problem recommendations:", sortedProblems.slice(0, 5));

    // TODO: Display the top 5 recommended problems in the UI
}

async function getProblemId() {
    const urlParams = new URLSearchParams(window.location.search);
    const problem_id = urlParams.get('id');
    return problem_id;
}
