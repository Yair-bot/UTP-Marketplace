// Lista de productos activa (se carga dinámicamente desde MySQL)
let productosActivos = [];

// Esperar a que la página cargue por completo
window.onload = function() {

  // 1. AÑADIR PRODUCTOS AL CARRITO

  // Delegación de eventos para soportar clics en tarjetas estáticas y dinámicas
  document.addEventListener('click', function(e) {
    const boton = e.target.closest('.btn-add-cart');
    if (boton) {
      e.preventDefault();
      
      const tituloBoton = boton.getAttribute('data-title');
      
      // Buscar el producto en la lista activa traída de MySQL usando .find()
      const prodElegido = productosActivos.find(function(p) {
        return p.nombre === tituloBoton;
      });

      if (prodElegido) {
        let carrito = JSON.parse(localStorage.getItem('utp_cart')) || [];
        const id = prodElegido.id;
        
        // Comprobar si el producto ya está en el carrito usando .find()
        const itemExistente = carrito.find(function(item) {
          return item.id === id;
        });
        
        if (itemExistente) {
          itemExistente.cantidad = parseInt(itemExistente.cantidad || 1) + 1;
        } else {
          carrito.push({
            id: prodElegido.id,
            nombre: prodElegido.nombre,
            precio: parseFloat(prodElegido.precio),
            imagen: prodElegido.imagen,
            vendedor: prodElegido.vendedor,
            cantidad: 1
          });
        }
        
        localStorage.setItem('utp_cart', JSON.stringify(carrito));
        alert('"' + prodElegido.nombre + '" fue agregado al carrito.');
      }
    }
  });

  // 2. CARGA DINÁMICA Y FILTRADO (catalog.html) 
  const productGrid = document.getElementById('product-grid');
  if (productGrid) {
    const buscador = document.getElementById('search-input');
    const botonesFiltro = document.querySelectorAll('.filter-pill');
    let categoriaActiva = 'todos';
    let textoBusqueda = '';

    // Renderizar tarjetas del catálogo dinámicamente (solo Imagen, Nombre, Categoría y Precio)
    function renderizarCatalogo(lista) {
      productGrid.innerHTML = '';
      lista.forEach(function(p) {
        const card = document.createElement('div');
        card.className = 'product-card fade-in-on-load';
        card.setAttribute('data-category', p.categoria);
        
        let claseBadge = 'badge-new';
        if (p.estado === 'Usado') claseBadge = 'badge-used';
        if (p.estado === 'Servicio') claseBadge = 'badge-service';
        
        card.innerHTML = `
          <span class="product-badge ${claseBadge}">${p.estado}</span>
          <div class="product-image-wrapper">
            <img src="${p.imagen}" alt="${p.nombre}">
          </div>
          <div class="product-info">
            <span class="product-category">${p.categoria}</span>
            <h3 class="product-title">
              <a href="detail.html?id=${p.id}">${p.nombre}</a>
            </h3>
            <div class="product-meta-row mb-3">
              <div class="product-price"><span>S/</span>${parseFloat(p.precio).toFixed(2)}</div>
            </div>
            <div class="product-actions">
              <a href="detail.html?id=${p.id}" class="btn-utp-outline flex-grow-1 text-center py-2">Detalles</a>
              <button class="btn-utp px-3 py-2 btn-add-cart" data-title="${p.nombre}" data-id="${p.id}">Añadir</button>
            </div>
          </div>
        `;
        productGrid.appendChild(card);
      });
    }

    // Filtrar catálogo por caja de búsqueda y pills de categorías
    function filtrarProductos() {
      const tarjetas = document.querySelectorAll('.product-card');
      tarjetas.forEach(function(tarjeta) {
        const titulo = tarjeta.querySelector('.product-title').innerText.toLowerCase();
        const categoria = tarjeta.getAttribute('data-category').toLowerCase();

        const coincideCategoria = (categoriaActiva === 'todos') || (categoria === categoriaActiva);
        const coincideTexto = titulo.includes(textoBusqueda);

        tarjeta.style.display = (coincideCategoria && coincideTexto) ? 'flex' : 'none';
      });
    }

    // Configurar botones de categorías
    botonesFiltro.forEach(function(boton) {
      boton.onclick = function() {
        botonesFiltro.forEach(function(b) { b.classList.remove('active'); });
        boton.classList.add('active');
        categoriaActiva = boton.getAttribute('data-category').toLowerCase();
        filtrarProductos();
      };
    });

    // Configurar caja de búsqueda
    if (buscador) {
      buscador.oninput = function(e) {
        textoBusqueda = e.target.value.toLowerCase().trim();
        filtrarProductos();
      };
    }

    // Cargar productos directamente desde MySQL
    fetch('/api/productos')
      .then(function(res) { return res.json(); })
      .then(function(productos) {
        productosActivos = productos; // Sincronizar lista global
        renderizarCatalogo(productos);
      })
      .catch(function(err) {
        productGrid.innerHTML = '<h4 class="text-center py-5 text-muted">Error al cargar productos de MySQL. ¿Encendiste server.js?</h4>';
      });
  }

  // 3. DETALLE DE PRODUCTO DESDE MYSQL (detail.html)
  const contenedorDetalle = document.getElementById('product-detail-container');
  if (contenedorDetalle) {
    const parametros = new URLSearchParams(window.location.search);
    const idUrl = parseInt(parametros.get('id')) || 1;
    
    // Obtener detalles del producto desde la API de MySQL (Información completa)
    fetch('/api/productos/' + idUrl)
      .then(function(res) {
        if (!res.ok) throw new Error('Producto no encontrado');
        return res.json();
      })
      .then(function(p) {
        productosActivos = [p];

        document.getElementById('detail-img').src = p.imagen;
        document.getElementById('detail-title').innerText = p.nombre;
        document.getElementById('detail-category').innerText = p.categoria;
        document.getElementById('detail-price').innerText = parseFloat(p.precio).toFixed(2);
        document.getElementById('detail-condition').innerText = p.estado;
        document.getElementById('detail-description').innerText = p.descripcion;
        document.getElementById('detail-seller').innerText = p.vendedor;
        document.getElementById('detail-contact').innerText = p.correo;
        
        const badge = document.getElementById('detail-condition-badge');
        let claseBadge = 'badge-new';
        if (p.estado === 'Usado') claseBadge = 'badge-used';
        if (p.estado === 'Servicio') claseBadge = 'badge-service';
        badge.className = 'product-badge ' + claseBadge;

        const botonDetalleComprar = document.getElementById('detail-add-btn');
        if (botonDetalleComprar) {
          botonDetalleComprar.setAttribute('data-title', p.nombre);
          botonDetalleComprar.setAttribute('data-id', p.id);
        }
      })
      .catch(function(err) {
        contenedorDetalle.innerHTML = '<h3 class="text-center py-5 text-muted">Error: No se pudo conectar con el servidor MySQL.</h3>';
      });
  }

  // 4. GESTIÓN DEL CARRITO (cart.html)
  const tablaCarrito = document.getElementById('cart-table-body');
  if (tablaCarrito) {
    
    function dibujarCarrito() {
      const carrito = JSON.parse(localStorage.getItem('utp_cart')) || [];
      const mensajeVacio = document.getElementById('empty-cart-message');
      const resumenCompra = document.getElementById('cart-summary-box');

      if (carrito.length === 0) {
        if (mensajeVacio) mensajeVacio.style.display = 'block';
        if (resumenCompra) resumenCompra.style.display = 'none';
        tablaCarrito.innerHTML = '';
        return;
      }

      if (mensajeVacio) mensajeVacio.style.display = 'none';
      if (resumenCompra) resumenCompra.style.display = 'flex';

      tablaCarrito.innerHTML = '';
      let subtotal = 0;

      carrito.forEach(function(item, index) {
        const totalFila = item.precio * item.cantidad;
        subtotal += totalFila;

        const fila = document.createElement('tr');
        fila.innerHTML = `
          <td>
            <div class="cart-item-info">
              <img src="${item.imagen}" class="cart-item-img">
              <div>
                <h5 class="fw-bold mb-1" style="font-size: 0.95rem;">${item.nombre}</h5>
                <span class="text-muted small">Por: ${item.vendedor}</span>
              </div>
            </div>
          </td>
          <td class="align-middle">S/ ${parseFloat(item.precio).toFixed(2)}</td>
          <td class="align-middle">
            <button class="btn btn-sm btn-light border py-0 px-2 btn-restar" data-index="${index}">-</button>
            <span class="mx-2">${item.cantidad}</span>
            <button class="btn btn-sm btn-light border py-0 px-2 btn-sumar" data-index="${index}">+</button>
          </td>
          <td class="align-middle fw-bold">S/ ${totalFila.toFixed(2)}</td>
          <td class="align-middle text-center">
            <button class="btn text-danger border-0 bg-transparent fw-bold btn-borrar" data-index="${index}">X</button>
          </td>
        `;
        tablaCarrito.appendChild(fila);
      });

      document.getElementById('summary-subtotal').innerText = 'S/ ' + subtotal.toFixed(2);
      document.getElementById('summary-total').innerText = 'S/ ' + subtotal.toFixed(2);
    }

    // Escuchar cambios de cantidad y eliminación en el carrito
    tablaCarrito.onclick = function(e) {
      const boton = e.target;
      const index = parseInt(boton.getAttribute('data-index'));
      
      if (isNaN(index)) return;

      let carrito = JSON.parse(localStorage.getItem('utp_cart')) || [];

      if (boton.classList.contains('btn-sumar')) {
        carrito[index].cantidad = parseInt(carrito[index].cantidad || 1) + 1;
      } else if (boton.classList.contains('btn-restar')) {
        carrito[index].cantidad = parseInt(carrito[index].cantidad || 1) - 1;
        if (carrito[index].cantidad <= 0) {
          carrito.splice(index, 1);
        }
      } else if (boton.classList.contains('btn-borrar')) {
        carrito.splice(index, 1);
      } else {
        return; 
      }

      localStorage.setItem('utp_cart', JSON.stringify(carrito));
      dibujarCarrito();
    };

    // Botón de Checkout en carrito (Solo alerta y limpia carrito temporal)
    const btnCheckout = document.getElementById('btn-checkout');
    if (btnCheckout) {
      btnCheckout.onclick = function() {
        alert("¡Compra finalizada con éxito!");
        localStorage.removeItem('utp_cart');
        window.location.reload();
      };
    }

    dibujarCarrito();
  }

  // 5. PANEL DE ADMINISTRADOR (admin.html)
  const tablaAdmin = document.getElementById('admin-table-body');
  const formAdmin = document.getElementById('admin-add-product-form');

  if (tablaAdmin) {
    function cargarProductosAdmin() {
      fetch('/api/productos')
        .then(function(r) { return r.json(); })
        .then(function(productos) {
          productosActivos = productos; // Sincronizar lista global
          tablaAdmin.innerHTML = '';
          
          productos.forEach(function(p) {
            const row = document.createElement('tr');
            row.innerHTML = `
              <td>${p.id}</td>
              <td><img src="${p.imagen}" class="cart-item-img" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;"></td>
              <td class="fw-bold">${p.nombre}</td>
              <td>S/ ${parseFloat(p.precio).toFixed(2)}</td>
              <td class="text-center">
                <button class="btn btn-sm btn-danger px-3 py-1 btn-eliminar-admin" data-id="${p.id}">Eliminar</button>
              </td>
            `;
            tablaAdmin.appendChild(row);
          });
        })
        .catch(function(err) {
          tablaAdmin.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Error al conectar con MySQL.</td></tr>';
        });
    }

    // Escuchar borrado de productos
    tablaAdmin.onclick = function(e) {
      if (e.target.classList.contains('btn-eliminar-admin')) {
        const id = e.target.getAttribute('data-id');
        if (confirm('¿Estás seguro de eliminar este producto de la base de datos MySQL?')) {
          fetch('/api/productos/' + id, { method: 'DELETE' })
            .then(function(r) { return r.json(); })
            .then(function(data) {
              alert(data.message || 'Eliminado correctamente');
              cargarProductosAdmin();
            })
            .catch(function(err) {
              alert('Error al conectar con el servidor.');
            });
        }
      }
    };

    // Escuchar envío del formulario de creación
    if (formAdmin) {
      formAdmin.onsubmit = function(e) {
        e.preventDefault();
        
        const nuevoProducto = {
          nombre: document.getElementById('prod-name').value,
          precio: parseFloat(document.getElementById('prod-price').value),
          categoria: document.getElementById('prod-category').value,
          estado: document.getElementById('prod-condition').value,
          imagen: document.getElementById('prod-image').value || 'https://placehold.co/600x450/e2e8f0/1e293b?text=UTP+Marketplace',
          vendedor: document.getElementById('prod-seller').value,
          correo: document.getElementById('prod-email').value,
          descripcion: document.getElementById('prod-desc').value
        };

        fetch('/api/productos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(nuevoProducto)
        })
        .then(function(r) {
          if (!r.ok) throw new Error('Error al registrar');
          return r.json();
        })
        .then(function(data) {
          alert(data.message);
          formAdmin.reset();
          cargarProductosAdmin();
        })
        .catch(function(err) {
          alert('No se pudo guardar el producto en MySQL.');
        });
      };
    }

    cargarProductosAdmin();
  }
};
