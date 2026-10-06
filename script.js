// CONTACT FORM SCRIPT
const csrfInput = document.getElementById('csrf_token');

// Fetch CSRF token when page loads
async function fetchCSRFToken() {
    try {
        const response = await fetch('get-token.php');
        const data = await response.json();
        csrfInput.value = data.csrf_token;
    } catch (error) {
        console.error('Error fetching CSRF token:', error);
    }
}

// Load CSRF token on page load
document.addEventListener('DOMContentLoaded', fetchCSRFToken);

const form = document.getElementById('contactForm');
const submitBtn = document.getElementById('submitBtn');
const messageBox = document.getElementById('messageBox');
let hideMessageTimer;

function showMessage(type, text) {
    messageBox.className = `message-box ${type}`;
    messageBox.textContent = text;
    messageBox.hidden = false;

    // Hide message after 5 seconds
    clearTimeout(hideMessageTimer);
    hideMessageTimer = setTimeout(() => {
        messageBox.hidden = true;
    }, 5000);
}

// Send to PHP API
function sendForm() {
    return fetch('api.php', {
        method: 'POST',
        body: new FormData(form)
    });
}

if (form && submitBtn && messageBox) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault(); // Stop the default form submission

        // Disable button while sending
        submitBtn.disabled = true;
        const originalButtonHTML = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span>Odosielanie...</span>';

        try {
            // The token request may have failed on page load (e.g. flaky connection)
            if (!csrfInput.value) await fetchCSRFToken();

            // An expired PHP session invalidates the token (403): get a fresh one and retry once
            let response = await sendForm();
            if (response.status === 403) {
                await fetchCSRFToken();
                response = await sendForm();
            }

            const result = await response.json();

            // Show success/error message
            if (result.success) {
                showMessage('success', '✓ Správa bola úspešne odoslaná!');
                form.reset();
            } else {
                showMessage('error', '✗ Chyba: ' + result.message);
            }
        } catch (error) {
            showMessage('error', '✗ Chyba pri odosielaní správy. Skúste to, prosím, znova.');
        }

        // Re-enable button
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalButtonHTML;
    });
}

// GALLERY
// Gallery items are <button>s, the enlarged photo is shown in a native <dialog>
// (focus trap, Esc to close and the inert page behind it come from the browser).
const galleryModal = document.getElementById('galleryModal');
const modalImage = document.getElementById('modalImage');
const galleryImages = Array.from(document.querySelectorAll('#galeria .gallery-item img'));
let galleryIndex = 0;
let galleryOpener = null;

function showGalleryImage(index) {
    galleryIndex = (index + galleryImages.length) % galleryImages.length;
    modalImage.src = galleryImages[galleryIndex].src;
    modalImage.alt = galleryImages[galleryIndex].alt;
}

document.querySelector('#galeria .gallery-grid').addEventListener('click', (e) => {
    const item = e.target.closest('.gallery-item');
    if (!item) return;

    galleryOpener = item;
    showGalleryImage(galleryImages.indexOf(item.querySelector('img')));
    galleryModal.showModal();
    document.body.style.overflow = 'hidden';
});

galleryModal.addEventListener('close', () => {
    document.body.style.overflow = '';
    galleryOpener?.focus();
});

galleryModal.querySelector('.modal-close').addEventListener('click', () => galleryModal.close());

galleryModal.querySelectorAll('.modal-nav').forEach(button => {
    button.addEventListener('click', () => showGalleryImage(galleryIndex + Number(button.dataset.step)));
});

// Clicking the dark area around the photo closes it
galleryModal.addEventListener('click', (e) => {
    if (e.target === galleryModal || e.target.classList.contains('modal-content')) galleryModal.close();
});

// Keyboard navigation (Escape is handled by <dialog> itself). Listen on document: after clicking
// the photo some browsers move focus out of the dialog, and keys then never reach it.
document.addEventListener('keydown', (e) => {
    if (!galleryModal.open) return;
    if (e.key === 'ArrowLeft') showGalleryImage(galleryIndex - 1);
    if (e.key === 'ArrowRight') showGalleryImage(galleryIndex + 1);
});

// Intersection Observer for scroll animations
const reveals = document.querySelectorAll('.reveal');

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
        } else {
            // remove class when scrolling back up to replay animation
            entry.target.classList.remove('active');
        }
    });
}, {
    threshold: 0.1, // Trigger when 10% of element is visible
    rootMargin: '200px 0px 0px 0px' // Adjust trigger point
});

reveals.forEach(reveal => {
    observer.observe(reveal);
});
