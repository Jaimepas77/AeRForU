// In-page cache of the user's options
const options = {};
const optionsForm = document.getElementById("optionsForm");
const optionsForm24en23 = document.getElementById("optionsForm24en23");

// Immediately persist options changes
optionsForm.bold.addEventListener("change", (event) => {
    chrome.storage.local.set({ BOLD: event.target.checked });
    // Reload the page to apply the changes
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.reload(tabs[0].id);
    });
});

optionsForm.AcColor.addEventListener("change", (event) => {
  chrome.storage.local.set({ AcColor: event.target.value });
  // Reload the page to apply the changes
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.reload(tabs[0].id);
  });
});

optionsForm.WaColor.addEventListener("change", (event) => {
    chrome.storage.local.set({ WaColor: event.target.value });
    // Reload the page to apply the changes
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.reload(tabs[0].id);
    });
});

optionsForm.Reset.addEventListener("click", () => {
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

//Listen to changes in the storage
chrome.storage.onChanged.addListener((changes, namespace) => {
    for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
        if (newValue !== undefined) {
            if (key === 'BOLD') {
                optionsForm.bold.checked = newValue;
            }
            else if (key === 'AcColor') {
                optionsForm.AcColor.value = newValue;
            }
            else if (key === 'WaColor') {
                optionsForm.WaColor.value = newValue;
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
    optionsForm.bold.checked = Boolean(data.BOLD);
    optionsForm.AcColor.value = data.AcColor;
    optionsForm.WaColor.value = data.WaColor;
    optionsForm24en23.hyperlinks.checked = Boolean(data.hyperlinks);
}

loadOptions();
