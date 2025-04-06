//First we need to get the username
let username = "";

//Function to get the username
function getUsername() {
    const icon = document.getElementsByClassName("icon icon-user")[0];
    const username = icon.parentNode.textContent.trim();
    if (username === "Login") {
        return false;
    }
    console.log("Username: " + username);
    return username;
}

// Settings
let AcColor = "#f2fff2";//light green
let WaColor = "#ffe6e6";//light red
let BOLD = true;
let HYPERLINK = true; //24en23 hyperlinks
chrome.storage.local.get(["BOLD", "AcColor", "WaColor", "hyperlinks"], function (data) {
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
    if (data.hyperlinks !== undefined) {
        HYPERLINK = data.hyperlinks;
    }
    else {
        chrome.storage.local.set({ hyperlinks: HYPERLINK });
    }
    // console.log("BOLD: " + BOLD);
    // console.log("AcColor: " + AcColor);
    // console.log("WaColor: " + WaColor);
    // console.log("HYPERLINK: " + HYPERLINK);
});

chrome.storage.onChanged.addListener(function (changes, namespace) {
    if (namespace === 'local') {
        for (key in changes) {
            if (key === 'BOLD') {
                BOLD = changes[key].newValue;
            }
            else if (key === 'AcColor') {
                AcColor = changes[key].newValue;
            }
            else if (key === 'WaColor') {
                WaColor = changes[key].newValue;
            }
            else if (key === 'hyperlinks') {
                HYPERLINK = changes[key].newValue;
            }
        }
    }
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
window.onload = async function () {
    if (window.location.href.includes("aceptaelreto.com/problems/")) { //Problems page
        console.log("Problems page");
        username = getUsername();
        highlightTitles();
    }
    else if (window.location.href.includes("aceptaelreto.com/24en23")
                && window.location.href.includes("/clasificacion.php")
                && HYPERLINK) { //24en23 page
        console.log("24en23 page");
        // addHyperlinks();
        initHyperlinks();
    }
};

async function highlightTitles() {
    console.log("Ini of AeRForU: highlighting problems")
    if (username !== false) {
        try {
            let finalTable = document.getElementById("problemsInfo").children[1].children[3];
            finalTable.children[0].children[1].innerText.trim(); // Intentar acceder a un elemento para verificar si la tabla está cargada
        }
        catch (error) {
            console.log("Table not found yet, waiting...");
            setTimeout(highlightTitles, 100);
            return;
        }

        const problemsInfo = document.getElementById("problemsInfo");

        if (problemsInfo === null) return;

        // Get the list of words to highlight
        //const words = await getInfo();
        //const wordsToAc = words.wordsAc.map(word => word.trim());
        //const wordsToWa = words.wordsWa.map(word => word.trim());
        //const userID = words.userID;
        const userID = await getUserID();

        //Get all the text nodes in the table
        const table = problemsInfo.children[1];
        // console.log(table);

        const problemNodes = table.children[3];
        // console.log(problemNodes.children);

        for (const problem of problemNodes.children) {
            // Llamada asíncrona (se ejecutan en paralelo)
            highlightProblemTitle(problem, userID);
        }
    }
    console.log("End of AeRForU");
}

async function highlightProblemTitle(problem, userID) {
    const title = problem.children[1].innerText.trim();
    // console.log("Title: " + title);
    //if (wordsToAc.length > 0 && wordsToAc.includes(title)) {
    if (await isAC(problem, userID)) {
        problem.style.backgroundColor = AcColor;
    }
    //else if (wordsToWa.length > 0 && wordsToWa.includes(title)) {
    else if (await isTried(problem, userID)) {
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

    // Get the last submission
    let problem_submissions_url = "https://aceptaelreto.com/ws/user/${userID}/submissions/problem/${problemId}";
    problem_submissions_url = problem_submissions_url.replace("${userID}", userID);
    problem_submissions_url = problem_submissions_url.replace("${problemId}", problemId);

    const request = await fetch(problem_submissions_url);
    const submissions = await request.json();
    // console.log(submissions.submission[0].result);
    let result = submissions.submission[0].result;
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

async function getUserID() {
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
    else if (prevUsername !== undefined) {
        console.log("New username: " + username);
        const baseSearchUrl = "https://aceptaelreto.com/bin/search.php?search_query=${username}&commit=searchUser&search_currentPage=%2Fuser%2Fprofile.php";
        url = baseSearchUrl.replace("${username}", username);
        
        //We need to make a request to the url
        const request = await fetch(url, {
            method: 'HEAD',
            redirect: 'follow'
        });

        //Get the user ID
        const finalUrl = request.url;
        // console.log("Final URL: " + finalUrl);
        userID = finalUrl.split("id=")[1];

        // Strore new username and userID in the storage
        chrome.storage.local.set({ username: username });
        chrome.storage.local.set({ userID: userID });
    }
    else {
        console.log("No username found");
        userID = false;
    }

    console.log("User ID: " + userID);
    return userID;
}

async function isAC(problem, userID) {
    // Get the problem ID
    const problemId = problem.children[0].innerText.trim();
    // console.log("Problem ID: " + problemId);

    // Search for an AC submission
    let problem_submissions_url = "https://aceptaelreto.com/ws/user/${userID}/submissions/problem/${problemId}";
    problem_submissions_url = problem_submissions_url.replace("${userID}", userID);
    problem_submissions_url = problem_submissions_url.replace("${problemId}", problemId);
    
    let request = await fetch(problem_submissions_url);
    let submissions = await request.json();

    do {
        // Loop through the submissions and check for an AC submission
        for (const submission of submissions.submission) {
            if (submission.result === "AC") {
                return true;
            }
        }

        // If there are no next link (undefined), break the loop
        if (submissions.nextLink === undefined) {
            break;
        }
        console.log("Next link: " + submissions.nextLink);
        // Get the next page of submissions
        request = await fetch(submissions.nextLink);
        submissions = await request.json();
    } while (submissions.submission.length > 0); //If there are no submissions, break the loop
    return false;
}

async function isTried(problem, userID) {
    // Get the problem ID
    const problemId = problem.children[0].innerText.trim();
    // console.log("Problem ID: " + problemId);

    // Search for an AC submission
    let problem_submissions_url = "https://aceptaelreto.com/ws/user/${userID}/submissions/problem/${problemId}";
    problem_submissions_url = problem_submissions_url.replace("${userID}", userID);
    problem_submissions_url = problem_submissions_url.replace("${problemId}", problemId);
    
    const request = await fetch(problem_submissions_url);
    const submissions = await request.json();

    return submissions.submission.length !== 0;
}

async function getUserID() {
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
    else if (prevUsername !== undefined) {
        console.log("New username: " + username);
        const baseSearchUrl = "https://aceptaelreto.com/bin/search.php?search_query=${username}&commit=searchUser&search_currentPage=%2Fuser%2Fprofile.php";
        url = baseSearchUrl.replace("${username}", username);
        
        //We need to make a request to the url
        const request = await fetch(url, {
            method: 'HEAD',
            redirect: 'follow'
        });

        //Get the user ID
        const finalUrl = request.url;
        // console.log("Final URL: " + finalUrl);
        userID = finalUrl.split("id=")[1];

        // Strore new username and userID in the storage
        chrome.storage.local.set({ username: username });
        chrome.storage.local.set({ userID: userID });
    }
    else {
        console.log("No username found");
        userID = false;
    }

    // console.log("User ID: " + userID);
    return userID;
}
