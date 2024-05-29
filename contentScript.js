// Example function to extract reviews and check for fake scores
function extractAndCheckReviews() {
    const reviewDivs = document.querySelectorAll('[id^="customer_review-"]');
    let reviewBodySpans = [];

    reviewDivs.forEach(div => {
        const reviewBodySpan = div.querySelector('span[data-hook="review-body"]');
        const iSpan = div.querySelector('i > span');
        const iSpanText = iSpan ? iSpan.textContent : '';
        const rating = iSpanText.replace(' out of 5 stars', '');
        const ratingInt = parseInt(rating);

        if (reviewBodySpan) {
            reviewBodySpans.push({
                span: reviewBodySpan,
                rating: ratingInt,
            });
        }
    });

    if (reviewBodySpans.length === 0) {
        return;
    }

    const reviewBatchToPredict = [];
    reviewBodySpans.forEach(reviewData => {
        const review = reviewData.span;
        const rating = reviewData.rating;
        if (review.classList.contains('policed')) {
            return;
        }
        let reviewText = review.textContent;

        if (rating === 5) {
            reviewBatchToPredict.push(reviewText);
        } else {
            review.classList.add('policed');
            displayFakeScore(review, false);
        }
    });

    if (reviewBatchToPredict.length > 0) {
        fetch('https://api.reviewpolice.com/predict-batch', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ texts: reviewBatchToPredict }),
        })
            .then(response => response.json())
            .then(data => {
                data.forEach((isFakeReview, index) => {
                    const reviewData = reviewBodySpans.find(reviewData => reviewData.span.textContent === reviewBatchToPredict[index]);
                    if (reviewData) {
                        const review = reviewData.span;
                        review.classList.add('policed');
                        displayFakeScore(review, isFakeReview.is_fake_review);
                    }
                });
            })
            .catch(error => console.error('Error:', error));
    }


    // reviewBodySpans.forEach(reviewData => {
    //     const review = reviewData.span;
    //     const rating = reviewData.rating;
    //     if (review.classList.contains('policed')) {
    //         return;
    //     }
    //     review.classList.add('policed');
    //     const reviewText = review.textContent;
    //
    //     if (rating === 5) {
    //         fetch('https://api.reviewpolice.com/predict', {
    //             method: 'POST',
    //             headers: {
    //                 'Content-Type': 'application/json',
    //             },
    //             body: JSON.stringify({ text: reviewText }),
    //         })
    //             .then(response => response.json())
    //             .then(data => {
    //                 const isFakeReview = data.is_fake_review;
    //
    //                 displayFakeScore(review, isFakeReview);
    //             })
    //             .catch(error => console.error('Error:', error));
    //     } else {
    //         displayFakeScore(review, false);
    //     }
    // });
}

// Function to observe DOM changes and re-apply the extractAndCheckReviews function
function observeDOMChanges() {
    const config = { childList: true, subtree: true };
    let lastMutationTime = Date.now();
    let checkIntervalId = null;

    const observer = new MutationObserver((mutationsList, observer) => {
        lastMutationTime = Date.now();

        if (!checkIntervalId) {
            // Start periodic checks if not already started
            checkIntervalId = setInterval(() => {
                // If more than 1 second has passed since the last mutation, stop checking
                if (Date.now() - lastMutationTime > 1000) {
                    clearInterval(checkIntervalId);
                    checkIntervalId = null;
                } else {
                    // Attempt to process any new elements
                    chrome.storage.local.get('extensionEnabled', function(data) {
                        if (data.extensionEnabled) {
                            extractAndCheckReviews();
                        }
                    });
                }
            }, 200); // Check every 200ms
        }
    });

    observer.observe(document.body, config);
}

chrome.storage.local.get('extensionEnabled', function(data) {
    if (data.extensionEnabled) {
        observeDOMChanges();
        extractAndCheckReviews();
    } else {
        //
    }
});



function displayFakeScore(reviewElement, isFakeReview) {
        if (!isFakeReview) {
            const realReviewMark = createReviewMark('✅ Real Review', 'linear-gradient(135deg, #6e8efb, #a777e3)');
            reviewElement.prepend(realReviewMark);
        } else {
            const fakeReviewMark = createReviewMark('❌ Fake Review', 'linear-gradient(135deg, #ff7e5f, #feb47b)');
            reviewElement.prepend(fakeReviewMark);
        }
}

function createReviewMark(text, backgroundImage) {
    const reviewMark = document.createElement('div');
    reviewMark.className = 'police-review-mark';

    reviewMark.style.padding = '10px';
    reviewMark.style.color = 'white';
    reviewMark.style.borderRadius = '5px';
    reviewMark.style.fontWeight = 'bold';
    reviewMark.style.backgroundImage = backgroundImage;
    reviewMark.style.marginBottom = '10px';
    reviewMark.style.position = 'relative';
    reviewMark.style.display = 'flex';
    reviewMark.style.justifyContent = 'space-between';
    reviewMark.style.alignItems = 'center';
    reviewMark.style.fontSize = '14px'; // Adjust font size as needed

    // Adding review text
    const reviewText = document.createElement('div');
    reviewText.innerHTML = text;
    reviewMark.appendChild(reviewText);

    // Adding brand text with enhanced visibility
    const brandText = document.createElement('span');
    brandText.textContent = ' | Review Police';
    brandText.style.fontWeight = '300'; // Thinner font
    brandText.style.background = 'linear-gradient(to right, #ffffff, #cccccc)'; // A lighter gradient for better visibility
    brandText.style.webkitBackgroundClip = 'text';
    brandText.style.webkitTextFillColor = 'transparent';
    brandText.style.marginLeft = 'auto';
    brandText.style.fontSize = '12px'; // Slightly smaller font size for brand text

    reviewMark.appendChild(brandText);

    return reviewMark;
}


chrome.storage.onChanged.addListener(function(changes, namespace) {
    for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
        if (key === 'extensionEnabled') {
            if (newValue === true) {
                // The extension was enabled, add or re-add ratings
                observeDOMChanges();
                extractAndCheckReviews();
            } else {
                // remove elements where class-name = 'police-review-mark'
                const reviewMarks = document.querySelectorAll('.police-review-mark');
                reviewMarks.forEach(mark => mark.remove());
                // The extension was disabled, remove ratings
                const reviewDivs = document.querySelectorAll('[id^="customer_review-"]');
                let reviewBodySpans = [];

                reviewDivs.forEach(div => {
                    const reviewBodySpan = div.querySelector('span[data-hook="review-body"]');
                    const iSpan = div.querySelector('i > span');
                    const iSpanText = iSpan ? iSpan.textContent : '';
                    const rating = iSpanText.replace(' out of 5 stars', '');
                    const ratingInt = parseInt(rating);

                    if (reviewBodySpan) {
                        reviewBodySpans.push({
                            span: reviewBodySpan,
                            rating: ratingInt,
                        });
                    }
                });

                const reviewBatchToPredict = [];
                reviewBodySpans.forEach(reviewData => {
                    const review = reviewData.span;
                    const rating = reviewData.rating;
                    if (review.classList.contains('policed')) {
                        review.classList.remove('policed');
                    }
                });
            }
        }
    }
});

