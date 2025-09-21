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
    let url = baseSearchUrl.replace("${username}", username);
    
    //We need to make a request to the url
    const request = await fetch(url, {
        method: 'HEAD',
        redirect: 'follow'
    });

    //Get the user ID
    const finalUrl = request.url;
    // console.log("Final URL: " + finalUrl);
    let userID = finalUrl.split("id=")[1];

    return userID;
}

async function getNick(acrsession, ACR_session) {
    const profile_url = "https://aceptaelreto.com/user/profile.php";
    const request = await fetch(profile_url, {
        method: 'GET',
        headers: {
            'Cookie': 'acrsession=' + acrsession
                + '; ACR_SessionCookie=' + ACR_session

        }
    });

    // Look for the nickname in the HTML
    // The nickname is in a p inside a div following a label with text "Nick"
    const text = await request.text();
    
    // Use RegExp to find the nickname
    const regex = /<label[^>]*>\s*Nick\s*<\/label>\s*<div[^>]*>\s*<p[^>]*>([^<]*)<\/p>/i;
    const match = text.match(regex);
    return match ? match[1] : null;
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

    let category_info_url = "https://aceptaelreto.com/ws/cat/all";

    // Scan the categories
    // Fetch all categories' metadata
    const all_categories_request = await fetch(category_info_url);
    const all_categories = await all_categories_request.json();

    // Filter for categories that actually contain problems
    const relevant_categories = all_categories.filter(cat => cat.numOfProblems > 0);

    // Check each relevant category for the problem
    const categoryChecks = relevant_categories.map(async (category) => {
        const request = await fetch(category_problems_url.replace("${categoryId}", category.id));
        const problem_list = await request.json();
        if (problem_list.problem && problem_list.problem.some(elem => elem.num === problemId)) {
            return category.id;
        }
        return null;
    });

    const results = await Promise.all(categoryChecks);
    contained_categories = results.filter(id => id !== null);
    return contained_categories;
}

async function isProblemsCategory(categoryId) {
    let category_problems_url = "https://aceptaelreto.com/ws/cat/${categoryId}/problems";
    category_problems_url = category_problems_url.replace("${categoryId}", categoryId);

    const request = await fetch(category_problems_url);
    const problem_list = await request.json();

    return problem_list.problem.length > 0;
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
    module.exports = { isAC, isTried, getUserID, getNick, getLastError, getProblemCategories, isProblemsCategory, getCategoryData };
}
catch (e) {
    // Do nothing, this is for testing purposes
    //console.log("Error: " + e);
    //console.log("This is not a test environment");
}
