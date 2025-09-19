// Settings
let AcColor = "#f2fff2";//light green
let WaColor = "#ffe6e6";//light red
let BOLD = true;
chrome.storage.local.get(["BOLD", "AcColor", "WaColor"], function (data) {
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
    // console.log("BOLD: " + BOLD);
    // console.log("AcColor: " + AcColor);
    // console.log("WaColor: " + WaColor);
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
(async function() {
    console.log("Problems page");
    let username = getUsername();
    const userID = await updateUserID(username);

    // Retrieve the userID from the remember me cookie if possible
    const cookieName = "ACR_RememberMe";
    const pageUrl = window.location.href;

    if (userID === false) {
        console.log("No userID found for username " + username + ", trying to get it from the cookie");

        // Send message to background to request the cookie value.
        chrome.runtime.sendMessage(
            { type: "GET_COOKIE", url: pageUrl, name: cookieName },
            async (response) => {
                // If response is undefined and chrome.runtime.lastError exists,
                // the extension or background might not be reachable.
                if (chrome.runtime.lastError) {
                    console.log("Error getting cookie: " + chrome.runtime.lastError.message);
                    return;
                }

                if (response && response.success) {
                    console.log("Cookie value: " + response.value);
                    highlightTitles(await updateUserID(response.value));
                } else {
                    console.log("Error getting cookie: " + (response ? response.error : "No response"));
                }
            }
        );
        return;
    }

    // Check if url contains cat=n or vol=n
    const urlParams = new URLSearchParams(window.location.search);
    const catParam = urlParams.get('cat');
    const volParam = urlParams.get('vol');
    console.log("catParam: " + catParam);
    console.log("volParam: " + volParam);
    if ((catParam !== null && await isProblemsCategory(catParam)) || volParam !== null) {
        highlightTitles(userID);
    }

})();

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
            highlightProblemTitle(problem, userID);
        }
    }
    console.log("End of AeRForU");
}

async function highlightProblemTitle(problem, userID) {
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

        if (userID === undefined) {
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

    //console.log("User ID: " + userID);
    return userID;
}


async function checkVersion() {
    const manifest = chrome.runtime.getManifest();
    const currentVersion = manifest.version;
    
    //https://raw.githubusercontent.com/Jaimepas77/AeRForU/refs/heads/main/manifest.json
    const response = await fetch('https://raw.githubusercontent.com/Jaimepas77/AeRForU/refs/heads/main/manifest.json', { cache: 'no-store' });
    if (response.ok) {
        const latestManifest = await response.json();
        const latestVersion = latestManifest.version;

        if (currentVersion !== latestVersion) {
            // Notify the user about the new version
            console.log(`New version available: ${latestVersion}`);
        }
    }
}
