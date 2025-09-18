// In-page cache of the user's options
const options = {};
const optionsFormList = document.getElementById("optionsFormList");
const optionsForm24en23 = document.getElementById("optionsForm24en23");
const optionsFormDownload = document.getElementById("optionsFormDownload");

// Immediately persist options changes
optionsFormList.bold.addEventListener("change", (event) => {
    chrome.storage.local.set({ BOLD: event.target.checked });
    // Reload the page to apply the changes
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.reload(tabs[0].id);
    });
});

optionsFormList.AcColor.addEventListener("change", (event) => {
  chrome.storage.local.set({ AcColor: event.target.value });
  // Reload the page to apply the changes
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.reload(tabs[0].id);
  });
});

optionsFormList.WaColor.addEventListener("change", (event) => {
    chrome.storage.local.set({ WaColor: event.target.value });
    // Reload the page to apply the changes
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.reload(tabs[0].id);
    });
});

optionsFormList.Reset.addEventListener("click", () => {
    chrome.storage.local.clear();
    // Reload the page to apply the changes
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.reload(tabs[0].id);
    });
});

optionsForm24en23.hyperlinks.addEventListener("change", (event) => {
    chrome.storage.local.set({ hyperlinks: event.target.checked });
    // Reload the page to apply the changes
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.reload(tabs[0].id);
    });
});

//Call the download function from download.js
optionsFormDownload.Download.addEventListener("click", () => {
    import('./download.js').then((module) => {
        module.downloadProblems();
    });
});

//Listen to changes in the storage
chrome.storage.onChanged.addListener((changes, namespace) => {
    for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
        if (newValue !== undefined) {
            if (key === 'BOLD') {
                optionsFormList.bold.checked = newValue;
            }
            else if (key === 'AcColor') {
                optionsFormList.AcColor.value = newValue;
            }
            else if (key === 'WaColor') {
                optionsFormList.WaColor.value = newValue;
            }
            else if (key === 'hyperlinks') {
                optionsForm24en23.hyperlinks.checked = newValue;
            }
        }
    }
});

async function loadOptions() {
    // Initialize the form with the user's option settings
    const data = await chrome.storage.local.get(["BOLD", "AcColor", "WaColor", "hyperlinks"]);
    optionsFormList.bold.checked = Boolean(data.BOLD);
    if (data.AcColor === undefined || data.WaColor === undefined) {
        optionsFormList.AcColor.value = "#d4edda"; // light green
        optionsFormList.WaColor.value = "#ffe6e6"; // light red
        //chrome.storage.local.set({ AcColor: optionsFormList.AcColor.value, WaColor: optionsFormList.WaColor.value });
    }
    else {
        optionsFormList.AcColor.value = data.AcColor;
        optionsFormList.WaColor.value = data.WaColor;
    }
    optionsForm24en23.hyperlinks.checked = Boolean(data.hyperlinks);
}

loadOptions();
