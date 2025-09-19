// download.js
// ESM module exported for dynamic import from the popup script.
// Usage: import('./download.js').then(m => m.downloadProblems());

/**
 * Public entry point called by the popup's click handler.
 * It resolves the cookie value (if present) and then calls the
 * download implementation (placeholder below) where you can put your code.
 */
export async function downloadProblems() {
  try {
    // Create clock for measuring elapsed time
    const startTime = performance.now();

    const cookieName = 'acrsession'; // cookie required by your download logic
    const tabUrl = await getActiveTabUrl();
    if (!tabUrl) {
      throw new Error('Could not determine active tab URL.');
    }

    // First attempt: use chrome.cookies API (works for HttpOnly cookies too,
    // provided you have the required "cookies" permission + host_permissions).
    const cookieObj = await getCookieForUrl(cookieName, tabUrl);
    let cookieValue = cookieObj ? cookieObj.value : null;

    if (!cookieValue) {
      // At this point the cookie was not found. Decide how you want to handle it:
      // inform the user, abort, or attempt a different strategy.
      console.warn(`Cookie "${cookieName}" not found for ${tabUrl}.`);
      // Optionally, update UI or throw. We'll throw so the caller can log it.
      throw new Error(`Cookie "${cookieName}" not found.`);
    }

    console.log('Cookie value obtained:', cookieValue);

    const cookieUsr = await getCookieForUrl("ACR_RememberMe", tabUrl);
    let username = cookieUsr ? cookieUsr.value : null;
    console.log("Username from cookie: " + username);
    let userID = await updateUserID(username);
    console.log("User ID: " + userID);

    // Show elapsed time for debugging
    const elapsedTime = performance.now() - startTime;
    //console.log(`Cookie retrieval took ${elapsedTime.toFixed(2)} ms`);

    // Get the submission IDs (num, problemId, problemName, language)
    const submissionsIDs = await getSubmissionIDs(userID);
    //console.log("submissions retrieved: " + submissionsIDs.length);

    // Show elapsed time for debugging
    const elapsedTime2 = performance.now() - (startTime + elapsedTime);
    //console.log(`Submission ID retrieval took ${elapsedTime2.toFixed(2)} ms`);

    //Get all codes and download as zip
    const zip = new JSZip();
    const downloadPromises = submissionsIDs.map(async (submission) => {
      const submissionCode = await getSubmissionCode(submission.num, cookieValue);
      //Add to zip
      let extension = "txt";  // Default extension
      if (submission.language === "CPP") {
        extension = "cpp";
      } else if (submission.language === "C") {
        extension = "c";
      } else if (submission.language === "JAVA") {
        extension = "java";
      }
      const filename = `${submission.problemId} - ${submission.problemName}.${extension}`;
      zip.file(filename, submissionCode);
    });

    await Promise.all(downloadPromises);

    // Show elapsed time for debugging
    const elapsedTime3 = performance.now() - (startTime + elapsedTime + elapsedTime2);
    //console.log(`Code retrieval took ${elapsedTime3.toFixed(2)} ms`);

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const zipUrl = URL.createObjectURL(zipBlob);
    const zipFilename = 'submissions.zip';

    // Trigger the download
    chrome.downloads.download({
      url: zipUrl,
      filename: zipFilename,
      saveAs: true
    });

    // Show elapsed time for debugging
    const elapsedTime4 = performance.now() - (startTime + elapsedTime + elapsedTime2 + elapsedTime3);
    //console.log(`Zip creation and download initiation took ${elapsedTime4.toFixed(2)} ms`);

    // Show total elapsed time for debugging
    const totalElapsedTime = performance.now() - startTime;
    console.log(`Total downloadProblems time: ${totalElapsedTime.toFixed(2)} ms`);

  } catch (err) {
    // Keep errors visible in console for debugging; you can surface these to the popup UI.
    console.error('downloadProblems error:', err);
    // Optionally show a friendly message in the popup (not implemented here).
  }
}

/* -------------------- Helpers -------------------- */

/**
 * Returns the URL (string) of the currently active tab in the focused window.
 * Note: this requires that the extension is allowed access to the tab (activeTab or tabs permission).
 */
function getActiveTabUrl() {
  return new Promise((resolve) => {
    try {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (chrome.runtime.lastError) {
          console.error('tabs.query error:', chrome.runtime.lastError);
          resolve(null);
          return;
        }
        if (!tabs || tabs.length === 0) {
          resolve(null);
          return;
        }
        resolve(tabs[0].url || null);
      });
    } catch (e) {
      console.error('getActiveTabUrl exception:', e);
      resolve(null);
    }
  });
}

/**
 * Use chrome.cookies.get to fetch the cookie object for a given cookie name and tab URL.
 * chrome.cookies.get expects a full URL (scheme + host); we use the tab origin.
 */
function getCookieForUrl(name, tabUrl) {
  // Build a URL acceptable to chrome.cookies.get: origin + '/'
  let cookieUrl;
  try {
    const u = new URL(tabUrl);
    cookieUrl = u.origin + '/'; // e.g. "https://example.com/"
  } catch (e) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    try {
      chrome.cookies.get({ url: cookieUrl, name }, (cookie) => {
        if (chrome.runtime.lastError) {
          // Most likely a permission/host mismatch or other chrome API error
          console.warn('chrome.cookies.get error:', chrome.runtime.lastError);
          resolve(null);
          return;
        }
        resolve(cookie || null);
      });
    } catch (e) {
      console.error('getCookieForUrl exception:', e);
      resolve(null);
    }
  });
}

async function getSubmissionIDs(userID) {
  // Search for an AC submission
  // let problem_info_base_url = "https://aceptaelreto.com/ws/problem/all";
  let problem_info_base_url = "https://aceptaelreto.com/ws/user/${userID}/problems/all".replace("${userID}", userID);
  let request_info = await fetch(problem_info_base_url);
  console.log("Fetching problem info from " + problem_info_base_url);
  let problem_info = await request_info.text();
  // Parse the XML response
  let parser = new DOMParser();
  let xmlDoc = parser.parseFromString(problem_info, "application/xml");
  // Convert XML to JSON-like structure
  problem_info = {
    problem: Array.from(xmlDoc.getElementsByTagName("problem")).map(problem => ({
      num: problem.getElementsByTagName("num")[0]?.textContent,
      title: problem.getElementsByTagName("title")[0]?.textContent,
      // Add more fields as needed
    }))
  };

  //Loop through all problems in parallel
  let submissionsIDs = [];
  let promises = problem_info.problem.map(async (problem) => {
    // console.log("Checking problem " + problem.num + ": " + problem.title);
    let problem_submissions_base_url = "https://aceptaelreto.com/ws/user/${userID}/submissions/problem/${problemId}";
    let problem_submissions_url = problem_submissions_base_url.replace("${userID}", userID).replace("${problemId}", problem.num);

    let request = await fetch(problem_submissions_url);
    let submissions = await request.json();
    //console.log(problemId + ": " + submissions.submission.length + " submissions found");
    let end = false;
    while (submissions.submission.length > 0 && !end) {
      // Loop through the submissions and check for an AC submission
      for (const submission of submissions.submission) {
        if (submission.result === "AC") {
          //Push num, problemId, problemName, language
          submissionsIDs.push({ num: submission.num, problemId: problem.num, problemName: problem.title, language: submission.language });
          end = true;
          break; // No need to check further submissions for this problem
        }
      }

      // If there are no next link (undefined), break the loop
      if (submissions.nextLink === undefined) {
        break;
      }
      
      // Get the next page of submissions
      request = await fetch(submissions.nextLink);
      submissions = await request.json();
    }
  });
  await Promise.all(promises);
  return submissionsIDs;
}

async function updateUserID(username) {
  let prevUsername = await new Promise((resolve) => {
    chrome.storage.local.get("username", function (data) {
      resolve(data.username);
    });
  });

  let userID;
  if (prevUsername === username) {
    userID = await new Promise((resolve) => {
      chrome.storage.local.get("userID", function (data) {
        resolve(data.userID);
      });
    });
  }
  else if (username !== undefined) {
    userID = await getUserID(username);

    if (userID === undefined) {
      userID = false; // Hardcode your user ID
    }
    else {
      // Store new username and userID in the storage
      chrome.storage.local.set({ username: username });
      chrome.storage.local.set({ userID: userID });
    }
  }
  else {
    console.log("No username found");
    userID = false;
  }

  //console.log("User ID: " + userID);
  return userID;
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

async function getSubmissionCode(submissionId, userKey) {
  let submission_code_url = "https://aceptaelreto.com/ws/submission/${submissionId}/code";
  submission_code_url = submission_code_url.replace("${submissionId}", submissionId);

  const request = await fetch(submission_code_url, {
    method: 'GET',
    headers: {
      'Cookie': 'acrsession=' + userKey,
    }
  });

  if (request.status === 200) {
    const code = await request.text();
    return code;
  } else {
    throw new Error("Failed to fetch submission code - " + request.status + "\nURL: " + submission_code_url);
  }
}

// (async () => {
//     let submissionCode = await getSubmissionCode(1031552, "43ae114c-24ea-45f9-b936-d757ad6db651");
//     console.log(submissionCode);
// })();
