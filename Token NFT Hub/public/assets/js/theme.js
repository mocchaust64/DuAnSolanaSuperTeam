/*
Template Name: WebAi - AI Startup & Technology Landing Page HTML Template
Version: 1.0
Author: coderthemes
Email: support@coderthemes.com
File: theme.js
*/

document.addEventListener('DOMContentLoaded', function() {
  // Lucid Icons
  if (window.lucide) {
      window.lucide.createIcons();
  }

  // Animation on Scroll
  if (typeof AOS !== 'undefined') {
      AOS.init({
          duration: 1000,
          easing: 'ease-in-out',
          once: true,
          mirror: false
      });
  }

  // Sticky Navbar
  function windowScroll() {
      const navbar = document.getElementById("navbar-sticky");
      if (navbar) {
          if (document.body.scrollTop >= 50 || document.documentElement.scrollTop >= 50) {
              navbar.classList.add("nav-sticky");
          } else {
              navbar.classList.remove("nav-sticky");
          }
      }
  }

  // Navbar Active Class
  if (typeof Gumshoe !== 'undefined') {
      var spy = new Gumshoe("#navbar-navlist a", {
          offset: 80
      });
  }

  // Back To Top
  function scrollFunction() {
      var mybutton = document.getElementById("back-to-top");
      if (mybutton != null) {
          if (document.body.scrollTop > 500 || document.documentElement.scrollTop > 500) {
              mybutton.classList.add("opacity-100");
              mybutton.classList.remove("opacity-0");
          } else {
              mybutton.classList.add("opacity-0");
              mybutton.classList.remove("opacity-100");
          }
      }
  }

  // Add scroll event listeners
  window.addEventListener("scroll", (ev) => {
      ev.preventDefault();
      windowScroll();
      scrollFunction();
  });

  // Back to top click handler
  const backToTopButton = document.getElementById("back-to-top");
  if (backToTopButton) {
      backToTopButton.addEventListener('click', () => {
          document.body.scrollTop = 0;
          document.documentElement.scrollTop = 0;
      });
  }

  if (document.querySelector('[data-gumshoe]')) {
      new Gumshoe('[data-gumshoe] a', {
          offset: 70
      });
  }
});