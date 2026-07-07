// 1. Lista de productos (Base de datos simulada en español)
const PRODUCTOS = [
  {
    id: 1,
    nombre: "Calculadora Científica Casio FX-991LA Plus",
    precio: 120.00,
    categoria: "Tecnología",
    imagen: "images/casio.jpg",
    estado: "Como nuevo",
    vendedor: "Carlos Mendoza",
    correo: "carlos.mendoza@utp.edu.pe",
    descripcion: "Calculadora científica en excelente estado con 417 funciones, ideal para ingeniería y ciencias."
  },
  {
    id: 2,
    nombre: "Libro de Cálculo de Una Variable - Thomas",
    precio: 85.00,
    categoria: "Libros",
    imagen: "images/libro.jpg",
    estado: "Usado",
    vendedor: "Andrea Flores",
    correo: "andrea.flores@utp.edu.pe",
    descripcion: "14ª edición del libro de Thomas. Completo, forrado y en muy buen estado general."
  },
  {
    id: 3,
    nombre: "Asesorías Personalizadas - Física I y II",
    precio: 20.00,
    categoria: "Servicios",
    imagen: "images/asesoria.jpg",
    estado: "Servicio",
    vendedor: "Miguel Soto",
    correo: "miguel.soto@utp.edu.pe",
    descripcion: "Resolución de exámenes pasados, asesorías virtuales o presenciales preparatorias."
  },
  {
    id: 4,
    nombre: "Bata de Laboratorio UTP - Talla M",
    precio: 35.00,
    categoria: "Otros",
    imagen: "images/bata.jpg",
    estado: "Como nuevo",
    vendedor: "Juan Pérez",
    correo: "juan.perez@utp.edu.pe",
    descripcion: "Bata manga larga blanca de algodón con logo bordado. Solo fue usada dos veces."
  }
];

window.onload = function() {

  // 2. AÑADIR PRODUCTOS AL CARRITO
  const botonesComprar = document.querySelectorAll('.btn-add-cart');
  botonesComprar.forEach(function(boton) {
    boton.onclick = function(evento) {
      evento.preventDefault();
      
      const tituloBoton = boton.getAttribute('data-title');
      
      // Buscar el producto en la lista
      let prodElegido = null;
      for (let i = 0; i < PRODUCTOS.length; i++) {
        if (PRODUCTOS[i].nombre === tituloBoton) {
          prodElegido = PRODUCTOS[i];
          break;
        }
      }

      if (prodElegido) {
        let carrito = JSON.parse(localStorage.getItem('utp_cart')) || [];
        const id = prodElegido.id;
        
        // Ver si ya existe en el carrito
        let encontrado = false;
        for (let j = 0; j < carrito.length; j++) {
          if (carrito[j].id === id) {
            const qty = parseInt(carrito[j].cantidad || carrito[j].quantity || 1);
            carrito[j].cantidad = qty + 1;
            delete carrito[j].quantity; // Normalizar a español
            encontrado = true;
            break;
          }
        }
        
        // Si es nuevo, agregarlo
        if (!encontrado) {
          carrito.push({
            id: prodElegido.id,
            nombre: prodElegido.nombre,
            precio: prodElegido.precio,
            imagen: prodElegido.imagen,
            vendedor: prodElegido.vendedor,
            cantidad: 1
          });
        }
        
        localStorage.setItem('utp_cart', JSON.stringify(carrito));
        alert('"' + prodElegido.nombre + '" fue agregado al carrito.');
      }
    };
  });

  //3. BÚSQUEDA Y FILTRADO (catalog.html)
  const buscador = document.getElementById('search-input');
  const botonesFiltro = document.querySelectorAll('.filter-pill');
  const tarjetas = document.querySelectorAll('.product-card');

  if (tarjetas.length > 0) {
    let categoriaActiva = 'todos';
    let textoBusqueda = '';

    function filtrarProductos() {
      tarjetas.forEach(function(tarjeta) {
        const titulo = tarjeta.querySelector('.product-title').innerText.toLowerCase();
        const descripcion = tarjeta.querySelector('.product-description').innerText.toLowerCase();
        const categoria = tarjeta.getAttribute('data-category').toLowerCase();

        const coincideCategoria = (categoriaActiva === 'todos') || (categoria === categoriaActiva);
        const coincideTexto = titulo.includes(textoBusqueda) || descripcion.includes(textoBusqueda);

        if (coincideCategoria && coincideTexto) {
          tarjeta.style.display = 'flex';
        } else {
          tarjeta.style.display = 'none';
        }
      });
    }

    // Configurar los botones de filtros
    botonesFiltro.forEach(function(boton) {
      boton.onclick = function() {
        botonesFiltro.forEach(function(b) { b.classList.remove('active'); });
        boton.classList.add('active');
        categoriaActiva = boton.getAttribute('data-category').toLowerCase();
        filtrarProductos();
      };
    });

    // caja de texto del buscador
    if (buscador) {
      buscador.oninput = function(e) {
        textoBusqueda = e.target.value.toLowerCase().trim();
        filtrarProductos();
      };
    }
  }

  // 4. CARGAR DETALLE DE PRODUCTO (detail.html)
  const contenedorDetalle = document.getElementById('product-detail-container');
  if (contenedorDetalle) {
    const parametros = new URLSearchParams(window.location.search);
    const idUrl = parseInt(parametros.get('id')) || 1;
    
    // Buscar el producto
    let p = null;
    for (let i = 0; i < PRODUCTOS.length; i++) {
      if (PRODUCTOS[i].id === idUrl) {
        p = PRODUCTOS[i];
        break;
      }
    }

    if (p) {
      document.getElementById('detail-img').src = p.imagen;
      document.getElementById('detail-title').innerText = p.nombre;
      document.getElementById('detail-category').innerText = p.categoria;
      document.getElementById('detail-price').innerText = p.precio.toFixed(2);
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
      }
    }
  }

  // 5. GESTIÓN DEL CARRITO (cart.html)
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
        // Soporte robusto y unificado para claves en español o inglés antiguas
        const nombre = item.nombre || item.title || "Producto";
        const precio = parseFloat(item.precio || item.price || 0);
        const imagen = item.imagen || item.image || "images/default.jpg";
        const vendedor = item.vendedor || item.seller || "Vendedor UTP";
        const cantidad = parseInt(item.cantidad || item.quantity || 1);

        const totalFila = precio * cantidad;
        subtotal += totalFila;

        const fila = document.createElement('tr');
        fila.innerHTML = `
          <td>
            <div class="cart-item-info">
              <img src="${imagen}" class="cart-item-img">
              <div>
                <h5 class="fw-bold mb-1" style="font-size: 0.95rem;">${nombre}</h5>
                <span class="text-muted small">Por: ${vendedor}</span>
              </div>
            </div>
          </td>
          <td class="align-middle">S/ ${precio.toFixed(2)}</td>
          <td class="align-middle">
            <button class="btn btn-sm btn-light border py-0 px-2 btn-restar" data-index="${index}">-</button>
            <span class="mx-2">${cantidad}</span>
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

    // eventos para la tabla del carrito 
    tablaCarrito.onclick = function(e) {
      const boton = e.target;
      const index = parseInt(boton.getAttribute('data-index'));
      
      if (isNaN(index)) return;

      let carrito = JSON.parse(localStorage.getItem('utp_cart')) || [];
      
      // Normalizar cantidades y claves
      const qtyCurrent = parseInt(carrito[index].cantidad || carrito[index].quantity || 1);
      carrito[index].cantidad = qtyCurrent;
      delete carrito[index].quantity; 

      if (boton.classList.contains('btn-sumar')) {
        carrito[index].cantidad += 1;
      } else if (boton.classList.contains('btn-restar')) {
        carrito[index].cantidad -= 1;
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

    dibujarCarrito();
  }
};

