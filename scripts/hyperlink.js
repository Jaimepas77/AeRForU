// Hyperlinks for 24 en 23
let usersPage; //Source of the usernames and IDs
let usersRanking; //The ranking table


let HYPERLINK = true; //24en23 hyperlinks

chrome.storage.local.get(["hyperlinks"], function (data) {
    if (data.hyperlinks !== undefined) {
        HYPERLINK = data.hyperlinks;
        // console.log("HYPERLINK (storage): " + HYPERLINK);
    }
    else {
        chrome.storage.local.set({ hyperlinks: HYPERLINK });
        // console.log("HYPERLINK (default): " + HYPERLINK);
    }
    if (HYPERLINK) {   
        initHyperlinks();
    }
});

// Observe the body for changes in the ranking
const observer = new MutationObserver(mutations => {
    mutations.forEach(async mutation => {
        if (mutation.addedNodes.length > 0) {
            console.log("Mutation observer started");
            observer.disconnect();
            await addHyperlinks();
            observer.observe(mutation.target, {
                childList: true,
                subtree: true
            });
            console.log("Mutation observer finished");
        }
    });
});

async function getUsers() {
    year = window.location.href.split("/")[4];
    const usersLink = "https://aceptaelreto.com/24en23/${year}/bin/users.php".replace("${year}", year);
    const request = await fetch(usersLink);
    usersPage = await request.json();
}

async function initHyperlinks() {
    usersRanking = document.getElementsByClassName("card-body")[0];

    try {
        const table = usersRanking.children[2];
        // console.log(table);

        const userNodes = table.children[1];
        // console.log(userNodes.children[0]);

        while (userNodes.children.length == 0) { //Wait for full loading
            // Check every 100ms
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        await addHyperlinks();

        observer.observe(userNodes, {
            childList: true,
            subtree: true
        });
    }
    catch (error) {
        console.error("Error in initHyperlinks: ", error, "retrying...");
        setTimeout(initHyperlinks, 100);
    }
}

async function addHyperlinks() {
    if (usersPage === undefined) {
        await getUsers();
    }
    // console.log(usersRanking);

    const table = usersRanking.children[2];
    // console.log(table);

    const userNodes = table.children[1];
    // console.log(userNodes.children[0]);

    while (userNodes.children.length == 0) { //Wait for full loading
        // Check every 100ms
        // await new Promise(resolve => setTimeout(resolve, 1000));
        return;
    }

    for (const user of userNodes.children) {
        const userTD = user.children[1];
        // console.log(userTD);

        // If hyperlink already exists, skip
        if (userTD.children.length > 0) {
            console.log("Already a hyperlink");
            continue;
        }

        // Change the text to a hyperlink
        const username = userTD.innerText;
        let userID = 0;
        for (const elem of usersPage) {
            if (elem.name === username) {
                userID = elem.acrId;
                break;
            }
        }
        userTD.innerHTML = `<a href="https://aceptaelreto.com/user/profile.php?id=${userID}"\
                                target="_blank"\
                                style="color: rgb(0, 50, 155); underline: black;"\
                                >${username}</a>`;

    }
}
