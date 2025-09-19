async function checkVersion() {
    const manifest = chrome.runtime.getManifest();
    const currentVersion = manifest.version;
    
    //https://raw.githubusercontent.com/Jaimepas77/AeRForU/refs/heads/main/manifest.json
    const response = await fetch('https://raw.githubusercontent.com/Jaimepas77/AeRForU/refs/heads/main/manifest.json', { cache: 'no-store' });
    if (response.ok) {
        const latestManifest = await response.json();
        const latestVersion = latestManifest.version;

        if (currentVersion !== latestVersion) {
            // Notify the user about the new version
            console.log(`New version available: ${latestVersion}`);
            
            // Create notification element
            const notification = document.createElement('div');
            notification.id = 'version-notification';
            notification.className = 'notification hidden';
            notification.innerHTML = `
                <p>A new version of AeRForU is available!</p>
                <a href="https://github.com/Jaimepas77/AeRForU" target="_blank">Get it now</a>
                <button id="close-notification" class="close-btn">x</button>
            `;
            document.body.prepend(notification);

            // Add styles for the notification
            const style = document.createElement('style');
            style.innerHTML = `
                .notification {
                    background-color: #ffeb3b;
                    padding: 12px 50px;
                    border: 1px solid #fbc02d;
                    border-radius: 8px;
                    margin: 10px 0px;
                    position: relative;
                    text-align: center;
                    width: fit-content;
                    margin-left: auto;
                    margin-right: auto;
                }
                .notification p {
                    margin: 0px 0px 8px;
                    text-align: center;
                }
                .notification a {
                    color: #1976d2;
                    text-decoration: none;
                }
                .notification a:hover {
                    text-decoration: underline;
                }
                .close-btn {
                    position: absolute;
                    top: 4px;
                    right: 4px;
                    background: none;
                    border: none;
                    font-size: 16px;
                    cursor: pointer;
                }
                .close-btn:hover {
                    color: #f44336;
                }
                .hidden { display: none; }
            `;
            document.head.appendChild(style);

            // Show the notification
            notification.classList.remove('hidden');
            document.getElementById('close-notification').onclick = () => {
                notification.classList.add('hidden');
            };
        }
    }
}

checkVersion();