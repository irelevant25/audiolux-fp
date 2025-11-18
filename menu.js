const menuItems = [
    document.querySelector('nav > a[href="#domov"]'),
    document.querySelector('nav > a[href="#technika"]'),
    document.querySelector('nav > a[href="#galeria"]'),
    document.querySelector('nav > a[href="#kontakt"]')
];
const bodyItems = [
    document.querySelector('#domov'),
    document.querySelector('#technika'),
    document.querySelector('#galeria'),
    document.querySelector('#kontakt')
];

function navigate(event) {
    event.preventDefault();

    // unactive all menu and body items
    menuItems.forEach(i => i.classList.remove('active'));
    bodyItems.forEach(b => b.classList.remove('active'));

    // set active menu item
    event.target.classList.add('active');

    // show the selected one
    const hash = event.target.getAttribute('href');
    const bodyItem = document.querySelector(hash);
    bodyItem.classList.add('active');

    // update the URL hash without jumping
    history.replaceState(null, null, hash);

    scrollToTop();
}

// check the hashtag on page load
window.addEventListener('DOMContentLoaded', () => {
    const hash = window.location.hash;
    const menuItem = hash ? document.querySelector(`nav > a[href="${hash}"]`) : undefined;
    if (menuItem) {
        menuItem.click();
    }
    else {
        // default to first menu item
        document.querySelector('nav > a').click();
    }
});

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
}

// hamburger

const hamburger = document.getElementById('hamburger');
const navWrapper = document.querySelector('.nav-wrapper');
const nav = document.getElementById('nav');

hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('active');
  navWrapper.classList.toggle('active');
});

// Close menu when clicking on a link
nav.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('active');
    navWrapper.classList.remove('active');
  });
});