// CONTACT FORM SCRIPT
// Fetch CSRF token when page loads
async function fetchCSRFToken() {
    try {
        const response = await fetch('get-token.php');
        const data = await response.json();
        document.getElementById('csrf_token').value = data.csrf_token;
    } catch (error) {
        console.error('Error fetching CSRF token:', error);
    }
}

// Load CSRF token on page load
document.addEventListener('DOMContentLoaded', fetchCSRFToken);

const form = document.getElementById('contactForm');
const submitBtn = document.getElementById('submitBtn');
const messageBox = document.getElementById('messageBox');

if (form && submitBtn && messageBox) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault(); // Stop the default form submission

        // Disable button while sending
        submitBtn.disabled = true;
        const originalButtonHTML = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span>Odosielanie...</span>';

        // Get form data
        const formData = new FormData(form);

        try {
            // Send to PHP API
            const response = await fetch('api.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            // Show success/error message
            messageBox.style.display = 'block';
            if (result.success) {
                messageBox.className = 'message-box success';
                messageBox.textContent = '✓ Správa bola úspešne odoslaná!';
                form.reset();
                // Fetch new CSRF token after successful submission
                fetchCSRFToken();
            } else {
                messageBox.className = 'message-box error';
                messageBox.textContent = '✗ Chyba: ' + result.message;
            }

        } catch (error) {
            messageBox.style.display = 'block';
            messageBox.className = 'message-box error';
            messageBox.textContent = '✗ Chyba pri odosielaní správy. Skúste to prosím znova.';
        }

        // Re-enable button
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalButtonHTML;

        // Hide message after 5 seconds
        setTimeout(() => {
            messageBox.style.display = 'none';
        }, 5000);
    });
}

function openGalleryModal(event) {
    const img = event?.target
    if (!img) {
        console.error('No image found');
        return;
    }
    document.getElementById("modalImage").src = img.src;
    document.getElementById("galleryModal").style.display = "block";
    document.body.style.overflow = "hidden";
}

function closeGalleryModal() {
    document.getElementById("galleryModal").style.display = "none";
    document.body.style.overflow = "auto";
}

function changeGalleryImage(direction) {
    const images = Array.from(document.querySelectorAll('#galeria div.gallery-item > img')).map(img => img.src);
    const currentImageIndex = images.indexOf(document.getElementById("modalImage").src);
    // left
    if (direction === -1) {
        if (currentImageIndex === 0) document.getElementById("modalImage").src = images[images.length - 1];
        else document.getElementById("modalImage").src = images[currentImageIndex - 1];
    }
    // right
    else if (direction === 1) {
        if (currentImageIndex === images.length - 1) document.getElementById("modalImage").src = images[0];
        else document.getElementById("modalImage").src = images[currentImageIndex + 1];
    }
}

// Keyboard navigation
document.addEventListener("keydown", function (e) {
    if (document.getElementById("galleryModal").style.display === "block") {
        if (e.key === "ArrowLeft") changeGalleryImage(-1);
        if (e.key === "ArrowRight") changeGalleryImage(1);
        if (e.key === "Escape") closeGalleryModal();
    }
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