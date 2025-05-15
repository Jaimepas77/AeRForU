async function updateCategories() {
    let problemId = parseInt(await getProblemId());

    // Load cached categories
    let problem_categories = await new Promise((resolve) => {
        chrome.storage.local.get("problemCategories", function (data) {
            resolve(data.problemCategories);
        });
    });
    // console.log("Categories from storage: ", problem_categories);

    // Update categories
    let categories = [];
    let new_categories = getProblemCategories(problemId);
    if (problem_categories !== undefined && problem_categories[problemId] !== undefined) { // If categories are found in storage
        // console.log("Categories from storage: ", problem_categories);
        categories = problem_categories[problemId];

        insertCategories(categories);
    }
    else { // If categories are not found in storage
        // console.log("No categories found in storage");
        // If no categories are found, create a new Map
        if (problem_categories === undefined) {
            problem_categories = new Map();
        }
        categories = await new_categories;
        // console.log("Categories from API: ", categories);
        problem_categories[problemId] = categories;
        
        insertCategories(categories);
    }

    if (await new_categories.length !== categories.length) {
        // Update categories in storage
        problem_categories[problemId] = await new_categories;
        // console.log("Updating categories in storage: ", problem_categories);
        chrome.storage.local.set({ problemCategories: problem_categories });
    }
}

async function insertCategories(categories) {
    let categories_data = [];
    for (let i = 0; i < categories.length; i++) {
        let cat = await getCategoryData(categories[i]);
        categories_data.push(cat);
    }

    const categoriesDiv = document.getElementById("content").children[0].children[0];

    // Create container
    const categoriesContainer = document.createElement("div");
    categoriesContainer.id = "categoriesDiv";
    categoriesContainer.className = "card-body";
    categoriesContainer.style = `
        margin-top: 10px;
        margin-bottom: 10px;
        padding: 2px;
        background-color:rgb(163, 163, 163);
        border-radius: 5px;
        `;

    // Accordion + Tags HTML
    categoriesContainer.innerHTML = `
        <div>
            <button id="accordionToggle" style="
            width: 100%;
            text-align: left;
            padding: 10px;
            font-size: 16px;
            background-color:rgb(0, 97, 136);
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            ">
            Categorías ▼
            </button>
            <div id="accordionContent" style="
            display: none;
            padding: 10px;
            border: 1px solid #ddd;
            border-top: none;
            background-color: rgb(245, 245, 245);
            border-radius: 0 0 4px 4px;
            margin-top: -4px;
            ">
            ${categories_data.map(cat => `<span
                 style="
                display: inline-block;
                background-color:rgb(198, 233, 240);
                color: #333;
                padding: 5px 10px;
                border-radius: 12px;
                font-size: 13px;
                margin: 3px;
            ">
                <a href="https://aceptaelreto.com/problems/categories.php?cat=${cat.id}" target="_blank"
                style="color: rgb(0, 0, 0); underline: black;"\
                >${cat.name}</a>
            </span>`).join('')}
            </div>
        </div>
        `;

    // Insert into the page
    categoriesDiv.insertBefore(categoriesContainer, categoriesDiv.children[1]);

    // Toggle logic
    document.getElementById("accordionToggle").addEventListener("click", () => {
        const content = document.getElementById("accordionContent");
        content.style.display = content.style.display === "block" ? "none" : "block";
    });

}

async function getProblemId() {
    const url = window.location.href;
    const problemId = url.split("=")[1];
    return problemId;
}

updateCategories();
