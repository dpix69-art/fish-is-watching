// scripts/click-to-copy.js

function attachCopyListener(element, email) {
  if (!element || !email) return;

  element.addEventListener('click', () => {
    const textToCopy = email.trim();
    const originalText = element.textContent;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy).catch((err) => {
        console.error('Clipboard error:', err);
      });
    } else {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = textToCopy;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      try {
        document.execCommand('copy');
      } catch (err) {
        console.error('execCommand copy failed:', err);
      }
      document.body.removeChild(textarea);
    }

    // Simple visual feedback
    element.textContent = 'Copied';
    setTimeout(() => {
      element.textContent = originalText;
    }, 1500);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  // Existing hero button
  const bookingButton = document.querySelector('#copyBooking');
  if (bookingButton) {
    attachCopyListener(bookingButton, 'booking@fish-is-watching.com');
  }

  // Generic emails in "Have an Idea?" sections
  const emailButtons = document.querySelectorAll('[data-copy-email]');
  emailButtons.forEach((btn) => {
    const email = btn.getAttribute('data-copy-email');
    if (email) {
      attachCopyListener(btn, email);
    }
  });
});
