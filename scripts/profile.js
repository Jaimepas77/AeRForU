let SHOW_LEVEL = null;
let SHOW_LEVEL_TEXT = 1; // 0: emojis, 1: texto en español, 2: estrellas
let BOLD = null;

(async function() {
    chrome.storage.local.get(['SHOW_LEVEL', 'BOLD'], function(data) {
        console.log("Data from storage:", data);
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

    showLevel();
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
    console.log("SHOW_LEVEL:", SHOW_LEVEL);
    if (SHOW_LEVEL === null) {
        setTimeout(showLevel, 100);
        return;
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

    // Add level column to the table
    const header = table.children[1].children[0];
    header.appendChild(document.createElement("th"));
    // Define width
    header.children[1].style.width = "100px";
    header.children[1].title = "Nivel de dificultad";
    header.children[1].innerText = "Nivel ⇅"; // ⇅ or ⇕ or ▲▼ or ±
    header.children[1].style.textAlign = "center";

    // Set level for each problem
    const problemNodes = table.children[2];
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
}

async function setLevel(problem) {
    const problemId = problem.children[0].innerText.split("-")[0].trim();
    const problem_level = await getProblemLevel(problemId);
    // console.log(`Problem ${problemId} level: ${problem_level}`);

    console.log("BOLD:", BOLD);
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
