const radios = document.querySelectorAll('.radio-wrapper input[type="radio"]');

  radios.forEach(radio => {
    radio.addEventListener('change', () => {
      document.querySelectorAll('.radio-wrapper').forEach(wrapper => {
        wrapper.classList.remove('active');
      });
      if (radio.checked) {
        radio.parentElement.classList.add('active');
      }
    });
  });

  // Initialize active state on load
  document.querySelectorAll('.radio-wrapper input[type="radio"]').forEach(radio => {
    if (radio.checked) {
      radio.parentElement.classList.add('active');
    }
  });