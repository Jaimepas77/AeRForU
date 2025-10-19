async function updateCategories() {
    let problemId = parseInt(await getProblemId());

    // Load cached categories
    let problems_categories = await new Promise((resolve) => {
        chrome.storage.local.get("problemCategories", function (data) {
            resolve(data.problemCategories);
        });
    });
    // console.log("Categories from storage: ", problem_categories);

    let use_cached = problems_categories !== undefined && problems_categories[problemId] !== undefined;

    // Update categories
    let categories = [];
    if (use_cached) { // If categories are found in storage
        // console.log("Categories from storage: ", problem_categories);
        categories = problems_categories[problemId];

        insertCategories(categories);

        // Wait for 1000 ms to let other http requests finish before updating categories
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    let new_categories = getProblemCategories(problemId);
    if (!use_cached) { // If categories are not found in storage
        // console.log("No categories found in storage");
        // If no categories are found, create a new Map
        if (problems_categories === undefined) {
            problems_categories = new Map();
        }
        categories = await new_categories;
        // console.log("Categories from API: ", categories);
        problems_categories[problemId] = categories;
        
        insertCategories(categories);
    }

    // Always update categories in background
    if (await new_categories.length !== categories.length) {
        // Update categories in storage
        problems_categories[problemId] = await new_categories;
        // console.log("Updating categories in storage: ", problem_categories);
        chrome.storage.local.set({ problemCategories: problems_categories });
    }
}

async function insertCategories(categories) {
    let categories_data = [];
    categories_data = await Promise.all(categories.map(cat => getCategoryData(cat)));

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
    const urlParams = new URLSearchParams(window.location.search);
    const problem_id = urlParams.get('id');
    return problem_id;
}
