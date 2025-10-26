
async function insertAeRStatsURL() {
    // Find the nickname element
    let p_elem = null;
    const divs = document.getElementsByClassName('form-group');
    for (let div of divs) {
        const label = div.querySelector('label');
        if (label && label.innerText.trim() === 'Nick') {
            p_elem = div.querySelector('p');
            break;
        }
    }
    if (!p_elem) return;
    const user_nickname = p_elem.innerText.trim();
    
    // Insert the AeR stats URL next to the profile header
    const profileHeader = document.querySelector('h1');
    const statsURL = `https://aer.lluiscab.net/user/${user_nickname}`;
        const iconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-box-arrow-up-right" viewBox="0 0 16 16" style="vertical-align: middle;">
            <path fill-rule="evenodd" d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5z"/>
            <path fill-rule="evenodd" d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0v-5z"/>
        </svg>`;
        profileHeader.innerHTML += ` <a href="${statsURL}" target="_blank" title="AER Stats">${iconSVG}</a>`;
}

insertAeRStatsURL();
