document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('copyBooking');
  if (!btn || !navigator.clipboard) return;

  const email = 'booking@fish-is-watching.com';
  const originalText = btn.textContent;

  btn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(email);
      btn.textContent = 'e-mail copied!';
      btn.classList.add('copied');

      setTimeout(() => {
        btn.textContent = originalText;
        btn.classList.remove('copied');
      }, 1500);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  });
});
