// Lógica simplificada de filtrado, búsqueda y carrito de compras

document.addEventListener('DOMContentLoaded', () => {
  // 1. Encabezado estatico
  const header = document.querySelector('.header-utp');
  if (header) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 20) {
        header.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.05)';
      } else {
        header.style.boxShadow = 'none';
      }
    });
  }

  // 2. Carrito de compras
  const addCartButtons = document.querySelectorAll('.btn-add-cart');
  addCartButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const title = button.dataset.title;
      const price = parseFloat(button.dataset.price);
      
      let cart = JSON.parse(localStorage.getItem('utp_cart')) || [];
      cart.push({ title, price, quantity: 1 });
      localStorage.setItem('utp_cart', JSON.stringify(cart));
      
      alert(`"${title}" fue agregado al carrito.`);
    });
  });

  // 3. Filtrado y Búsqueda del Catálogo 
  const searchInput = document.getElementById('search-input');
  const categoryPills = document.querySelectorAll('.filter-pill');
  const cards = document.querySelectorAll('.product-card');

  if (cards.length > 0) {
    let currentCategory = 'todos';
    let searchQuery = '';

    function filterCards() {
      cards.forEach(card => {
        const title = card.querySelector('.product-title').textContent.toLowerCase();
        const description = card.querySelector('.product-description').textContent.toLowerCase();
        const category = card.dataset.category.toLowerCase();

        const matchesCategory = currentCategory === 'todos' || category === currentCategory;
        const matchesSearch = title.includes(searchQuery) || description.includes(searchQuery);

        if (matchesCategory && matchesSearch) {
          card.style.display = 'flex'; // Muestra la tarjeta (Grid children)
        } else {
          card.style.display = 'none'; // Oculta la tarjeta
        }
      });
    }

    // Eventos para los botones de filtrado (Pills)
    categoryPills.forEach(pill => {
      pill.addEventListener('click', () => {
        categoryPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        currentCategory = pill.dataset.category.toLowerCase();
        filterCards();
      });
    });

    // Evento para la barra de búsqueda
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        filterCards();
      });
    }
  }
});
