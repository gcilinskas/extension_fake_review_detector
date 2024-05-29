document.addEventListener('DOMContentLoaded', function() {
    // const checkPageButton = document.getElementById('checkPage');
    const toggleExtension = document.getElementById('toggleExtension');

    // Load the saved state of the extension and set the toggle accordingly
    chrome.storage.local.get('extensionEnabled', function(data) {
        toggleExtension.checked = data.extensionEnabled !== false; // Default to true if not set
    });

    // Listen for the toggle change to enable/disable the extension
    toggleExtension.addEventListener('change', function() {
        const isEnabled = toggleExtension.checked;
        chrome.storage.local.set({ 'extensionEnabled': isEnabled }, function() {
            console.log('Extension enabled state is now: ', isEnabled);
        });
    });

    // Listen for clicks on the "Check This Page" button
    // checkPageButton.addEventListener('click', function() {
    //     chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    //         // Ensure the extension is enabled before checking the page
    //         if (toggleExtension.checked) {
    //             // Send a message to the content script running in the current tab
    //             chrome.tabs.sendMessage(tabs[0].id, {action: "checkReviewsOnPage"}, function(response) {
    //                 console.log('Check page for fake reviews initiated.', response);
    //             });
    //         } else {
    //             alert("The extension is currently disabled. Please enable it to check this page.");
    //         }
    //     });
    // });
});
