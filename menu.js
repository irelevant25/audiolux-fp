// NAVIGATION
// Every top-level .content element is one "page"; the URL hash decides which one is shown.
// Links only need href="#<id>" where <id> is a section (#technika) or any element inside
// one (#o-nas), so header, footer and in-page links all work without extra JavaScript.

const sections = Array.from(document.querySelectorAll('.content'));
const menuLinks = Array.from(document.querySelectorAll('#nav a'));
const hamburger = document.getElementById('hamburger');
const navWrapper = document.getElementById('nav-menu');

function showSection() {
    const id = window.location.hash.slice(1);
    const target = id ? document.getElementById(id) : null;
    const section = target?.closest('.content') ?? sections[0];

    sections.forEach(s => s.classList.toggle('active', s === section));
    menuLinks.forEach(link => {
        if (link.getAttribute('href') === `#${section.id}`) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
    });
    closeMenu();

    // jump to the requested element inside the section, otherwise start from the top
    requestAnimationFrame(() => {
        if (target && target !== section) target.scrollIntoView({ behavior: scrollBehavior() });
        else scrollToTop();
    });
}

function scrollBehavior() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: scrollBehavior() });
}

window.addEventListener('hashchange', showSection);
showSection();

document.querySelector('.back-to-top').addEventListener('click', scrollToTop);

// hamburger

function setMenuOpen(open) {
    hamburger.classList.toggle('active', open);
    navWrapper.classList.toggle('active', open);
    hamburger.setAttribute('aria-expanded', String(open));
}

function closeMenu() {
    setMenuOpen(false);
}

hamburger.addEventListener('click', () => {
    setMenuOpen(!navWrapper.classList.contains('active'));
});

// Close menu when clicking on a link (including the Kontakt button and the current page's link)
navWrapper.addEventListener('click', (e) => {
    if (e.target.closest('a')) closeMenu();
});
