const menuItems = Array.from(document.querySelectorAll('#nav > a'));
const bodyItems = Array.from(document.querySelectorAll('.content'));

const hamburger = document.getElementById('hamburger');
const navWrapper = document.querySelector('.nav-wrapper');

function findMenuItem(hash) {
    return menuItems.find(i => i.getAttribute('href') === hash);
}

function navigate(event) {
    event.preventDefault();

    // currentTarget = element with the onclick (menu link, CTA or footer link)
    const hash = event.currentTarget.getAttribute('href');
    const bodyItem = bodyItems.find(b => '#' + b.id === hash);
    if (!bodyItem) return;

    // unactive all menu and body items
    menuItems.forEach(i => i.classList.remove('active'));
    bodyItems.forEach(b => b.classList.remove('active'));

    // set active menu item
    findMenuItem(hash)?.classList.add('active');

    // show the selected one
    bodyItem.classList.add('active');

    // update the URL hash without jumping
    history.replaceState(null, '', hash);

    // close the mobile menu
    hamburger.classList.remove('active');
    navWrapper.classList.remove('active');
    hamburger.setAttribute('aria-expanded', 'false');

    requestAnimationFrame(() => {
        scrollToTop();
    });
}

// check the hashtag on page load
window.addEventListener('DOMContentLoaded', () => {
    // default to first menu item
    const menuItem = findMenuItem(window.location.hash) ?? menuItems[0];
    menuItem.click();
});

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
}

// hamburger

hamburger.addEventListener('click', () => {
    const isOpen = hamburger.classList.toggle('active');
    navWrapper.classList.toggle('active', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
});
