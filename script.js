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

// GALLERY MODAL SCRIPT
const galleryImages = [
    "https://www.audiolux.sk/web/image/425-ec72f893/Galeria%202.webp",
    "https://www.audiolux.sk/web/image/454-c024d41a/g%2012.webp",
    "https://www.audiolux.sk/web/image/453-1794b5c3/g%209.webp",
    "https://www.audiolux.sk/web/image/452-b6ca24d8/g%208.webp",
    "https://www.audiolux.sk/web/image/448-e8b8411c/g%205.webp",
    "https://www.audiolux.sk/web/image/449-eb712875/g%2010.webp",
    "https://www.audiolux.sk/web/image/447-938b2db3/g%2014.webp",
    "https://www.audiolux.sk/web/image/450-d24c2ab7/g%2011.webp",
    "https://www.audiolux.sk/web/image/455-38750319/g%2013.webp",
    "https://www.audiolux.sk/web/image/424-2c97eaf1/Galeria%204.webp",
    "https://www.audiolux.sk/web/image/426-578a632b/Galeria%201.webp",
    "https://www.audiolux.sk/web/image/451-1e90474a/g%207.webp",
    "https://www.audiolux.sk/web/image/427-cb064270/WhatsApp%20Image%202023-12-31%20at%2023.08.02_44c1353b.webp",
    "https://www.audiolux.sk/web/image/335-81a3182b/307020004_623090175929685_5340014581742383801_n.webp",
    "https://www.audiolux.sk/web/image/501-b466f8fd/g%2018.webp",
    "https://www.audiolux.sk/web/image/502-d26aabb7/g%2015.webp",
    "https://www.audiolux.sk/web/image/503-81300d84/g%2017.webp",
    "https://www.audiolux.sk/web/image/504-4084a95a/g%2016.webp",
];

let currentImageIndex = 0;

function openGalleryModal(index) {
    currentImageIndex = index;
    document.getElementById("modalImage").src = galleryImages[index];
    document.getElementById("galleryModal").style.display = "block";
    document.body.style.overflow = "hidden";
}

function closeGalleryModal() {
    document.getElementById("galleryModal").style.display = "none";
    document.body.style.overflow = "auto";
}

function changeGalleryImage(direction) {
    currentImageIndex += direction;
    if (currentImageIndex < 0) {
        currentImageIndex = galleryImages.length - 1;
    } else if (currentImageIndex >= galleryImages.length) {
        currentImageIndex = 0;
    }
    document.getElementById("modalImage").src =
        galleryImages[currentImageIndex];
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