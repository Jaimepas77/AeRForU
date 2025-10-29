let SHOW_LEVEL = null;
let N_RANKINGS_LOADED = 20;

chrome.storage.local.get(['SHOW_LEVEL'], function (data) {
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

(async function () {
    console.log("Stats page");

    //Extract problem id from URL
    const urlParams = new URLSearchParams(window.location.search);
    const problem_id = urlParams.get('id');

    let problem_level = await getProblemLevel(problem_id);

    addRankingBtn();

    showLevel(problem_level);

    //Get user nickname from storage
    let user_nick = await new Promise((resolve) => {
        chrome.storage.local.get("username", function (data) {
            resolve(data.username);
        });
    });

    if (user_nick !== undefined) {
        user_position = await getUserProblemPosition(user_nick, problem_id);
        updatePosition(user_position);
    }
})();

async function addRankingBtn() {
    try {
        const finalTable = document.getElementsByClassName("problemBestSubmissions")[0];
    }
    catch (error) {
        console.log("Table not found yet, waiting...");
        setTimeout(addRankingBtn, 100);
        return;
    }
    const finalTable = document.getElementsByClassName("problemBestSubmissions")[0];
    // console.log(finalTable);

    const btn_html = `
    <tfoot id="seeMoreRankingRow" style="">
        <tr>
            <td class="seeMore" colspan="7">
                <span class="btn btn-primary btn-xs">Ver más</span>
            </td>
        </tr>
    </tfoot>
    `;

    //Insert the button at the end of the table
    finalTable.insertAdjacentHTML('beforeend', btn_html);

    document.getElementById("seeMoreRankingRow").addEventListener("click", function () {
        const urlParams = new URLSearchParams(window.location.search);
        const problem_id = urlParams.get('id');
        const tbody = document.querySelector(".problemBestSubmissions tbody");
        next_url = `https://aceptaelreto.com/ws/problem/${problem_id}/ranking?start=${tbody.children.length + 1}&size=${N_RANKINGS_LOADED}`;

        // Call the function to load more rankings
        loadMoreRankings(next_url);
    });

}

async function loadMoreRankings(url) {
    console.log("Loading more rankings from:", url);

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        const tbody = document.querySelector(".problemBestSubmissions tbody");
        // console.log(data);
        // console.log(tbody);
        // console.log(data.submission);

        if (data.nextLink === undefined) {
            // No more data to load
            const seeMoreRow = document.getElementById("seeMoreRankingRow");
            seeMoreRow.style.display = "none"; // Hide the "See More" button
        }
        
        // Get tbody last ranking number
        const lastRanking = tbody.children.length > 0 ? parseInt(tbody.children[tbody.children.length - 1].children[0].innerText) : 0;

        // Set correct ranking numbers
        data.submission.forEach((entry, index) => {
            entry.ranking = lastRanking + index + 1;
        });

        data.submission.forEach(entry => {
            const row = document.createElement("tr");
            const submissionDate = new Date(entry.submissionDate);
            const formattedDate = submissionDate.getFullYear() + '-' +
                ('0' + (submissionDate.getMonth() + 1)).slice(-2) + '-' +
                ('0' + submissionDate.getDate()).slice(-2) + ' ' +
                ('0' + submissionDate.getHours()).slice(-2) + ':' +
                ('0' + submissionDate.getMinutes()).slice(-2) + ':' +
                ('0' + submissionDate.getSeconds()).slice(-2);

            const language = entry.language === "CPP" ? "C++" : entry.language === "JAVA" ? "Java" : entry.language;

            row.innerHTML = `
                <td class="ranking">${entry.ranking}</td>
                <td class="num">${entry.num}</td>
                <td class="user_nick"><a href="/user/profile.php?id=${entry.user.id}" title="${entry.user.nick}">${entry.user.nick}</a></td>
                <td class="language">${language}</td>
                <td class="executionTime">${entry.executionTime}</td>
                <td class="memoryUsed">${entry.memoryUsed}</td>
                <td class="submissionDate"><time datetime="${entry.submissionDate}">${formattedDate}</time></td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error("Error loading more rankings:", error);
    }
}

async function showLevel(problem_level=null) {
    if (SHOW_LEVEL === null) {
        console.log("SHOW_LEVEL is null, waiting...");
        setTimeout(() => showLevel(problem_level), 100);
    }

    if (!SHOW_LEVEL) return;

    console.log("Showing problem levels...");

    try {
        const finalTable = document.getElementsByClassName("problemGlobalStatistics")[0];
    }
    catch (error) {
        console.log("Table not found yet, waiting...");
        setTimeout(() => showLevel(problem_level), 100);
        return;
    }

    //DOM manipulation
    const finalTable = document.getElementsByClassName("problemGlobalStatistics")[0];

    const header = finalTable.getElementsByTagName("thead")[0];
    header.children[0].appendChild(document.createElement("th"));
    header.children[0].children[3].innerText = "Nivel";

    const body = finalTable.getElementsByTagName("tbody")[0];
    body.children[0].appendChild(document.createElement("td")); // First row

    const colgroups = finalTable.getElementsByTagName("colgroup")[0];
    colgroups.remove();

    // Progress bar display and color coding
    const cell = body.children[0].children[3];
    createProgressBar(cell, problem_level);
}

function createProgressBar(cell, problem_level = null) {
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

async function updatePosition(position) {
    if (position === null) return;

    try {
        const positionTable = document.getElementsByClassName("userProblemBestSubmission")[0];
    }
    catch (error) {
        console.log("Position table not found yet, waiting...");
        setTimeout(() => updatePosition(position), 100);
        return;
    }

    const positionTable = document.getElementsByClassName("userProblemBestSubmission")[0];
    // console.log(positionTable);

    // If the table is hidden, do nothing
    if (positionTable.parentElement.style.display === "none") return;

    const body = positionTable.getElementsByTagName("tbody")[0];
    const elem = body.children[0].children[0];
    elem.innerText = position;
}
