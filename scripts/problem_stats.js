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

chrome.storage.onChanged.addListener(function (changes, namespace) {
    if (namespace === 'local') {
        for (key in changes) {
            if (key === 'SHOW_LEVEL') {
                SHOW_LEVEL = changes[key].newValue;
            }
        }
    }
});

(async function() {
    console.log("Stats page");

    showLevel();
})();

async function showLevel() {
    if (SHOW_LEVEL === null) setTimeout(showLevel, 100);

    if (!SHOW_LEVEL) return;

    console.log("Showing problem levels...");

    try {
        const finalTable = document.getElementsByClassName("problemGlobalStatistics")[0];
    }
    catch (error) {
        console.log("Table not found yet, waiting...");
        setTimeout(showLevel, 100);
        return;
    }

    //Extract problem id from URL
    const urlParams = new URLSearchParams(window.location.search);
    const problem_id = urlParams.get('id');

    let problem_level = await getProblemLevel(problem_id);

    //DOM manipulation
    const finalTable = document.getElementsByClassName("problemGlobalStatistics")[0];

    const header = finalTable.getElementsByTagName("thead")[0];
    header.children[0].appendChild(document.createElement("th"));
    header.children[0].children[3].innerText = "Nivel";

    const body = finalTable.getElementsByTagName("tbody")[0];
    body.children[0].appendChild(document.createElement("td")); // First row

    const colgroups = finalTable.getElementsByTagName("colgroup")[0];
    colgroups.remove();

    body.children[0].children[3].innerText = problem_level;
    body.children[0].children[3].style.fontWeight = "bold";

    // Progress bar display and color coding
    const cell = body.children[0].children[3];
    createProgressBar(cell, problem_level);
}

function createProgressBar(cell, problem_level=null) {
    cell.innerHTML = ''; // Clear the cell

    const progressContainer = document.createElement("div");
    progressContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 4px;
    `;

    // Create level number display
    const levelNumber = document.createElement("div");
    levelNumber.innerText = problem_level !== null ? problem_level : "?";
    levelNumber.style.cssText = `
        font-weight: bold;
        text-align: center;
        font-size: 14px;
    `;

    // Create progress bar
    const progressBar = document.createElement("div");
    progressBar.style.cssText = `
        width: 100%;
        height: 6px;
        background-color: #e0e0e0;
        border-radius: 3px;
        overflow: hidden;
        box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);
    `;

    // Create progress fill
    const progressFill = document.createElement("div");
    progressFill.style.cssText = `
        height: 100%;
        border-radius: 3px;
        transition: width 0.3s ease;
    `;

    // Determine color and width based on level
    if (problem_level == null) {
        progressFill.style.width = "0%";
        progressFill.style.backgroundColor = "#999999";
        levelNumber.style.color = "gray";
    }
    else if (problem_level <= LEVEL_EASY) {
        progressFill.style.width = `${problem_level}%`;
        progressFill.style.backgroundColor = "#4caf50";
        levelNumber.style.color = "#4caf50";
    }
    else if (problem_level <= LEVEL_MEDIUM) {
        progressFill.style.width = `${problem_level}%`;
        progressFill.style.backgroundColor = "#ff9800";
        levelNumber.style.color = "#ff9800";
    }
    else if (problem_level < LEVEL_HARD) {
        progressFill.style.width = `${problem_level}%`;
        progressFill.style.backgroundColor = "#f44336";
        levelNumber.style.color = "#f44336";
    }
    else { // problem_level >= LEVEL_HARD
        progressFill.style.width = `${problem_level}%`;
        progressFill.style.backgroundColor = "#9c27b0";
        levelNumber.style.color = "#9c27b0";
    }

    progressBar.appendChild(progressFill);
    progressContainer.appendChild(levelNumber);
    progressContainer.appendChild(progressBar);
    cell.appendChild(progressContainer);
}

