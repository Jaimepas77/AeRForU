// getters.js (parcheado)

// --- funciones anteriores (sin cambios) ---
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

// --- getUserProblemPosition (REEMPLAZADA por versión robusta y con fallback a ranking) ---

/**
 * Obtiene la posición real del usuario en el ranking de un problema.
 * - Primero intenta usar https://aerdata.lluiscab.net/aer/user/profile/${user_nick}
 *   que es la opcion mas rapida y eficaz
 * - Si no tiene la info, realiza paginado sobre
 *   https://aceptaelreto.com/ws/problem/${problemId}/ranking y calcula
 *   la posición entre usuarios únicos (ignorando envíos repetidos). El mayor problema es que tiene que ir de 20 en 20
 *
 * Devuelve:
 *  - número (1-based) si se encuentra
 *  - null si no se encuentra o hay un error
 */
async function getUserProblemPosition(user_nick, problemId) {
    console.log("🔍 Buscando posición del usuario...");

    // --- Intento 1: Aerdata ---
    console.log("📊 Accediendo al ranking de Aerdata");
    try {
        const url = `https://aerdata.lluiscab.net/aer/user/profile/${encodeURIComponent(user_nick)}`;
        const resp = await fetch(url);

        if (resp.ok) {
            const data = await resp.json();
            const problems = data?.data?.user?.problems;

            //Busqueda de la posicion del usuario
            const found = problems?.find(p => String(p.id) === String(problemId));
            const pos = found?.result?.position ?? null;
            if (pos != null) {
                console.log(`✅ Posición desde Aerdata: ${pos}`);
                return pos;
            }
        }
    } catch (err) {
        console.warn("⚠️ Aerdata falló:", err);
    }

    // --- Intento 2: Fallback XML directo ---
    console.log("↩️ Usando fallback (JSON de Acepta el Reto)");
    
    const userId = String(await getUserID(user_nick));
    const userNickNorm = user_nick.trim().toLowerCase();
    //console.log("🧩 userId:", userId, "userNickNorm:", userNickNorm);

    let nextUrl = `https://aceptaelreto.com/ws/problem/${encodeURIComponent(problemId)}/ranking?start=1&size=100`;
    
    const seen = new Set();
    let uniqueRank = 0;

    while (nextUrl) {
        try {
            //console.log(`📥 Descargando ranking desde: ${nextUrl}`);
            const resp = await fetch(nextUrl);
            if (!resp.ok) {
            console.warn(`❌ HTTP ${resp.status} al obtener ${nextUrl}`);
            break;
            }

            const data = await resp.json();
            //console.log(`🔎 Analizando ${data.submission.length} submissions...`);

            for (const sub of data.submission) {
                const uid = sub?.user?.id != null ? String(sub.user.id).trim() : null;
                const nick = sub?.user?.nick ? sub.user.nick.trim().toLowerCase() : null;

                // clave única preferente por id, sino por nick
                const key = uid || (`nick:${nick || ""}`);

                if (!seen.has(key)) { // primer envío de este usuario -> cuenta como 1 puesto único
                    seen.add(key);
                    uniqueRank += 1;

                    // si coincide con el usuario objetivo, devolvemos la posición única
                    if ((userId && uid && uid === userId) || (userId && nick && nick === userNickNorm) || (userId && nick && nick === userNickNorm)) {
                        console.log(`✅ Posición real (usuarios únicos) encontrada: ${uniqueRank} (id:${uid} nick:${nick})`);
                        return uniqueRank;
                    }
                } // si ya estaba en 'seen', ignoramos (es envío repetido de la misma persona)
            }

            nextUrl = data.nextLink || null;
            if (!nextUrl) { console.log("🔚 No hay más páginas de ranking disponibles."); }
        } catch (err) {
            console.error("💥 Error procesando ranking JSON:", err);
            break;
        }
    }

    console.log("ℹ️ Usuario no encontrado en ranking.");
    return null;
}


// --- resto del archivo original (sin cambios) ---

try {
    module.exports = { isAC, isTried, isCategoryCompleted, isVolumeCompleted, getUserID, getNick, getLastError, getProblemCategories, isProblemsCategory, getCategoryData, getCategoryProblems, getProblemInfo, getProblemLevel, getLevelsText, getUserProblemPosition };
}
catch (e) {
    // Do nothing, this is for testing purposes
    //console.log("Error: " + e);
    //console.log("This is not a test environment");
}