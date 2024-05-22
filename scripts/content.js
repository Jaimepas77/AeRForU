//First we need to get the username
const username = getUsername();
//Function to get the username
function getUsername() {
    const icon = document.querySelector("i[class='icon icon-user']");
    const username = icon.parentNode.textContent.trim();
    if (username === "Login") {
        return false;
    }
    console.log("Username: " + username);
    return username;
}

const AcColor = "#f2fff2";//light green
const WaColor = "#ffe6e6";//light red
const BOLD = true;

// Highlight the titles of the problems when the page is loaded
window.onload = highlightTitles;

async function highlightTitles() {
    console.log("Ini of AeRForU: highlighting problems")
    if (username !== false) {
        // Get the list of words to highlight
        const words = await getTitles();
        const wordsToAc = words.wordsAc;
        const wordsToWa = words.wordsWa;

        //Get all the text nodes in the table
        const table = document.getElementById("problemsInfo").children[1];
        // console.log(table);

        const problemNodes = table.children[3]
        // console.log(problemNodes.children);

        for (const problem of problemNodes.children) {
            const title = problem.children[1].innerText;
            // console.log("Title: " + title);
            if (wordsToAc.length > 0 && wordsToAc.includes(title)) {
                problem.style.backgroundColor = AcColor;
            }
            else if (wordsToWa.length > 0 && wordsToWa.includes(title)) {
                problem.style.backgroundColor = WaColor;
            }

            if (BOLD) {
                problem.children[0].style.fontWeight = "bold";
                problem.children[1].style.fontWeight = "bold";
            }
        }
    }
    console.log("End of AeRForU");
}

//Function to get the words to highlight
async function getTitles() {
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
            (AC ? wordsAc : wordsWa)[index] = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        });
    }
    await fillWords(true);
    await fillWords(false);
    
    console.log("Words to AC: " + wordsAc.length);
    console.log("Words to WA: " + wordsWa.length);

    return {wordsAc, wordsWa};
}
