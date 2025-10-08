let SHOW_LEVEL = true;

chrome.storage.local.get(['SHOW_LEVEL'], function(data) {
    if (data.SHOW_LEVEL !== undefined) {
        SHOW_LEVEL = data.SHOW_LEVEL;
    }
    else {
        chrome.storage.local.set({ SHOW_LEVEL: SHOW_LEVEL });
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

    const finalTable = document.getElementsByClassName("problemGlobalStatistics")[0];

    const header = finalTable.getElementsByTagName("thead")[0];
    header.children[0].appendChild(document.createElement("th"));
    header.children[0].children[3].innerText = "Nivel (0-100)";

    const body = finalTable.getElementsByTagName("tbody")[0];
    body.children[0].appendChild(document.createElement("td")); // First row
    body.children[0].children[3].style.fontWeight = "bold";

    //Extract problem id from URL
    const urlParams = new URLSearchParams(window.location.search);
    const problem_id = urlParams.get('id');

    body.children[0].children[3].innerText = await getProblemLevel(problem_id);
}
