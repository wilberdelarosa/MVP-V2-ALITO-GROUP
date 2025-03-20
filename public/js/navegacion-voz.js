document.addEventListener("DOMContentLoaded", () => {
  // Main elements
  const botonVoz = document.getElementById("boton-nav-voz");
  const estadoVoz = document.getElementById("estado-voz");
  const menuLateralEnlaces = document.querySelectorAll('.menu-lateral-enlace');
  
  // Create a help modal dynamically if it doesn't exist
  let modalAyuda = document.getElementById("modal-ayuda");
  if (!modalAyuda) {
    modalAyuda = document.createElement("div");
    modalAyuda.id = "modal-ayuda";
    modalAyuda.className = "modal";
    modalAyuda.innerHTML = `
      <div class="modal-contenido">
        <div class="modal-header">
          <h2>Comandos de voz disponibles</h2>
          <span class="cerrar-ayuda">&times;</span>
        </div>
        <div class="modal-body">
          <ul>
            <li><strong>Inicio, Quiénes somos, Servicios, Materiales, Contacto</strong>: Navega a las secciones</li>
            <li><strong>Leer sección</strong>: Lee el contenido de la sección actual</li>
            <li><strong>Leer inicio, Leer quiénes somos, etc.</strong>: Lee el contenido de una sección específica</li>
            <li><strong>Parar lectura</strong>: Detiene la lectura en curso</li>
            <li><strong>Ayuda</strong>: Muestra este panel de ayuda</li>
            <li><strong>Cerrar indicaciones</strong>: Cierra este panel de ayuda</li>
            <li><strong>Cerrar</strong>: Desactiva el reconocimiento de voz</li>
            <li><strong>Ir atrás, Retroceder</strong>: Navega a la sección anterior</li>
            <li><strong>Avanzar</strong>: Navega a la sección siguiente</li>
            <li><strong>Volver</strong>: Vuelve al inicio de la página</li>
          </ul>
        </div>
      </div>
    `;
    document.body.appendChild(modalAyuda);
    
    // Add event to close the help modal
    const cerrarAyuda = modalAyuda.querySelector(".cerrar-ayuda");
    cerrarAyuda.addEventListener("click", () => {
      modalAyuda.style.display = "none";
    });
  }

  const reconocimiento = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  reconocimiento.lang = "es-ES";
  reconocimiento.interimResults = false;
  reconocimiento.maxAlternatives = 1;
  reconocimiento.continuous = true;

  const sintesis = window.speechSynthesis;

  let activo = false;
  let escuchando = false;
  let comandoProcesandose = false;
  let ultimoComando = '';
  let ultimoTiempoComando = 0;
  let ultimaAccion = '';
  let ultimoTiempoAccion = 0;
  let tiempoEspera;
  let seccionActual = 0;
  let leyendo = false;

  // Function to normalize strings (remove accents)
  function normalizarTexto(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  }

  // When clicking the main voice button
  botonVoz.addEventListener("click", () => {
    if (!activo) {
      activarReconocimiento();
    } else {
      desactivarReconocimiento();
    }
  });

  function activarReconocimiento() {
    activo = true;
    iniciarReconocimientoVoz();
    botonVoz.classList.add("activo");
    document.querySelector('.controles-voz').classList.add('activo');
  }

  function desactivarReconocimiento() {
    activo = false;
    detenerReconocimientoVoz();
    pararLectura();
    botonVoz.classList.remove("activo", "escuchando", "ejecutando", "detectando");
    document.querySelector('.controles-voz').classList.remove('activo');
    estadoVoz.textContent = "";
  }

  function iniciarReconocimientoVoz() {
    if (!escuchando && activo) {
      try {
        reconocimiento.start();
        escuchando = true;
        
        // Only show message if not in the middle of another process
        if (!comandoProcesandose && !leyendo) {
          estadoVoz.textContent = "Escuchando... Diga un comando";
        }
        
        botonVoz.classList.add("escuchando");
        botonVoz.classList.remove("detectando", "ejecutando");
      } catch (error) {
        console.error("Error al iniciar reconocimiento:", error);
        setTimeout(() => iniciarReconocimientoVoz(), 300);
      }
    }
  }

  function detenerReconocimientoVoz() {
    try {
      reconocimiento.stop();
    } catch (error) {
      console.error("Error al detener reconocimiento:", error);
    }
    escuchando = false;
    botonVoz.classList.remove("escuchando");
    clearTimeout(tiempoEspera);
  }

  // Define and collect all sections for navigation
  function obtenerSecciones() {
    const seccionesList = ["inicio", "quienes-somos", "servicios", "materiales", "contacto"];
    let secciones = [];
    
    seccionesList.forEach(id => {
      const elemento = document.querySelector(`#${id}`);
      if (elemento) {
        secciones.push({
          id: id,
          element: elemento,
          nombre: id.replace(/-/g, ' ')
        });
      }
    });
    
    return secciones;
  }
  
  // Get all available sections
  const secciones = obtenerSecciones();

  // Get current visible section
  function obtenerSeccionActual() {
    const headerHeight = document.querySelector('header')?.offsetHeight || 0;
    let seccionActualIndex = 0;
    let menorDistancia = Infinity;
    
    secciones.forEach((seccion, index) => {
      const rect = seccion.element.getBoundingClientRect();
      const distancia = Math.abs(rect.top - headerHeight);
      
      if (distancia < menorDistancia) {
        menorDistancia = distancia;
        seccionActualIndex = index;
      }
    });
    
    return seccionActualIndex;
  }

  // Navigate to the specified section by index
  function navegarASeccion(index) {
    if (index >= 0 && index < secciones.length) {
      const seccion = secciones[index];
      seccionActual = index;
      
      // Update sidebar menu if exists
      menuLateralEnlaces.forEach(enlace => enlace.classList.remove('active'));
      const enlaceActivo = document.querySelector(`.menu-lateral-enlace[data-seccion="${seccion.id}"]`);
      if (enlaceActivo) {
        enlaceActivo.classList.add('active');
      }

      // Navigation with offset for the header
      const headerHeight = document.querySelector('header')?.offsetHeight || 0;
      const targetPosition = seccion.element.getBoundingClientRect().top + window.pageYOffset - headerHeight;
      
      window.scrollTo({
        top: targetPosition,
        behavior: "smooth"
      });
      
      return seccion.nombre;
    }
    return null;
  }

  // Extract readable text from a section
  function obtenerTextoSeccion(index) {
    if (index >= 0 && index < secciones.length) {
      const seccion = secciones[index];
      const elemento = seccion.element;
      
      // Get all headings and paragraphs within the section
      const headings = elemento.querySelectorAll('h1, h2, h3, h4, h5, h6');
      const paragraphs = elemento.querySelectorAll('p');
      const lists = elemento.querySelectorAll('li');
      
      let textoCompleto = `Sección ${seccion.nombre}. `;
      
      // Add headings
      headings.forEach(heading => {
        textoCompleto += heading.textContent.trim() + ". ";
      });
      
      // Add paragraphs
      paragraphs.forEach(paragraph => {
        textoCompleto += paragraph.textContent.trim() + " ";
      });
      
      // Add list items
      if (lists.length > 0) {
        textoCompleto += "La sección contiene una lista con los siguientes elementos: ";
        lists.forEach((item, idx) => {
          textoCompleto += `${idx + 1}, ${item.textContent.trim()}. `;
        });
      }
      
      return textoCompleto;
    }
    return "No se pudo encontrar texto para leer en esta sección.";
  }

  // Read text of a section
  function leerSeccion(index) {
    pararLectura(); // Stop any ongoing reading
    
    const texto = obtenerTextoSeccion(index);
    if (texto) {
      leyendo = true;
      estadoVoz.textContent = `Leyendo sección ${secciones[index].nombre}...`;
      hablarLargo(texto);
      return true;
    }
    
    return false;
  }

  // Stop current reading
  function pararLectura() {
    if (leyendo) {
      sintesis.cancel();
      leyendo = false;
      if (activo) {
        estadoVoz.textContent = "Escuchando... Diga un comando";
      }
    }
  }

  reconocimiento.onresult = (evento) => {
    const comandoTexto = evento.results[evento.results.length - 1][0].transcript.toLowerCase();
    
    // Avoid command repetition in short time window
    const ahora = Date.now();
    if (comandoTexto === ultimoComando && ahora - ultimoTiempoComando < 3000) {
      return; // Ignore repeated commands in a short interval
    }
    
    ultimoComando = comandoTexto;
    ultimoTiempoComando = ahora;
    
    // Check if the text matches any of our exact commands
    const comandoNormalizado = normalizarTexto(comandoTexto);
    let esComandoValido = false;
    
    // Definir comandos exactos que queremos reconocer
    const comandosExactos = [
      "inicio", "quienes somos", "servicios", "materiales", "contacto",
      "leer seccion", "leer inicio", "leer quienes somos", "leer servicios", 
      "leer materiales", "leer contacto", "parar lectura", "detener lectura",
      "ayuda", "cerrar indicaciones", "cerrar", "ir atras", "retroceder",
      "avanzar", "volver"
    ];
    
    // Check if the normalized command contains any of our exact commands
    for (const comando of comandosExactos) {
      if (comandoNormalizado.includes(normalizarTexto(comando))) {
        esComandoValido = true;
        break;
      }
    }
    
    // Special case for "parar lectura" - should be processed immediately
    if (leyendo && (comandoNormalizado.includes("parar lectura") || 
                    comandoNormalizado.includes("detener lectura") ||
                    comandoNormalizado.includes("para lectura"))) {
      pararLectura();
      return;
    }
    
    // Only process if it's a valid command and not already processing
    if (esComandoValido && !comandoProcesandose && activo) {
      comandoProcesandose = true;
      botonVoz.classList.remove("escuchando");
      botonVoz.classList.add("detectando");
      estadoVoz.textContent = "Comando detectado, procesando...";
      mostrarPensando();
      
      clearTimeout(tiempoEspera);
      tiempoEspera = setTimeout(() => {
        procesarComando(comandoNormalizado);
      }, 500); // Reduced time to process faster
    }
  };

  reconocimiento.onend = () => {
    escuchando = false;
    
    // Restart if active
    if (activo) {
      setTimeout(() => {
        iniciarReconocimientoVoz();
      }, 300);
    }
  };

  reconocimiento.onerror = (error) => {
    console.error("Error de reconocimiento:", error);
    
    if (!comandoProcesandose && activo && !leyendo) {
      estadoVoz.textContent = "Escuchando... Diga un comando";
    }
    
    escuchando = false;
    
    // Retry if active
    if (activo) {
      setTimeout(() => {
        iniciarReconocimientoVoz();
      }, 1000);
    }
  };

  function procesarComando(comando) {
    botonVoz.classList.remove("detectando");
    botonVoz.classList.add("ejecutando");
    estadoVoz.textContent = "Procesando comando...";

    // If we're reading and the command isn't to stop reading, ignore it
    if (leyendo && !comando.includes("parar lectura") && !comando.includes("detener lectura")) {
      comandoProcesandose = false;
      return;
    }

    // Define section mapping
    const seccionMap = {
      "inicio": 0,
      "quienes somos": 1,
      "servicios": 2,
      "materiales": 3,
      "contacto": 4
    };

    // Prevent action repetition
    const ahora = Date.now();
    
    let comandoEncontrado = false;
    
    // Check for "leer seccion" command (current section)
    if (comando.includes("leer seccion")) {
      if (ultimaAccion === "leer-seccion" && ahora - ultimoTiempoAccion < 3000) {
        estadoVoz.textContent = "Escuchando... Diga un comando";
        comandoProcesandose = false;
        return;
      }
      
      ultimaAccion = "leer-seccion";
      ultimoTiempoAccion = ahora;
      
      const currentIndex = obtenerSeccionActual();
      if (leerSeccion(currentIndex)) {
        comandoEncontrado = true;
      } else {
        hablar("No se pudo leer la sección actual");
      }
    }
    // Check for specific section reading commands
    else if (comando.includes("leer")) {
      for (const [clave, index] of Object.entries(seccionMap)) {
        if (comando.includes(`leer ${normalizarTexto(clave)}`)) {
          if (ultimaAccion === `leer-${index}` && ahora - ultimoTiempoAccion < 3000) {
            estadoVoz.textContent = "Escuchando... Diga un comando";
            comandoProcesandose = false;
            return;
          }
          
          ultimaAccion = `leer-${index}`;
          ultimoTiempoAccion = ahora;
          
          navegarASeccion(index);
          if (leerSeccion(index)) {
            comandoEncontrado = true;
          } else {
            hablar(`No se pudo leer la sección ${clave}`);
          }
          break;
        }
      }
    }
    // Check for "parar lectura" command
    else if (comando.includes("parar lectura") || comando.includes("detener lectura")) {
      if (ultimaAccion === "parar-lectura" && ahora - ultimoTiempoAccion < 3000) {
        estadoVoz.textContent = "Escuchando... Diga un comando";
        comandoProcesandose = false;
        return;
      }
      
      ultimaAccion = "parar-lectura";
      ultimoTiempoAccion = ahora;
      
      pararLectura();
      hablar("Lectura detenida");
      comandoEncontrado = true;
    }
    // Check for section navigation
    else {
      for (const [clave, index] of Object.entries(seccionMap)) {
        if (comando.includes(normalizarTexto(clave))) {
          comandoEncontrado = true;
          
          // Check if we're trying to perform the same action too quickly
          if (ultimaAccion === `seccion-${index}` && ahora - ultimoTiempoAccion < 3000) {
            estadoVoz.textContent = "Escuchando... Diga un comando";
            comandoProcesandose = false;
            return;
          }
          
          ultimaAccion = `seccion-${index}`;
          ultimoTiempoAccion = ahora;
          
          const nombreSeccion = navegarASeccion(index);
          if (nombreSeccion) {
            hablar(`Navegando a la sección ${nombreSeccion}`);
            estadoVoz.textContent = `Navegando a ${nombreSeccion}`;
          }
          break;
        }
      }
    }

    // Additional commands
    if (!comandoEncontrado) {
      // Get current section for navigation commands
      const currentIndex = obtenerSeccionActual();
      
      if (comando.includes("ayuda")) {
        if (ultimaAccion === "ayuda" && ahora - ultimoTiempoAccion < 3000) {
          estadoVoz.textContent = "Escuchando... Diga un comando";
          comandoProcesandose = false;
          return;
        }
        
        ultimaAccion = "ayuda";
        ultimoTiempoAccion = ahora;
        
        modalAyuda.style.display = "block";
        hablar("Mostrando panel de ayuda con los comandos disponibles");
        comandoEncontrado = true;
      } 
      else if (comando.includes("cerrar indicaciones")) {
        if (ultimaAccion === "cerrar-ayuda" && ahora - ultimoTiempoAccion < 3000) {
          estadoVoz.textContent = "Escuchando... Diga un comando";
          comandoProcesandose = false;
          return;
        }
        
        ultimaAccion = "cerrar-ayuda";
        ultimoTiempoAccion = ahora;
        
        modalAyuda.style.display = "none";
        hablar("Panel de ayuda cerrado");
        comandoEncontrado = true;
      } 
      else if (comando.includes("cerrar")) {
        if (ultimaAccion === "cerrar" && ahora - ultimoTiempoAccion < 3000) {
          estadoVoz.textContent = "Escuchando... Diga un comando";
          comandoProcesandose = false;
          return;
        }
        
        ultimaAccion = "cerrar";
        ultimoTiempoAccion = ahora;
        
        desactivarReconocimiento();
        hablar("Reconocimiento de voz desactivado");
        comandoEncontrado = true;
      } 
      else if (comando.includes("ir atras") || comando.includes("retroceder")) {
        if (ultimaAccion === "retroceder" && ahora - ultimoTiempoAccion < 3000) {
          estadoVoz.textContent = "Escuchando... Diga un comando";
          comandoProcesandose = false;
          return;
        }
        
        ultimaAccion = "retroceder";
        ultimoTiempoAccion = ahora;
        
        // Go to previous section
        if (currentIndex > 0) {
          const nombreSeccion = navegarASeccion(currentIndex - 1);
          if (nombreSeccion) {
            hablar(`Navegando a la sección anterior: ${nombreSeccion}`);
          }
        } else {
          hablar("Ya estás en la primera sección");
        }
        
        comandoEncontrado = true;
      } 
      else if (comando.includes("avanzar")) {
        if (ultimaAccion === "avanzar" && ahora - ultimoTiempoAccion < 3000) {
          estadoVoz.textContent = "Escuchando... Diga un comando";
          comandoProcesandose = false;
          return;
        }
        
        ultimaAccion = "avanzar";
        ultimoTiempoAccion = ahora;
        
        // Go to next section
        if (currentIndex < secciones.length - 1) {
          const nombreSeccion = navegarASeccion(currentIndex + 1);
          if (nombreSeccion) {
            hablar(`Navegando a la sección siguiente: ${nombreSeccion}`);
          }
        } else {
          hablar("Ya estás en la última sección");
        }
        
        comandoEncontrado = true;
      } 
      else if (comando.includes("volver")) {
        if (ultimaAccion === "volver" && ahora - ultimoTiempoAccion < 3000) {
          estadoVoz.textContent = "Escuchando... Diga un comando";
          comandoProcesandose = false;
          return;
        }
        
        ultimaAccion = "volver";
        ultimoTiempoAccion = ahora;
        
        window.scrollTo({ top: 0, behavior: "smooth" });
        hablar("Volviendo al inicio de la página");
        comandoEncontrado = true;
      }
    }

    // If no command was found, just go back to listening without error messages
    if (!comandoEncontrado) {
      estadoVoz.textContent = "Escuchando... Diga un comando";
    }

    // Restart listening after a while, if still active
    setTimeout(() => {
      comandoProcesandose = false;
      if (activo && !leyendo) {
        iniciarReconocimientoVoz();
      }
    }, 1500);
  }

  // Function for short utterances
  function hablar(texto) {
    // Cancel any ongoing synthesis to avoid overlap
    sintesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(texto);
    utterance.lang = "es-ES";
    sintesis.speak(utterance);
    utterance.onend = () => {
      // Only clear if there's no other active process and still active
      if (!comandoProcesandose && activo && !leyendo) {
        estadoVoz.textContent = "Escuchando... Diga un comando";
        botonVoz.classList.remove("ejecutando");
        botonVoz.classList.add("escuchando");
      }
    };
  }
  
  // Function for long reading with progress indication
  function hablarLargo(texto) {
    // Divide long text into chunks to show progress and allow interruption
    const maxChunkLength = 200;
    const chunks = [];
    
    // Split text into manageable chunks
    for (let i = 0; i < texto.length; i += maxChunkLength) {
      chunks.push(texto.slice(i, i + maxChunkLength));
    }
    
    let currentChunk = 0;
    const totalChunks = chunks.length;
    
    function hablarSiguienteChunko() {
      if (currentChunk < totalChunks && leyendo) {
        // Update status with progress
        const progreso = Math.round((currentChunk / totalChunks) * 100);
        estadoVoz.textContent = `Leyendo... ${progreso}%`;
        
        const utterance = new SpeechSynthesisUtterance(chunks[currentChunk]);
        utterance.lang = "es-ES";
        
        utterance.onend = () => {
          currentChunk++;
          if (currentChunk < totalChunks && leyendo) {
            hablarSiguienteChunko();
          } else if (leyendo) {
            // Completed reading all chunks
            leyendo = false;
            if (activo) {
              estadoVoz.textContent = "Escuchando... Diga un comando";
              botonVoz.classList.remove("ejecutando");
              botonVoz.classList.add("escuchando");
            }
          }
        };
        
        sintesis.speak(utterance);
      }
    }
    
    // Start the reading process
    hablarSiguienteChunko();
  }

  function mostrarPensando() {
    estadoVoz.innerHTML = `
      <div class="pensando">
        <span></span>
        <span></span>
        <span></span>
      </div>
      Procesando comando...
    `;
  }

  // If elements of the old tutorial modal exist, reuse them
  const modalTutorial = document.getElementById("modal-tutorial");
  if (modalTutorial) {
    const cerrarModal = document.querySelector(".cerrar");
    const cerrarTutorial = document.getElementById("cerrar-tutorial");
    
    cerrarModal?.addEventListener("click", () => {
      modalTutorial.style.display = "none";
    });

    cerrarTutorial?.addEventListener("click", () => {
      modalTutorial.style.display = "none";
      activarReconocimiento();
    });
    
    // Show tutorial the first time
    modalTutorial.style.display = "block";
  } else {
    // If there's no tutorial, activate directly
    setTimeout(() => {
      activarReconocimiento();
    }, 1000);
  }
});