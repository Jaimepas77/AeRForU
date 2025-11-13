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

async function isCategoryCompleted(categoryId, userID) {
    if (await isProblemsCategory(categoryId) === false) {
        let category_categories_url = "https://aceptaelreto.com/ws/cat/${categoryId}/?md=1";
        category_categories_url = category_categories_url.replace("${categoryId}", categoryId);
        const request = await fetch(category_categories_url);
        const category_data = await request.json();
        if (category_data.subcats.length > 0) {
            for (const subcat of category_data.subcats) {
                const completed = await isCategoryCompleted(subcat.id, userID);
                if (completed === false) {
                    return false;
                }
            }
        }
        return true;
    }
    else {
        let category_problems_url = "https://aceptaelreto.com/ws/cat/${categoryId}/problems";
        category_problems_url = category_problems_url.replace("${categoryId}", categoryId);
        const request = await fetch(category_problems_url);
        let problem_list = await request.json();
        let problems = problem_list.problem;

        if (problems.length > 0) {
            const chunkSize = 20;
            for (let i = 0; i < problems.length; i += chunkSize) {
                const chunk = problems.slice(i, i + chunkSize);
                const promises = chunk.map(problem => isAC(problem.num, userID));
                const results = await Promise.all(promises);
                if (results.some(result => result === false)) {
                    return false;
                }
            }
            return true;
        }
        else {
            return false;
        }
    }
}

async function isVolumeCompleted(volumeId, userID) {
    let volume_problems_url = "https://aceptaelreto.com/ws/volume/${volumeId}/problems";
    volume_problems_url = volume_problems_url.replace("${volumeId}", volumeId);
    const request = await fetch(volume_problems_url);
    let problem_list = await request.json();

    let problems = problem_list.problem;

    if (problems.length > 0) {
        const chunkSize = 20;
        for (let i = 0; i < problems.length; i += chunkSize) {
            const chunk = problems.slice(i, i + chunkSize);
            const promises = chunk.map(problem => isAC(problem.num, userID));
            const results = await Promise.all(promises);
            if (results.some(result => result === false)) {
                return false;
            }
        }
        return true;
    }
    else {
        return false;
    }
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

// Not testeable function, depends on chrome.storage
async function getCachedProblemCategories(problemId) { // If not cached, return from the other function
    if (typeof problemId === 'string') {
        problemId = parseInt(problemId);
    }
    
    let problems_categories = await new Promise((resolve) => {
        chrome.storage.local.get("problemCategories", function (data) {
            resolve(data.problemCategories);
        });
    });

    if (problems_categories === undefined || problems_categories[problemId] === undefined) {
        if (problems_categories === undefined) {
            problems_categories = new Map();
        }
        problems_categories[problemId] = await getProblemCategories(problemId);
        chrome.storage.local.set({ problemCategories: problems_categories });
    }

    return problems_categories[problemId] || [];
}

async function getProblemCategories(problemId) {
    if (typeof problemId === 'string') {
        problemId = parseInt(problemId);
    }

    let problem_categories_url = "https://aceptaelreto.com/ws/problem/${problemId}/cat";
    problem_categories_url = problem_categories_url.replace("${problemId}", problemId);
    
    let contained_categories = [];

    const request = await fetch(problem_categories_url);
    const categories_list = await request.json();
    for (const category of categories_list.category) {
        contained_categories.push(category.id);
    }

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

async function getCategoryProblems(categoryId) {
    let category_problems_url = "https://aceptaelreto.com/ws/cat/${categoryId}/problems";
    category_problems_url = category_problems_url.replace("${categoryId}", categoryId);
    const request = await fetch(category_problems_url);
    let problem_list = await request.json();
    let problems = problem_list.problem;

    while (problem_list.nextLink !== undefined) {
        const nextRequest = await fetch(problem_list.nextLink);
        problem_list = await nextRequest.json();
        problems = problems.concat(problem_list.problem);
    }

    return problems;
}

async function getProblemInfo(problemId) {
    let problem_info_url = `https://aceptaelreto.com/ws/problem/${problemId}`;
    const request = await fetch(problem_info_url);
    const problem_data = await request.json();
    return problem_data;
}

async function getProblemRanking(problemId, start=1, size=20) {
    let problem_ranking_url = `https://aceptaelreto.com/ws/problem/${problemId}/ranking?start=${start}&n=${size}`;
    const request = await fetch(problem_ranking_url);
    const ranking_data = await request.json();
    return ranking_data;
}

async function getProblemLevel(problemId) {
    return levels_dict[problemId] || null;
}

async function getLevelsText(type=1) {
    // Get the level texts based on the type
    // type 0: emojis
    // type 1: Spanish text (default)
    // type 2: stars
    let unknown_text = "❔";
    let easy_text = "🟢";
    let medium_text = "🟡";
    let hard_text = "🔴";
    let very_hard_text = "💀";
    if (type == 1) { //Texto en español
        unknown_text = "Desconocido";
        easy_text = "Fácil";
        medium_text = "Medio";
        hard_text = "Difícil";
        very_hard_text = "Extremo";
    }
    else if (type == 2) { // Estrellas
        easy_text = "★☆☆";
        medium_text = "★★☆";
        hard_text = "★★★";
    }
    
    // Return dictionary with the texts
    return {
        "unknown": unknown_text,
        "easy": easy_text,
        "medium": medium_text,
        "hard": hard_text,
        "very_hard": very_hard_text
    };
}

async function getUserProblemPosition(user_nick, problemId) {
    let winner = null;
    const normalizedKey = `aer_user_${user_nick.trim().toLowerCase()}`;
    const cached = await new Promise(resolve => chrome.storage.local.get(normalizedKey, data => resolve(data[normalizedKey])));

    // --- Intento 1: Aerdata (si tenemos nick original en cache, usarlo)
    const tryAerdata = async () => {
        try {
            const aerNick = (cached && cached.nick) ? cached.nick : user_nick;
            const data = await fetch(`https://aerdata.lluiscab.net/aer/user/profile/${encodeURIComponent(aerNick)}`).then(r => r.json());
            const pos = data?.data?.user?.problems?.find(p => String(p.id) === String(problemId))?.result?.position;
            if (pos) { winner = 'aerdata'; return pos; }
        } catch (e) {
            console.log("Aerdata error", e);
        }
        throw new Error();
    };

    // --- Intento 2: Fallback (si encuentra uid/nick con case original, guardarlo)
    const tryFallback = async () => {
        const userIdFromCache = cached && cached.uid ? String(cached.uid) : null;
        const userId = userIdFromCache || String(await getUserID(user_nick));
        const userNick = user_nick.trim().toLowerCase();
        let nextUrl = `https://aceptaelreto.com/ws/problem/${problemId}/ranking?start=1&size=20`;

        let rank = 0;

        while (nextUrl) {
            try {
                const data = await fetch(nextUrl).then(r => r.json());

                for (const sub of data.submission) {
                    const uid = sub.user?.id ? String(sub.user.id) : null;
                    const nickRaw = sub.user?.nick || null;
                    const nickLower = nickRaw ? nickRaw.trim().toLowerCase() : null;

                    rank++;

                    if ((uid && userId && uid === userId) || (nickLower && nickLower === userNick)) {
                        winner = 'fallback';
                        const newValue = { uid: uid || userId, nick: nickRaw || user_nick };
                        const needsSet = !cached || cached.uid !== newValue.uid || cached.nick !== newValue.nick;

                        if (needsSet) {
                            chrome.storage.local.set({ [normalizedKey]: newValue }, () => {
                                if (chrome.runtime.lastError) { console.log("Error saving user cache:", chrome.runtime.lastError); } 
                                else { console.log(`🧩 Guardado ${normalizedKey} ->`, newValue); }
                            });
                        }

                        return rank;
                    }
                }

                nextUrl = data.nextLink;
            } catch (e) {
                // fetch fallo o formato inesperado
                break;
            }
        }

        throw new Error();
    };

    try {
        const result = await Promise.any([tryAerdata(), tryFallback()]);
        //console.log(`✅ Posición: ${result} (${winner === 'aerdata' ? 'Aerdata' : 'Fallback'})`);
        return result;
    } catch {
        //console.log("ℹ️ No encontrado");
        return null;
    }
}

try {
    module.exports = { isAC, isTried, isCategoryCompleted, isVolumeCompleted, getUserID, getNick, getLastError, getProblemCategories, isProblemsCategory, getCategoryData, getCategoryProblems, getProblemInfo, getProblemLevel, getLevelsText, getUserProblemPosition };
}
catch (e) {
    // Do nothing, this is for testing purposes
    //console.log("Error: " + e);
    //console.log("This is not a test environment");
}