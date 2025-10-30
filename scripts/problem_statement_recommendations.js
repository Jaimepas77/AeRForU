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

// (function() {
//     console.log("Recommendations page");
//     showRecommendations();
// })();

async function showRecommendations() {
    if (SHOW_RECOMMENDATIONS === null) setTimeout(showRecommendations, 100);
    if (!SHOW_RECOMMENDATIONS) return;

    let problemRecommendations = await new Promise((resolve) => {
        chrome.storage.local.get("problemRecommendations", function (data) {
            resolve(data.problemRecommendations || {});
        });
    });

    console.log("Showing problem recommendations...");

    const problemId = await getProblemId();
    if (!problemId) {
        console.error("Could not find problem ID in URL");
        return;
    }

    if (problemRecommendations[problemId] !== undefined) { // Use cached recommendations?
        console.log("Using cached recommendations for problem " + problemId);
        insertProblems(problemRecommendations[problemId].slice(0, 5));
        return;
    }

    // START RECOMMENDATION CALCULATION
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
            let level_a = levels_dict[a[0]] || 50;
            let level_b = levels_dict[b[0]] || 50;
            return Math.abs(level_a - level_act) - Math.abs(level_b - level_act);
        }
        return b[1] - a[1];
    });
    // END RECOMMENDATION CALCULATION

    // Update cache with top 10 recommendations (to save space)
    problemRecommendations[problemId] = sortedProblems.map(entry => entry[0]).slice(0, 10);

    // Cache sorted problems
    chrome.storage.local.set({ problemRecommendations: problemRecommendations });

    // console.log("Best problem recommendations:", sortedProblems.slice(0, 5));

    insertProblems(sortedProblems.slice(0, 5).map(entry => entry[0]));
}

async function insertProblems(problemIds) {
    // Get problem data (title, num)
    let problems_data = [];
    problems_data = await Promise.all(problemIds.map(id => getProblemInfo(id)));

    // Get userID from storage
    const userID = await new Promise((resolve) => {
        chrome.storage.local.get("userID", function (data) {
            resolve(data.userID);
        });
    });

    // Check tried and AC statuses
    let tried_statuses = [];
    let ac_statuses = [];

    if (userID === undefined) {
        tried_statuses = new Array(problems_data.length).fill(false);
        ac_statuses = new Array(problems_data.length).fill(false);
    }
    else {
        tried_statuses = await Promise.all(problems_data.map(prob => isTried(prob.num, userID)));
        ac_statuses = await Promise.all(problems_data.map(prob => isAC(prob.num, userID)));
    }

    const recommendationsDiv = document.getElementById("content").children[0].children[0];

    // Create container
    const recommendationsContainer = document.createElement("div");
    recommendationsContainer.id = "recommendationsDiv";
    recommendationsContainer.className = "card-body";
    recommendationsContainer.style = `
        margin-top: 10px;
        margin-bottom: 10px;
        padding: 2px;
        background-color:rgb(163, 163, 163);
        border-radius: 5px;
        `;

    // Accordion + Tags HTML + tooltip
    recommendationsContainer.innerHTML = `
        <div>
            <button id="accordionToggle2" style="
            width: 100%;
            text-align: left;
            padding: 10px;
            font-size: 15px;
            background-color:rgb(0, 97, 136);
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            "
            title="Problemas recomendados basados en las categorías del problema actual.">
            Otros problemas ▼
            </button>
            <div id="accordionContent2" style="
            display: none;
            padding: 10px;
            border: 1px solid #ddd;
            border-top: none;
            background-color: rgb(245, 245, 245);
            border-radius: 0 0 4px 4px;
            margin-top: -4px;
            ">
            ${problems_data.map((prob, i) => `<span
                 style="
                display: inline-block;
                background-color:${ac_statuses[i] ? 'rgba(197, 241, 197, 1)' : tried_statuses[i] ? 'rgba(241, 198, 198, 1)' : 'rgb(198, 233, 240)'};
                color: #333;
                padding: 5px 10px;
                border-radius: 12px;
                font-size: 13px;
                margin: 3px;
            ">
                <a href="https://aceptaelreto.com/problem/statement.php?id=${prob.num}" target="_blank"
                style="color: rgb(0, 0, 0); underline: black;"
                >${prob.num} - ${prob.title}</a>
            </span>`).join('')}
            </div>
        </div>
        `;

    // Insert recommendations container
    recommendationsDiv.insertBefore(recommendationsContainer, recommendationsDiv.children[2]);

    // Toggle logic
    document.getElementById("accordionToggle2").addEventListener("click", () => {
        const content = document.getElementById("accordionContent2");
        content.style.display = content.style.display === "block" ? "none" : "block";
    });
}

async function getProblemId() {
    const urlParams = new URLSearchParams(window.location.search);
    const problem_id = urlParams.get('id');
    return problem_id;
}
