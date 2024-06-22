// Hyperlinks for 24 en 23
async function addHyperlinks() {
    const usersLink = "https://aceptaelreto.com/24en23/2024/bin/users.php";
    const request = await fetch(usersLink);
    const usersPage = await request.json();
    const usersInfo = document.getElementsByClassName("card-body")[0];
    // console.log(usersInfo);

    const table = usersInfo.children[2];
    // console.log(table);

    const userNodes = table.children[1];
    // console.log(userNodes.children[0]);

    while (userNodes.children.length == 0) { //Wait for full loading
        // Check every 100ms
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    for (const user of userNodes.children) {
        const userTD = user.children[1];
        // console.log(userTD);

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
