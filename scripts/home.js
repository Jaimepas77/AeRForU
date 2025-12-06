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

(async function() {
    insertNewProblemButton();
    showLevel();
})();

async function showLevel() {
    if (SHOW_LEVEL === null) setTimeout(showLevel, 100);

    if (!SHOW_LEVEL) return;

    // console.log("Showing problem levels...");
    
    // Extract problem id from hyperlink
    const readmoreLink = document.getElementsByClassName('readMore')[0].children[0];
    const problem_id = readmoreLink ? readmoreLink.getAttribute('href').split('=')[1].split('&')[0] : null;

    const problem_level = await getProblemLevel(problem_id);

    // DOM manipulation
    const exercise_div = document.getElementsByClassName("statement")[0]?.children[0];
    if (!exercise_div) {
        console.error("Could not find statement element");
        return;
    }

    // Create div and append in the first position
    const level_div = document.createElement("div");
    level_div.style.cssText = `
        font-size: 16px;
        margin-bottom: -6px;
        margin-top: 0px;
    `;
    
    exercise_div.insertBefore(level_div, exercise_div.children[0]);
    
    // Create progress bar with initial 0 value, then animate to actual value
    await createProgressBarWithAnimation(level_div, problem_level);
}

async function insertNewProblemButton() {
    // Get title element to insert the button next to it
    const headerElement = document.querySelector('.panel-heading.text-center');

    // Create the button element
    const refresh_button = document.createElement('div');
    refresh_button.innerHTML = ICONS_SVG.refresh;
    refresh_button.style.cursor = 'pointer';
    refresh_button.title = 'Encontrar otro problema aleatorio';
    // Make the button not selectable to avoid interfering with text selection
    refresh_button.style.userSelect = 'none';

    // Restructure html to place button next to title (mantain h3 font size)
    const titleText = headerElement.textContent;
    headerElement.textContent = '';
    headerElement.style.display = 'flex';
    headerElement.style.justifyContent = 'center';
    headerElement.style.alignItems = 'center';
    headerElement.style.position = 'relative';

    const titleSpan = document.createElement('span');
    titleSpan.textContent = titleText;
    titleSpan.style.fontSize = '1.17em'; // Approximate h3 font size

    refresh_button.style.position = 'absolute';
    refresh_button.style.right = '10px';
    
    headerElement.appendChild(titleSpan);
    headerElement.appendChild(refresh_button);

    // Add click event to the button to fetch a new random problem
    refresh_button.addEventListener('click', async () => {
        await informLoadingProblemData();
        const randomProblemId = await getRandomProblem();
        await replaceProblemData(randomProblemId);
        showLevel();
    });
}

async function getRandomProblem(notSolvedByUser=true) {
    // Get a random problem ID from the ones with level data
    // levels_dict is a dict with problem IDs as keys
    const problemIds = Object.keys(levels_dict);

    let randomIndex = Math.floor(Math.random() * problemIds.length);
    let randomProblemId = problemIds[randomIndex];

    let count = 0;
    while (notSolvedByUser && count < 100) {
        let userID = await new Promise((resolve) => { // Try cache
            chrome.storage.local.get("userID", function (data) {
                resolve(data.userID);
            });
        });
        // userID = 3428; // AperezaC for testing

        if (userID === undefined)
            break;
        if (await isAC(randomProblemId, userID) === false)
            break;
        console.log(`Problem ${randomProblemId} already solved, trying another one...`);

        randomIndex = Math.floor(Math.random() * problemIds.length);
        randomProblemId = problemIds[randomIndex];
        count += 1; // If problem is already solved, try again (up to 100 times)
    }

    return randomProblemId;
}

async function informLoadingProblemData() {
    // Get class "statement" (div)
    const classStatement = document.getElementsByClassName('statement')[0];
    classStatement.innerHTML = '<h1>Cargando nuevo problema...</h1>';
}

async function replaceProblemData(problemId=100) {
    console.log(`Fetching problem data for problem ID: ${problemId}`);

    // Get class "statement" (div)
    const classStatement = document.getElementsByClassName('statement')[0];

    const problemHTML = await getProblemSummaryHTML(problemId);
    if (!problemHTML) {
        console.error('Failed to fetch problem data.');
        classStatement.innerHTML = '<h1>Error al cargar el problema.</h1>';
        return;
    }

    // Replace the inner HTML of the statement with the new problem data
    classStatement.innerHTML = problemHTML;

    // Center the problem title
    const problemTitle = classStatement.querySelector('h2');
    if (problemTitle) {
        problemTitle.style.textAlign = 'center';
    }

    // Replace the readmore link
    const readmoreLink = document.getElementsByClassName('readMore')[0];
    readmoreLink.children[0].href = `https://aceptaelreto.com/problem/statement.php?id=${problemId}`;
}