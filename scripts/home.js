(async function() {
    insertNewProblemButton();
})();

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
        const randomProblemId = await getRandomProblem();
        await replaceProblemData(randomProblemId);
    });
}

async function getRandomProblem() {
    // Get a random problem ID from the ones with level data
    // levels_dict is a dict with problem IDs as keys
    const problemIds = Object.keys(levels_dict);
    const randomIndex = Math.floor(Math.random() * problemIds.length);
    const randomProblemId = problemIds[randomIndex];
    return randomProblemId;
}

async function replaceProblemData(problemId=100) {
    console.log(`Fetching problem data for problem ID: ${problemId}`);

    // Get class "statement" (div)
    const classStatement = document.getElementsByClassName('statement')[0];

    classStatement.innerHTML = '<h1>Cargando nuevo problema...</h1>';

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