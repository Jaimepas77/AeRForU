// Settings
let AcColor = "#f2fff2";//light green
let WaColor = "#ffe6e6";//light red
let BOLD = true;
let SHOW_LEVEL = true;
let SHOW_LEVEL_TEXT = 1; // 0: emojis, 1: texto en español, 2: estrellas
chrome.storage.local.get(["BOLD", "AcColor", "WaColor", "SHOW_LEVEL"], function (data) {
    if (data.BOLD !== undefined) {
        BOLD = data.BOLD;
    }
    else {
        chrome.storage.local.set({ BOLD: BOLD });
    }
    if (data.AcColor !== undefined) {
        AcColor = data.AcColor;
    }
    else {
        chrome.storage.local.set({ AcColor: AcColor });
    }
    if (data.WaColor !== undefined) {
        WaColor = data.WaColor;
    }
    else {
        chrome.storage.local.set({ WaColor: WaColor });
    }
    if (data.SHOW_LEVEL !== undefined) {
        SHOW_LEVEL = data.SHOW_LEVEL;
    }
    else {
        chrome.storage.local.set({ SHOW_LEVEL: SHOW_LEVEL });
    }
    // console.log("BOLD: " + BOLD);
    // console.log("AcColor: " + AcColor);
    // console.log("WaColor: " + WaColor);
    // console.log("SHOW_LEVEL: " + SHOW_LEVEL);
});

// Debugging the storage
// chrome.storage.onChanged.addListener((changes, namespace) => {
//     for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
//         console.log(
//             `Storage key "${key}" in namespace "${namespace}" changed.`,
//             `Old value was "${oldValue}", new value is "${newValue}".`
//         );
//     }
// });

// Highlight the titles of the problems when the page is loaded
(async function() {
    console.log("Problems page");

    isProblemsPage = await checkIfProblemsPage();

    if (isProblemsPage) {
        showLevel();
    }

    let username = getUsername();
    const userID = await updateUserID(username);

    // Retrieve the userID from the remember me cookie if possible
    const cookieName = "ACR_RememberMe";
    const pageUrl = window.location.href;

    console.log("User ID before checking cookies: " + userID);

    if(userID === false) {
        // Get cookies acrsession and ACR_SessionCookie and try to get the nick, get the userID from the nick and highlight the titles
        chrome.runtime.sendMessage(
            { type: "GET_COOKIES", url: pageUrl, names: [ "acrsession", "ACR_SessionCookie", "ACR_RememberMe" ] },
            async (response) => {
                // If response is undefined and chrome.runtime.lastError exists,
                // the extension or background might not be reachable.
                if (chrome.runtime.lastError) {
                    console.log("Error getting cookies: " + chrome.runtime.lastError.message);
                    return;
                }
                if (response && response.success) {
                    let newUserID;
                    let nick;
                    if (response.values.ACR_RememberMe === null) {
                        nick = await getNick(response.values.acrsession, response.values.ACR_SessionCookie);
                        console.log("Nick from session cookies: " + nick);
                    }
                    else {
                        nick = response.values.ACR_RememberMe;
                        console.log("Nick from remember me cookie: " + nick);
                    }

                    newUserID = await updateUserID(nick);
                    if (isProblemsPage) {
                        highlightTitles(newUserID);
                    }
                    else {
                        console.log("Not a problems page");
                        highlightCategories(newUserID, await checkIfCategoriesPage());
                    }
                }
                else {
                    console.log("Error getting cookies: " + (response ? response.error : "No response"));
                }
            }
        );
        return;
    }

    if (isProblemsPage) {
        highlightTitles(userID);
    }
    else {
        console.log("Not a problems page");
        highlightCategories(userID, await checkIfCategoriesPage());
    }
})();

async function checkIfProblemsPage() {
    // Check if url contains cat=n or vol=n
    const urlParams = new URLSearchParams(window.location.search);
    const catParam = urlParams.get('cat');
    const volParam = urlParams.get('vol');
    console.log("catParam: " + catParam);
    console.log("volParam: " + volParam);
    if ((catParam !== null && await isProblemsCategory(catParam)) || volParam !== null) {
        return true;
    }
    return false;
}

async function checkIfCategoriesPage() {
    // Check if url contains categories.php
    if (window.location.pathname.includes('categories.php')) {
        return true;
    }
    return false;
}

//Function to get the username
function getUsername() {
    const icon = document.getElementsByClassName("icon icon-user")[0];
    const username = icon.parentNode.textContent.trim();
    // const username = "apereza"; //Testing
    if (username === "Login") {
        return false;
    }
    console.log("Username: " + username);
    return username;
}

async function showLevel() {
    if (!SHOW_LEVEL) return;

    console.log("Showing problem levels...");

    try {
        let finalTable = document.getElementById("problemsInfo").children[1].children[3];
        finalTable.children[0].children[1].innerText.trim(); // Intentar acceder a un elemento para verificar si la tabla está cargada
    }
    catch (error) {
        console.log("Table not found yet, waiting...");
        setTimeout(showLevel, 100);
        return;
    }

    const problemsInfo = document.getElementById("problemsInfo");
    if (problemsInfo === null) return;

    // Add level column to the table
    const table = problemsInfo.children[1];
    const header = table.children[1].children[0];
    header.children[2].title = "Nivel de dificultad";
    header.children[2].innerText = "Nivel ⇅"; // ⇅ or ⇕ or ▲▼ or ±
    header.children[2].style.textAlign = "center";

    // Set level for each problem
    const problemNodes = table.children[3];
    await Promise.all(Array.from(problemNodes.children).map(async (problem) => {
        const problem_level = await setLevel(problem);

        const hiddenLevel = document.createElement('span');
        hiddenLevel.style.display = 'none';
        hiddenLevel.innerText = problem_level;
        problem.children[2].appendChild(hiddenLevel);
    }));

    // Add sorting functionality to the level column
    header.children[2].style.cursor = "pointer";
    header.children[2].addEventListener("click", () => {
        const rows = Array.from(problemNodes.children);
        const isDescending = header.children[2].classList.contains("desc");
        rows.sort((a, b) => {
            const levelA = a.children[2].children[0].innerText;
            const levelB = b.children[2].children[0].innerText;
            return isDescending ? levelB - levelA : levelA - levelB;
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
        header.children[2].innerText = isDescending ? "Nivel ▲" : "Nivel ▼";
    });
}

async function setLevel(problem) {
    const problemId = problem.children[0].innerText.trim();
    const problem_level = await getProblemLevel(problemId);

    problem.children[2].style.fontWeight = "bold";
    problem.children[2].title = problem_level;
    let level_texts = await getLevelsText(SHOW_LEVEL_TEXT);

    if (problem_level == null) {
        problem.children[2].innerText = level_texts.unknown;
        problem.children[2].style.textAlign = "center";
        problem.children[2].style.color = "gray";
    }
    else if (problem_level <= LEVEL_EASY) {
        problem.children[2].innerText = level_texts.easy;
        problem.children[2].style.textAlign = "center";
        problem.children[2].style.color = "green";
    }
    else if (problem_level <= LEVEL_MEDIUM) {
        problem.children[2].innerText = level_texts.medium;
        problem.children[2].style.textAlign = "center";
        problem.children[2].style.color = "orange";
    }
    else if (problem_level < LEVEL_HARD) {
        problem.children[2].innerText = level_texts.hard;
        problem.children[2].style.textAlign = "center";
        problem.children[2].style.color = "red";
    }
    else { // problem_level >= 95
        problem.children[2].innerText = level_texts.very_hard;
        problem.children[2].style.textAlign = "center";
        problem.children[2].style.color = "purple";
    }

    return problem_level;
}

async function highlightTitles(userID) {
    console.log("Ini of AeRForU: highlighting problems")
    if (userID !== false) {
        try {
            let finalTable = document.getElementById("problemsInfo").children[1].children[3];
            finalTable.children[0].children[1].innerText.trim(); // Intentar acceder a un elemento para verificar si la tabla está cargada
        }
        catch (error) {
            console.log("Table not found yet, waiting...");
            setTimeout(highlightTitles, 100, userID);
            return;
        }

        const problemsInfo = document.getElementById("problemsInfo");

        if (problemsInfo === null) return;

        // Get the list of words to highlight
        //const words = await getInfo();
        //const wordsToAc = words.wordsAc.map(word => word.trim());
        //const wordsToWa = words.wordsWa.map(word => word.trim());
        //const userID = words.userID;

        //Get all the text nodes in the table
        const table = problemsInfo.children[1];
        // console.log(table);

        const problemNodes = table.children[3];
        // console.log(problemNodes.children);

        for (const problem of problemNodes.children) {
            // Llamada asíncrona (se ejecutan en paralelo)
            highlightProblemNode(problem, userID);
        }
    }
    console.log("End of AeRForU");
}

async function highlightProblemNode(problem, userID) {
    const title = problem.children[1].innerText.trim();
    const problemId = problem.children[0].innerText.trim();
    // console.log("Title: " + title);
    //if (wordsToAc.length > 0 && wordsToAc.includes(title)) {
    if (await isAC(problemId, userID)) {
        problem.style.backgroundColor = AcColor;
    }
    //else if (wordsToWa.length > 0 && wordsToWa.includes(title)) {
    else if (await isTried(problemId, userID)) {
        problem.style.backgroundColor = WaColor;
        addError(problem, userID);
    }

    if (BOLD) {
        problem.children[0].style.fontWeight = "bold";
        problem.children[1].style.fontWeight = "bold";
    }
}

async function addError(problem, userID) {
    // Get the problem ID
    const problemId = problem.children[0].innerText.trim();
    // console.log("Problem ID: " + problemId);

    let result = await getLastError(problemId, userID);
    let link = "https://aceptaelreto.com/doc/verdicts.php";

    // Add the error message
    const label = document.createElement('label');
    label.className = 'error-label';
    if (result === "PE") {
        label.setAttribute('data-tooltip', 'Presentation Error');
    }
    else if (result === "WA") {
        label.setAttribute('data-tooltip', 'Wrong Answer');
    }
    else if (result === "CE") {
        label.setAttribute('data-tooltip', 'Compilation Error');
    }
    else if (result === "RTE") {
        label.setAttribute('data-tooltip', 'Runtime Error');
    }
    else if (result === "TL") {
        result = "TLE";
        label.setAttribute('data-tooltip', 'Time Limit Exceeded');
    }
    else if (result === "ML") {
        result = "MLE";
        label.setAttribute('data-tooltip', 'Memory Limit Exceeded');
    }
    else if (result === "OLE") {
        label.setAttribute('data-tooltip', 'Output Limit Exceeded');
    }
    else if (result === "RF") {
        label.setAttribute('data-tooltip', 'Restricted Function');
    }
    else if (result === "IR") {
        result = "IE";
        label.setAttribute('data-tooltip', 'Internal Error');
    }
    link += "#" + result;
    label.innerText = result;
    
    linkNode = document.createElement('a')
    linkNode.setAttribute('href', link)
    problem.children[1].appendChild(linkNode);
    problem.children[1].children[1].appendChild(label);

    const style = document.createElement('style');
    style.innerHTML = `
        .error-label {
            background-color: red;
            color: white;
            padding: 5px 7px;
            border-radius: 5px;
            cursor: help;
            position: relative;
            margin-left: 8px;
            margin-bottom: 0px;
            font-size: 0.9em;
        }

        .error-label::after {
            content: attr(data-tooltip);
            position: absolute;
            background-color: black;
            color: white;
            padding: 5px;
            border-radius: 5px;
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            white-space: nowrap;
            display: none;
            z-index: 1;
        }

        .error-label:hover::after {
            display: block;
        }`;
    document.head.appendChild(style);
}

async function highlightCategories(userID, isCategory=false) {
    if (userID !== false) {
        try {
            let finalTable = document.getElementById("subcatsInfo").children[1].children[3];
            finalTable.children[0].children[1].innerText.trim(); // Intentar acceder a un elemento para verificar si la tabla está cargada
        }
        catch (error) {
            console.log("Table not found yet, waiting...");
            setTimeout(highlightCategories, 100, userID);
            return;
        }

        const subcatsInfo = document.getElementById("subcatsInfo");

        if (subcatsInfo === null) return;

        const table = subcatsInfo.children[1];
        const categoryNodes = table.children[3];

        for (const category of categoryNodes.children) {
            highlightCategoryNode(category, userID, isCategory);
        }
    }
}

async function highlightCategoryNode(category, userID, isCategory=false) {
    const categoryId = category.children[0].children[0].href.split('=')[1];
    if (isCategory) {
        if (await isCategoryCompleted(categoryId, userID)) {
            category.style.backgroundColor = AcColor;
        }
    }
    else {
        if (await isVolumeCompleted(categoryId, userID)) {
            category.style.backgroundColor = AcColor;
        }
    }
}

async function updateUserID(username) {
    let prevUsername = await new Promise((resolve) => {
        chrome.storage.local.get("username", function (data) {
            resolve(data.username);
        });
    });

    let userID;
    if (prevUsername === username) {
        userID = await new Promise((resolve) => {
            chrome.storage.local.get("userID", function (data) {
                resolve(data.userID);
            });
        });
    }
    else if (username !== undefined) {
        userID = await getUserID(username);

        if (userID === undefined || userID === null) {
            userID = false; // Hardcode your user ID
        }
        else {
            // Store new username and userID in the storage
            chrome.storage.local.set({ username: username });
            chrome.storage.local.set({ userID: userID });
        }
    }
    else {
        console.log("No username found");
        userID = false;
    }

    console.log("User ID: " + userID);
    return userID;
}
