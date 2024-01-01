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

//Mutation observer to detect when the table is loaded
const tableLoader = new MutationObserver(highlightTitles);
tableLoader.observe(document.querySelector("table[class='table table-bordered problemsList']"), {
    childList: true,
    subtree: true,
});

function highlightTitles() {
    console.log("Ini of AeRForU: highlighting problems")
    if (username !== false) {
        // Get the list of words to highlight
        const words = getTitles();
        const wordsToAc = words.wordsAc;
        const wordsToWa = words.wordsWa;
        
        // Create a regex with all the words to highlight
        const regexAc = new RegExp(wordsToAc.join("|"), "gi");
        //console.log(regex1);
        const regexWa = new RegExp(wordsToWa.join("|"), "gi");

        //Get all the text nodes in the table
        const table = document.querySelector("table[class='table table-bordered problemsList']");
        //console.log(table);
        const textNodes = table.querySelectorAll("a");
        //console.log([...textNodes]);

        //Iterate over each text node
        textNodes.forEach(node => {
            //console.log("Node: " + node.innerHTML);
            if (node.innerHTML.match(regexAc)) {
                node.parentNode.parentNode.style.backgroundColor = AcColor;
            }
            else if (node.innerHTML.match(regexWa)) {
                node.parentNode.parentNode.style.backgroundColor = WaColor;
            }
            //Si quieres que se ponga en negrita el título de los problemas descomenta esto
            // if (node.parentNode.className === "problemsInfo-title") {
            //     //console.log("Title: " + node.innerHTML);
            //     //bold the title
            //     node.parentNode.style.fontWeight = "bold";
            //     //bold the number of problem
            //     node.parentNode.previousSibling.previousSibling.style.fontWeight = "bold";
            // }
        });
    }
    console.log("End of AeRForU");
}

//Function to get the words to highlight
function getTitles() {
    const wordsAc = [];
    const wordsWa = [];
    
    //We need to webscrap the words to highlight
    const baseSearchUrl = "https://aceptaelreto.com/bin/search.php?search_query=${username}&commit=searchUser&search_currentPage=%2Fuser%2Fprofile.php";
    url = baseSearchUrl.replace("${username}", username);
    //console.log("URL: " + url);
    //We need to make a request to the url
    const request = new XMLHttpRequest();
    request.open("GET", url, false);
    request.send(null);

    if (request.status === 302) {
        const baseUrl = "https://aceptaelreto.com${url}"
        url = baseUrl.replace("${url}", request.getResponseHeader("Location"));
        console.log("Redirecting to: " + url);
        request.open("GET", url, false);
        request.send(null);
    }
    else if (request.status !== 200) {
        console.log("Request failed with status: " + request.status);
        return;
    }

    //console.log(request.responseText);

    function fillWords(AC) {
        //Filter with the regex ">something - something</a> (accepts anything)
        //width if ac=true, bug if ac=false
        const regex1 = new RegExp(`${AC ? "width" : "bug"} text-muted[^c]+>[0-9]+ - [^<]+<\/a>`, "gi"); //Only AC
        const regex2 = new RegExp(">[0-9]+ - [^<]+</a>", "gi"); //Only the title part
        //const regex = new RegExp(">[a-zA-Z0-9]+ - [a-zA-Z0-9 ]+</a>", "gi");
        const matches1 = request.responseText.match(regex1);
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
    fillWords(true);
    fillWords(false);
    
    console.log("Words to AC: " + wordsAc.length);
    console.log("Words to WA: " + wordsWa.length);

    return {wordsAc, wordsWa};
}
