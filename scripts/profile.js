let SHOW_LEVEL = null;
let SHOW_LEVEL_TEXT = 1; // 0: emojis, 1: texto en español, 2: estrellas
let BOLD = null;

(async function() {
    chrome.storage.local.get(['SHOW_LEVEL', 'BOLD'], function(data) {
        // console.log("Data from storage:", data);
        if (data.SHOW_LEVEL !== undefined) {
            SHOW_LEVEL = data.SHOW_LEVEL;
        }
        else {
            chrome.storage.local.set({ SHOW_LEVEL: true });
            SHOW_LEVEL = true;
        }
        if (data.BOLD !== undefined) {
            BOLD = data.BOLD;
        }
        else {
            chrome.storage.local.set({ BOLD: true });
            BOLD = true;
        }
    });

    insertAeRStatsURL();

    showLevel(); // Includes showing stats and showing time
})();

async function insertAeRStatsURL() {
    // Find the nickname element
    let p_elem = null;
    const divs = document.getElementsByClassName('form-group');
    for (let div of divs) {
        const label = div.querySelector('label');
        if (label && label.innerText.trim() === 'Nick') {
            p_elem = div.querySelector('p');
            break;
        }
    }
    if (!p_elem) return;
    const user_nickname = p_elem.innerText.trim();
    
    // Insert the AeR stats URL next to the profile header
    const profileHeader = document.querySelector('h1');
    const statsURL = `https://aer.lluiscab.net/user/${user_nickname}`;
        const iconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-box-arrow-up-right" viewBox="0 0 16 16" style="vertical-align: middle;">
            <path fill-rule="evenodd" d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5z"/>
            <path fill-rule="evenodd" d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0v-5z"/>
        </svg>`;
        profileHeader.innerHTML += ` <a href="${statsURL}" target="_blank" title="AER Stats">${iconSVG}</a>`;
}

async function showLevel() {
    // console.log("SHOW_LEVEL:", SHOW_LEVEL);
    if (SHOW_LEVEL === null) {
        return setTimeout(showLevel, 100);
    }
    else if (!SHOW_LEVEL) return;

    console.log("Showing problem levels...");

    try {
        let finalTable = document.getElementsByClassName("userProblems")[0].children[2];
        finalTable.children[0].children[0].innerText.trim(); // Intentar acceder a un elemento para verificar si la tabla está cargada
    }
    catch (error) {
        console.log("Table not found yet, waiting...");
        setTimeout(showLevel, 100);
        return;
    }

    const table = document.getElementsByClassName("userProblems")[0];
    if (table.length === 0) return;

    const column_groups = table.children[0];
    const header = table.children[1].children[0];
    const problemNodes = table.children[2];

    // Add level column to the table
    header.appendChild(document.createElement("th"));
    column_groups.appendChild(document.createElement("th"));
    // Define width
    header.children[1].style.width = "100px";
    header.children[1].title = "Nivel de dificultad";
    header.children[1].innerText = "Nivel ⇅"; // ⇅ or ⇕ or ▲▼ or ±
    header.children[1].style.textAlign = "center";
    column_groups.children[1].className = "levelColumn";

    // Set level for each problem
    await Promise.all(Array.from(problemNodes.children).map(async (problem) => {
        const problem_level = await setLevel(problem);

        const hiddenLevel = document.createElement('span');
        hiddenLevel.style.display = 'none';
        hiddenLevel.innerText = problem_level;
        problem.children[1].appendChild(hiddenLevel);
    }));

    // Add sorting functionality to the level column
    header.children[1].style.cursor = "pointer";
    header.children[1].addEventListener("click", () => {
        const rows = Array.from(problemNodes.children);
        const isDescending = header.children[1].classList.contains("desc");
        rows.sort((a, b) => {
            const levelA = a.children[1].children[0].innerText;
            const levelB = b.children[1].children[0].innerText;
            return isDescending ? levelB - levelA : levelA - levelB;
        });
        // Remove existing rows
        while (problemNodes.firstChild) {
            problemNodes.removeChild(problemNodes.firstChild);
        }
        // Append sorted rows
        rows.forEach(row => problemNodes.appendChild(row));
        // Toggle sort direction
        header.children[1].classList.toggle("asc", isDescending);
        header.children[1].classList.toggle("desc", !isDescending);
        // Set arrow indicator
        header.children[1].innerText = isDescending ? "Nivel ▲" : "Nivel ▼";
    });

    showTime(); // Show solved times AFTER levels are shown

    showStats(); // Show AeR stats AFTER levels are shown
}

async function setLevel(problem) {
    const problemId = problem.children[0].innerText.split("-")[0].trim();
    const problem_level = await getProblemLevel(problemId);
    // console.log(`Problem ${problemId} level: ${problem_level}`);

    // console.log("BOLD:", BOLD);
    if (BOLD) {
        problem.children[0].style.fontWeight = "bold";
    }

    problem.appendChild(document.createElement("td"));
    problem.children[1].style.fontWeight = "bold";
    problem.children[1].title = problem_level;
    let level_texts = await getLevelsText(SHOW_LEVEL_TEXT);

    if (problem_level == null) {
        problem.children[1].innerText = level_texts.unknown;
        problem.children[1].style.textAlign = "center";
        problem.children[1].style.color = "gray";
    }
    else if (problem_level <= LEVEL_EASY) {
        problem.children[1].innerText = level_texts.easy;
        problem.children[1].style.textAlign = "center";
        problem.children[1].style.color = "green";
    }
    else if (problem_level <= LEVEL_MEDIUM) {
        problem.children[1].innerText = level_texts.medium;
        problem.children[1].style.textAlign = "center";
        problem.children[1].style.color = "orange";
    }
    else if (problem_level < LEVEL_HARD) {
        problem.children[1].innerText = level_texts.hard;
        problem.children[1].style.textAlign = "center";
        problem.children[1].style.color = "red";
    }
    else { // problem_level >= 95
        problem.children[1].innerText = level_texts.very_hard;
        problem.children[1].style.textAlign = "center";
        problem.children[1].style.color = "purple";
    }

    return problem_level;
}

async function showTime() {
    console.log("Showing problem solved times...");

    try {
        let finalTable = document.getElementsByClassName("userProblems")[0].children[2];
        finalTable.children[0].children[0].innerText.trim(); // Intentar acceder a un elemento para verificar si la tabla está cargada
    }
    catch (error) {
        console.log("Table not found yet, waiting...");
        setTimeout(showTime, 100);
        return;
    }

    const table = document.getElementsByClassName("userProblems")[0];
    if (table.length === 0) return;

    const column_groups = table.children[0];
    const header = table.children[1].children[0];
    const problemNodes = table.children[2];

    // Set solved time for each problem
    header.appendChild(document.createElement("th"));
    column_groups.appendChild(document.createElement("th"));
    header.children[2].style.width = "130px";
    header.children[2].title = "Fecha de resolución";
    header.children[2].innerText = "Fecha ⇅";
    header.children[2].style.textAlign = "center";
    column_groups.children[2].className = "dateColumn";

    await Promise.all(Array.from(problemNodes.children).map(async (problem) => {
        const urlParams = new URLSearchParams(window.location.search);
        const userID = urlParams.get('id');

        const problemId = problem.children[0].innerText.split("-")[0].trim();
        const solvedTime = await getLastSubmissionTime(problemId, userID);
        problem.appendChild(document.createElement("td"));
        problem.children[2].innerText = dateToString(solvedTime, false);
        problem.children[2].title = solvedTime;
    }));

    // Add sorting functionality to the solved date column
    header.children[2].style.cursor = "pointer";
    header.children[2].classList.add("desc"); // Start with descending order
    header.children[2].addEventListener("click", () => {
        const rows = Array.from(problemNodes.children);
        const isDescending = header.children[2].classList.contains("desc");
        rows.sort((a, b) => {
            const dateA = new Date(a.children[2].title);
            const dateB = new Date(b.children[2].title);
            return isDescending ? dateB - dateA : dateA - dateB;
        });
        // Remove existing rows
        while (problemNodes.firstChild) {
            problemNodes.removeChild(problemNodes.firstChild);
        }
        // Append sorted rows
        rows.forEach(row => problemNodes.appendChild(row));
        // Toggle sort direction
        header.children[2].classList.toggle("asc", isDescending);
        header.children[2].classList.toggle("desc", !isDescending);
        // Set arrow indicator
        header.children[2].innerText = isDescending ? "Fecha ▲" : "Fecha ▼";
    });
}

async function showStats() {
    console.log("Showing AeR stats...");

    // Get problem levels
    const problemLevels = await Promise.all(
        Array.from(
            document.getElementsByClassName("userProblems")[0].children[2].children
        )
        .filter(problem => problem.className != "danger") //Only solved problems count
        .map(
            problem => getProblemLevel(problem.children[0].innerText.split("-")[0].trim())
        )
    );
    // console.log("Problem levels:", problemLevels);

    // Get dashboard element
    const dashboard = document.getElementsByClassName("dashboard")[1];

    // Show average level
    await displayAverageLevel(problemLevels, dashboard);

    // Show total problems solved by level
    await displayProblemsSolvedByLevel(problemLevels, dashboard);
}

async function displayAverageLevel(problemLevels, dashboard) {
    const validLevels = problemLevels.filter(level => level !== null);
    const averageLevel = validLevels.reduce((sum, level) => sum + level, 0) / validLevels.length;
    console.log("Average level:", averageLevel.toFixed(2));
    
    // Insert into profile page
    const colDiv = document.createElement("div");
    colDiv.className = "col-md-12";
    colDiv.innerHTML = `
        <div class="panel panel-info">
            <div class="panel-heading">
                <h3 class="panel-title text-center">Nivel medio</h3>
            </div>
            <div class="panel-body text-box text-center">
                ${averageLevel.toFixed(2)}
            </div>
        </div>
    `;

    // Substitute the number with a progress bar
    const panelBody = colDiv.getElementsByClassName("panel-body")[0];
    panelBody.innerHTML = ''; // Clear the cell

    createProgressBar(panelBody, averageLevel.toFixed(2));

    dashboard.appendChild(colDiv);
}

async function displayProblemsSolvedByLevel(problemLevels, dashboard=null) {
    const levelCounts = {
        unknown: 0,
        easy: 0,
        medium: 0,
        hard: 0,
        very_hard: 0
    };

    problemLevels.forEach(level => {
        if (level === null) {
            levelCounts.unknown += 1;
        }
        else if (level <= LEVEL_EASY) {
            levelCounts.easy += 1;
        }
        else if (level <= LEVEL_MEDIUM) {
            levelCounts.medium += 1;
        }
        else if (level < LEVEL_HARD) {
            levelCounts.hard += 1;
        }
        else {
            levelCounts.very_hard += 1;
        }
    });
    
    let level_texts = await getLevelsText(SHOW_LEVEL_TEXT);
    const levels = [
        { name: level_texts.easy, count: levelCounts.easy, color: 'green' },
        { name: level_texts.medium, count: levelCounts.medium, color: 'orange' },
        { name: level_texts.hard, count: levelCounts.hard, color: 'red' },
        { name: level_texts.very_hard, count: levelCounts.very_hard, color: 'purple' }
    ];
    if (levelCounts.unknown > 0) {
        levels.push({ name: level_texts.unknown, count: levelCounts.unknown, color: 'gray' });
    }
    
    // Insert into profile page
    levels.forEach(level => {
        const colDiv = document.createElement("div");
        colDiv.className = "col-md-3";
        colDiv.innerHTML = `
            <div class="panel panel-info">
                <div class="panel-heading">
                    <h3 class="panel-title text-center" style="color: ${level.color}; font-weight: bold;">${level.name}</h3>
                </div>
                <div class="panel-body text-box text-center">
                    ${level.count}
                </div>
            </div>
        `;
        dashboard.appendChild(colDiv);
    });
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
