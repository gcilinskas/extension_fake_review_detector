chrome.runtime.onInstalled.addListener(function(details) {
    chrome.storage.local.set({ 'extensionEnabled': true }, function() {
        console.log('Extension is enabled by default.');
    });
});