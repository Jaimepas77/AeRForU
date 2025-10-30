let SHOW_LEVEL = null;

chrome.storage.local.get(['SHOW_LEVEL'], function(data) {
    if (data.SHOW_LEVEL !== undefined) {
        SHOW_LEVEL = data.SHOW_LEVEL;
    }
    else {
        chrome.storage.local.set({ SHOW_LEVEL: true });
        SHOW_LEVEL = true;
    }
});

(function() {
    console.log("Statement page");
    showLevel();
    updateCategories();
    showRecommendations();
})();

async function showLevel() {
    if (SHOW_LEVEL === null) setTimeout(showLevel, 100);

    if (!SHOW_LEVEL) return;

    console.log("Showing problem levels...");
    
    // Extract problem id from URL
    const urlParams = new URLSearchParams(window.location.search);
    const problem_id = urlParams.get('id');

    const problem_level = await getProblemLevel(problem_id);

    // DOM manipulation
    const exercise_div = document.getElementsByClassName("statement")[0]?.children[0];
    if (!exercise_div) {
        console.error("Could not find statement element");
        return;
    }

    // Create div and append in the first position
    const level_div = document.createElement("div");
    level_div.style.cssText = `
        font-size: 16px;
        margin-bottom: 10px;
        margin-top: -10px;
    `;
    
    exercise_div.insertBefore(level_div, exercise_div.children[0]);
    
    // Create progress bar with initial 0 value, then animate to actual value
    await createProgressBarWithAnimation(level_div, problem_level);
}

/**
 * Creates a progress bar that starts at 0% and animates to the target value
 * @param {HTMLElement} cell - The container element for the progress bar
 * @param {number|null} targetLevel - The target level (0-100) or null for unknown
 * @param {boolean} withNumber - Whether to show the numeric value
 * @param {number} animationDelay - Delay before starting animation in milliseconds
 * @returns {Promise<void>} - Resolves when animation is complete
 */
async function createProgressBarWithAnimation(cell, targetLevel = null, withNumber = false, animationDelay = 50) {
    cell.innerHTML = ''; // Clear the cell

    const progressContainer = document.createElement("div");
    progressContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 8px;
    `;

    // Create level number display
    const levelNumber = document.createElement("div");
    levelNumber.style.cssText = `
        font-weight: bold;
        text-align: center;
        font-size: 14px;
        color: gray;
    `;

    // Create progress bar container
    const progressBar = document.createElement("div");
    progressBar.style.cssText = `
        width: 100%;
        height: 5px;
        background-color: #e0e0e0;
        border-radius: 3px;
        overflow: hidden;
    `;

    // Create progress fill element
    const progressFill = document.createElement("div");
    progressFill.style.cssText = `
        height: 100%;
        width: 0%;
        background-color: #999999;
        transition: width 0.8s ease, background-color 0.8s ease;
        border-radius: 3px;
    `;

    // Set initial state
    levelNumber.innerText = "0";
    
    // Build DOM structure
    progressBar.appendChild(progressFill);
    if (withNumber) {
        progressContainer.appendChild(levelNumber);
    }
    progressContainer.appendChild(progressBar);
    cell.appendChild(progressContainer);

    // Wait for DOM to be rendered, then animate to target value
    await new Promise(resolve => setTimeout(resolve, animationDelay));
    
    // Animate to target value
    animateProgressBar(progressFill, levelNumber, targetLevel, withNumber);
}

/**
 * Animates the progress bar to the target level with appropriate colors
 * @param {HTMLElement} progressFill - The progress bar fill element
 * @param {HTMLElement} levelNumber - The level number display element
 * @param {number|null} targetLevel - The target level to animate to
 * @param {boolean} withNumber - Whether to update the number display
 */
function animateProgressBar(progressFill, levelNumber, targetLevel, withNumber) {
    const { width, backgroundColor, textColor } = getProgressBarStyles(targetLevel);
    
    // Update progress fill
    progressFill.style.width = width;
    progressFill.style.backgroundColor = backgroundColor;
    
    // Update number display if enabled
    if (withNumber) {
        levelNumber.style.color = textColor;
        levelNumber.innerText = targetLevel !== null ? targetLevel.toString() : "?";
    }
}

/**
 * Determines the styling for a progress bar based on the level value
 * @param {number|null} level - The level value (0-100) or null for unknown
 * @returns {Object} - Object containing width, backgroundColor, and textColor
 */
function getProgressBarStyles(level) {
    if (level === null) {
        return {
            width: "0%",
            backgroundColor: "#999999",
            textColor: "gray"
        };
    }
    
    const width = `${Math.min(Math.max(level, 0), 100)}%`;
    
    if (level <= LEVEL_EASY) {
        return {
            width,
            backgroundColor: "#4caf50", // Green
            textColor: "#4caf50"
        };
    } else if (level <= LEVEL_MEDIUM) {
        return {
            width,
            backgroundColor: "#ff9800", // Orange
            textColor: "#ff9800"
        };
    } else if (level < LEVEL_HARD) {
        return {
            width,
            backgroundColor: "#f44336", // Red
            textColor: "#f44336"
        };
    } else {
        return {
            width,
            backgroundColor: "#9c27b0", // Purple
            textColor: "#9c27b0"
        };
    }
}

/**
 * Legacy function for backward compatibility
 * Creates a progress bar without animation
 * @param {HTMLElement} cell - The container element
 * @param {number|null} problem_level - The level value
 * @param {boolean} withNumber - Whether to show numeric value
 */
function createProgressBar(cell, problem_level = null, withNumber = false) {
    createProgressBarWithAnimation(cell, problem_level, withNumber, 0);
}