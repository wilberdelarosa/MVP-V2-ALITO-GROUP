document.addEventListener("DOMContentLoaded", () => {
  // Preloader
  const preloader = document.querySelector('.preloader');
  
  window.addEventListener('load', () => {
    setTimeout(() => {
      preloader.classList.add('fade-out');
      document.body.style.overflow = 'visible';
      
      // Iniciar animaciones después de que el preloader desaparezca
      iniciarAnimaciones();
    }, 1000);
  });
  
  // Cursor personalizado
  const cursor = document.querySelector('.cursor-punto');
  const cursorOutline = document.querySelector('.cursor-dot-outline');
  
  document.addEventListener('mousemove', (e) => {
    const posX = e.clientX;
    const posY = e.clientY;
    
    cursor.style.left = `${posX}px`;
    cursor.style.top = `${posY}px`;
    
    // Añadir un pequeño retraso al outline para un efecto más suave
    setTimeout(() => {
      cursorOutline.style.left = `${posX}px`;
      cursorOutline.style.top = `${posY}px`;
    }, 50);
  });
  
  // Efecto hover en elementos interactivos
  const elementosInteractivos = document.querySelectorAll('a, button, .tarjeta-servicio, .tarjeta-material');
  
  elementosInteractivos.forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursorOutline.style.width = '60px';
      cursorOutline.style.height = '60px';
      cursor.style.width = '12px';
      cursor.style.height = '12px';
    });
    
    el.addEventListener('mouseleave', () => {
      cursorOutline.style.width = '40px';
      cursorOutline.style.height = '40px';
      cursor.style.width = '8px';
      cursor.style.height = '8px';
    });
  });
  
  // Toggle del menú móvil
  const menuToggle = document.querySelector(".menu-toggle");
  const navEnlaces = document.querySelector(".nav-enlaces");

  menuToggle.addEventListener("click", function () {
    this.classList.toggle("active");
    navEnlaces.classList.toggle("active");
    document.body.classList.toggle('menu-open');
  });

  // Scroll suave para enlaces ancla y cierre del menú móvil si está activo
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        // Calcular la posición considerando el header fijo
        const headerHeight = document.querySelector('header').offsetHeight;
        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;
        
        window.scrollTo({
          top: targetPosition,
          behavior: "smooth"
        });
      }
      // Cerrar menú móvil si está abierto
      if (navEnlaces.classList.contains("active")) {
        navEnlaces.classList.remove("active");
        menuToggle.classList.remove("active");
        document.body.classList.remove('menu-open');
      }
    });
  });
  
  // Menú lateral flotante
  const menuLateral = document.querySelector('.menu-lateral');
  const menuLateralEnlaces = document.querySelectorAll('.menu-lateral-enlace');
  const secciones = document.querySelectorAll('section');
  
  // Función para verificar qué sección está visible
  function verificarSecciones() {
    const scrollPosition = window.scrollY;
    
    // Mostrar/ocultar menú lateral según la posición de scroll
    if (scrollPosition > window.innerHeight / 2) {
      menuLateral.classList.add('visible');
    } else {
      menuLateral.classList.remove('visible');
    }
    
    // Resaltar el enlace activo según la sección visible
    secciones.forEach(seccion => {
      const seccionTop = seccion.offsetTop - 100;
      const seccionHeight = seccion.offsetHeight;
      const seccionId = seccion.getAttribute('id');
      
      if (scrollPosition >= seccionTop && scrollPosition < seccionTop + seccionHeight) {
        // Quitar clase activa de todos los enlaces
        menuLateralEnlaces.forEach(enlace => {
          enlace.classList.remove('active');
        });
        
        // Añadir clase activa al enlace correspondiente
        const enlaceActivo = document.querySelector(`.menu-lateral-enlace[data-seccion="${seccionId}"]`);
        if (enlaceActivo) {
          enlaceActivo.classList.add('active');
        }
      }
    });
  }

  // Seguimiento de scroll para animar el header de forma cíclica
  const header = document.querySelector("header");
  let lastScrollPos = window.scrollY;

  window.addEventListener("scroll", () => {
    const currentScroll = window.scrollY;
    // Si se ha pasado de 50px, se añade la clase "scrolled"
    if (currentScroll > 50) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
    
    // Detectar dirección del scroll
    if (currentScroll > lastScrollPos && currentScroll > 300) {
      // Scroll hacia abajo - ocultar header
      header.classList.add("animate-down");
      header.classList.remove("animate-up");
    } else {
      // Scroll hacia arriba - mostrar header
      header.classList.remove("animate-down");
      header.classList.add("animate-up");
    }
    
    lastScrollPos = currentScroll;
    
    // Mostrar/ocultar botón "Volver arriba"
    const volverArriba = document.getElementById("volver-arriba");
    if (currentScroll > 300) {
      volverArriba.classList.add("visible");
    } else {
      volverArriba.classList.remove("visible");
    }
    
    // Activar animaciones al hacer scroll
    revelarElementos();
    
    // Verificar secciones visibles para el menú lateral
    verificarSecciones();
  });

  // Botón "Volver arriba"
  const volverArriba = document.getElementById("volver-arriba");

  volverArriba.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // Animación de elementos al aparecer en pantalla
  function revelarElementos() {
    const elementos = document.querySelectorAll('.reveal-elemento');
    const windowHeight = window.innerHeight;
    
    elementos.forEach((el) => {
      const elementTop = el.getBoundingClientRect().top;
      const elementVisible = 150;
      
      if (elementTop < windowHeight - elementVisible) {
        el.classList.add('active');
      }
    });
  }
  
  // Inicializar animaciones
  function iniciarAnimaciones() {
    // Animación de texto dividido en el hero
    const heroTitle = document.querySelector('.texto-dividido');
    if (heroTitle) {
      const texto = heroTitle.textContent;
      heroTitle.textContent = '';
      heroTitle.style.opacity = 1;
      
      for (let i = 0; i < texto.length; i++) {
        const char = document.createElement('span');
        char.className = 'char';
        char.style.animationDelay = `${i * 0.03}s`;
        char.textContent = texto[i] === ' ' ? '\u00A0' : texto[i];
        heroTitle.appendChild(char);
        
        // Aplicar la animación después de un pequeño retraso
        setTimeout(() => {
          char.style.opacity = 1;
          char.style.transform = 'translateY(0)';
        }, 500 + i * 30);
      }
    }
    
    // Activar animaciones iniciales
    revelarElementos();
    
    // Crear partículas para el hero
    crearParticulas();
    
    // Verificar secciones visibles para el menú lateral
    verificarSecciones();
  }
  
  // Crear partículas para el hero
  function crearParticulas() {
    const contenedorParticulas = document.querySelector('.hero-particulas');
    if (!contenedorParticulas) return;
    
    for (let i = 0; i < 50; i++) {
      const particula = document.createElement('div');
      particula.className = 'particula';
      
      // Posición aleatoria
      const posX = Math.random() * 100;
      const posY = Math.random() * 100;
      
      // Tamaño aleatorio
      const size = Math.random() * 5 + 1;
      
      // Velocidad aleatoria
      const speedX = (Math.random() - 0.5) * 2;
      const speedY = (Math.random() - 0.5) * 2;
      
      // Aplicar estilos
      particula.style.cssText = `
        position: absolute;
        top: ${posY}%;
        left: ${posX}%;
        width: ${size}px;
        height: ${size}px;
        background-color: rgba(242, 196, 70, ${Math.random() * 0.5 + 0.2});
        border-radius: 50%;
        pointer-events: none;
        opacity: ${Math.random() * 0.8 + 0.2};
        animation: float ${Math.random() * 10 + 5}s infinite linear;
      `;
      
      // Añadir al contenedor
      contenedorParticulas.appendChild(particula);
      
      // Animar la partícula
      animarParticula(particula, posX, posY, speedX, speedY);
    }
  }
  
  function animarParticula(particula, posX, posY, speedX, speedY) {
    let x = posX;
    let y = posY;
    
    function update() {
      x += speedX * 0.1;
      y += speedY * 0.1;
      
      // Mantener las partículas dentro del contenedor
      if (x > 100) x = 0;
      if (x < 0) x = 100;
      if (y > 100) y = 0;
      if (y < 0) y = 100;
      
      particula.style.left = `${x}%`;
      particula.style.top = `${y}%`;
      
      requestAnimationFrame(update);
    }
    
    update();
  }
  
  // Manejar envío del formulario
  const formularioContacto = document.getElementById('formulario-contacto');
  const mensajeExitoFormulario = document.querySelector('.mensaje-exito-formulario');
  
  if (formularioContacto) {
    formularioContacto.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Mostrar estado de carga
      const botonEnviar = formularioContacto.querySelector('.boton-enviar');
      botonEnviar.classList.add('loading');
      
      // Simular envío (reemplazar con tu lógica real de envío)
      setTimeout(() => {
        // Ocultar formulario y mostrar mensaje de éxito
        formularioContacto.style.height = formularioContacto.offsetHeight + 'px';
        
        Array.from(formularioContacto.elements).forEach(input => {
          if (input !== botonEnviar) {
            input.style.display = 'none';
          }
        });
        
        formularioContacto.querySelector('.encabezado-formulario').style.display = 'none';
        botonEnviar.style.display = 'none';
        
        // Mostrar mensaje de éxito
        mensajeExitoFormulario.classList.add('active');
        
        // Reiniciar formulario después de 5 segundos
        setTimeout(() => {
          // Restablecer el formulario
          formularioContacto.reset();
          
          // Mostrar todos los elementos del formulario nuevamente
          Array.from(formularioContacto.elements).forEach(input => {
            input.style.display = '';
          });
          
          formularioContacto.querySelector('.encabezado-formulario').style.display = '';
          botonEnviar.style.display = '';
          botonEnviar.classList.remove('loading');
          
          // Ocultar mensaje de éxito
          mensajeExitoFormulario.classList.remove('active');
          
          // Restablecer la altura del formulario
          formularioContacto.style.height = '';
        }, 5000);
      }, 2000);
    });
  }
});