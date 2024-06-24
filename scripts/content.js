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
        const problemsInfo = document.getElementById("problemsInfo");

        if (problemsInfo === null) return;

        // Get the list of words to highlight
        const words = await getInfo();
        const wordsToAc = words.wordsAc.map(word => word.trim());
        const wordsToWa = words.wordsWa.map(word => word.trim());
        const userID = words.userID;

        //Get all the text nodes in the table
        const table = problemsInfo.children[1];
        // console.log(table);

        const problemNodes = table.children[3]
        // console.log(problemNodes.children);

        for (const problem of problemNodes.children) {
            const title = problem.children[1].innerText.trim();
            console.log("Title: " + title);
            if (wordsToAc.length > 0 && wordsToAc.includes(title)) {
                problem.style.backgroundColor = AcColor;
            }
            else if (wordsToWa.length > 0 && wordsToWa.includes(title)) {
                problem.style.backgroundColor = WaColor;
                addError(problem, userID);
            }

            if (BOLD) {
                problem.children[0].style.fontWeight = "bold";
                problem.children[1].style.fontWeight = "bold";
            }
        }
    }
    console.log("End of AeRForU");
}

async function addError(problem, userID) {
    // Get the problem ID
    const problemId = problem.children[0].innerText.trim();
    console.log("Problem ID: " + problemId);

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

//Function to get the words to highlight
async function getInfo() {
    const wordsAc = [];
    const wordsWa = [];

    //We need to webscrap the words to highlight
    const baseSearchUrl = "https://aceptaelreto.com/bin/search.php?search_query=${username}&commit=searchUser&search_currentPage=%2Fuser%2Fprofile.php";
    url = baseSearchUrl.replace("${username}", username);
    //console.log("URL: " + url);
    //We need to make a request to the url
    const request = await fetch(url);

    const rText = await request.text();
    // console.log(rText);

    //Get the user ID
    const finalUrl = request.url;
    // console.log("Final URL: " + finalUrl);
    const userID = finalUrl.split("id=")[1];
    // console.log("User ID: " + userID);

    async function fillWords(AC) {
        //Filter with the regex ">something - something</a> (accepts anything)
        //width if ac=true, bug if ac=false
        const regex1 = new RegExp(`${AC ? "width" : "bug"} text-muted[^c]+>[0-9]+ - [^<]+<\/a>`, "gi"); //Only AC
        const regex2 = new RegExp(">[0-9]+ - [^<]+</a>", "gi"); //Only the title part
        //const regex = new RegExp(">[a-zA-Z0-9]+ - [a-zA-Z0-9 ]+</a>", "gi");
        const matches1 = rText.match(regex1);
        if (matches1 === null) return;
        //Matches is matches1 that matches regex2
        const matches = matches1.join("").match(regex2);
        //console.log("Hey: " + matches);

        words = matches.map(match => {
            //Remove the > and </a>
            return match.substring(7, match.length - 4);
        });

        //wordsAc.push(...words);
        (AC ? wordsAc : wordsWa).push(...words);
        //Escape the regex characters
        (AC ? wordsAc : wordsWa).forEach((word, index) => {
            (AC ? wordsAc : wordsWa)[index] = word.replace(/\[\.\*\+\?\^\$\{\}\(\)\|\[\]\\]/g, '');
        });
    }
    await fillWords(true);
    await fillWords(false);

    console.log("Words to AC: " + wordsAc.length);
    console.log("Words to WA: " + wordsWa.length);

    return { wordsAc, wordsWa, userID };
}
