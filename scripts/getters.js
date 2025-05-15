async function isAC(problemId, userID) {
    // Search for an AC submission
    let problem_submissions_url = "https://aceptaelreto.com/ws/user/${userID}/submissions/problem/${problemId}";
    problem_submissions_url = problem_submissions_url.replace("${userID}", userID);
    problem_submissions_url = problem_submissions_url.replace("${problemId}", problemId);
    
    let request = await fetch(problem_submissions_url);
    let submissions = await request.json();

    do {
        // Loop through the submissions and check for an AC submission
        for (const submission of submissions.submission) {
            if (submission.result === "AC") {
                return true;
            }
        }

        // If there are no next link (undefined), break the loop
        if (submissions.nextLink === undefined) {
            break;
        }
        console.log("Next link: " + submissions.nextLink);
        // Get the next page of submissions
        request = await fetch(submissions.nextLink);
        submissions = await request.json();
    } while (submissions.submission.length > 0); //If there are no submissions, break the loop
    return false;
}

async function isTried(problemId, userID) {
    // Search for an AC submission
    let problem_submissions_url = "https://aceptaelreto.com/ws/user/${userID}/submissions/problem/${problemId}";
    problem_submissions_url = problem_submissions_url.replace("${userID}", userID);
    problem_submissions_url = problem_submissions_url.replace("${problemId}", problemId);
    
    const request = await fetch(problem_submissions_url);
    const submissions = await request.json();

    return submissions.submission.length !== 0;
}

async function getUserID(username) {
    // console.log("New username: " + username);
    const baseSearchUrl = "https://aceptaelreto.com/bin/search.php?search_query=${username}&commit=searchUser&search_currentPage=%2Fuser%2Fprofile.php";
    url = baseSearchUrl.replace("${username}", username);
    
    //We need to make a request to the url
    const request = await fetch(url, {
        method: 'HEAD',
        redirect: 'follow'
    });

    //Get the user ID
    const finalUrl = request.url;
    // console.log("Final URL: " + finalUrl);
    userID = finalUrl.split("id=")[1];

    return userID;
}

async function getLastError(problemId, userID) {
    // Get the last submission
    let problem_submissions_url = "https://aceptaelreto.com/ws/user/${userID}/submissions/problem/${problemId}";
    problem_submissions_url = problem_submissions_url.replace("${userID}", userID);
    problem_submissions_url = problem_submissions_url.replace("${problemId}", problemId);

    const request = await fetch(problem_submissions_url);
    const submissions = await request.json();
    // console.log(submissions.submission[0].result);
    return submissions.submission[0].result;
}

async function getProblemCategories(problemId) {
    let category_problems_url = "https://aceptaelreto.com/ws/cat/${categoryId}/problems";
    let contained_categories = [];

    // Scan the categories (start from 2, stop when null returned)
    let categoryId = 2;
    let problem_list = null;

    let not_found_counter = 0;
    while(not_found_counter < 10) {
        // Get the problems in the category
        request = await fetch(category_problems_url.replace("${categoryId}", categoryId));
        if (request.status === 404) {
            // console.log("Category not found: " + categoryId);
            not_found_counter++;
            categoryId++;
            continue;
        }
        problem_list = await request.json();
        // console.log("Problems: " + problem_list.problem.length);

        // Add the category to the list if the preblemId is in the list of problems
        if (problem_list.problem.some(elem => elem.num === problemId)) {
            contained_categories.push(categoryId);
        }
        
        // Increment the category ID
        categoryId++;
    }
    // console.log("Contained categories: " + contained_categories);
    return contained_categories;
}

async function getCategoryData(categoryId) {
    let category_name_url = "https://aceptaelreto.com/ws/cat/${categoryId}";
    category_name_url = category_name_url.replace("${categoryId}", categoryId);
    const request = await fetch(category_name_url);
    const category_data = await request.json();
    // console.log("Category data: " + category_data.name);
    return category_data;
}

try {
    module.exports = { isAC, isTried, getUserID, getLastError, getProblemCategories, getCategoryData };
}
catch (e) {
    // Do nothing, this is for testing purposes
    //console.log("Error: " + e);
    //console.log("This is not a test environment");
}
