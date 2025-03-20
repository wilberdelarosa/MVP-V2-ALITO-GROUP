document.addEventListener("DOMContentLoaded", () => {
  // Referencias a elementos del DOM
  const tabLinks = document.querySelectorAll(".tab-link")
  const tabContents = document.querySelectorAll(".tab-content")
  const botonUsuario = document.getElementById("boton-usuario")
  const menuDesplegable = document.getElementById("menu-desplegable")
  const cerrarSesion = document.getElementById("cerrar-sesion")

  // URL base para las peticiones API
  const API_URL = "http://localhost:3000/api"

  // Verificar autenticación y obtener datos del usuario
  function verificarAutenticacion() {
    const token = localStorage.getItem("authToken")
    const usuarioGuardado = localStorage.getItem("usuario")

    if (!token || !usuarioGuardado) {
      window.location.href = "login.html"
      return
    }

    return JSON.parse(usuarioGuardado)
  }

  // Cargar datos del usuario en la interfaz
  function cargarDatosUsuario(usuario) {
    // Elementos del menú de usuario
    document.getElementById("nombre-usuario").textContent = usuario.nombre.split(" ")[0]
    document.getElementById("nombre-completo").textContent = usuario.nombre
    document.getElementById("email-usuario").textContent = usuario.email

    // Elementos del sidebar
    document.getElementById("sidebar-nombre").textContent = usuario.nombre

    // Elementos del perfil
    document.getElementById("perfil-nombre").textContent = usuario.nombre
    document.getElementById("perfil-email").textContent = usuario.email

    // Configurar rol
    const rolTexto = {
      cliente: "Cliente",
      empleado: "Empleado",
      admin: "Administrador",
    }

    document.getElementById("sidebar-rol").textContent = rolTexto[usuario.rol] || "Cliente"
    document.getElementById("perfil-rol").textContent = rolTexto[usuario.rol] || "Cliente"

    // Mostrar elementos según el rol
    mostrarElementosPorRol(usuario.rol)

    // Cargar avatar si existe
    if (usuario.avatar) {
      document.getElementById("avatar-usuario").src = usuario.avatar
      document.getElementById("sidebar-avatar").src = usuario.avatar
    }

    // Cargar fecha de registro
    document.getElementById("perfil-fecha").textContent = "Información no disponible"

    // Cargar datos adicionales desde el servidor
    cargarDatosAdicionales(usuario.id)
  }

  // Mostrar elementos según el rol del usuario
  function mostrarElementosPorRol(rol) {
    const elementosCliente = document.querySelectorAll(".solo-cliente")
    const elementosEmpleado = document.querySelectorAll(".solo-empleado")
    const elementosAdmin = document.querySelectorAll(".solo-admin")

    // Ocultar todos por defecto
    elementosCliente.forEach((el) => (el.style.display = "none"))
    elementosEmpleado.forEach((el) => (el.style.display = "none"))
    elementosAdmin.forEach((el) => (el.style.display = "none"))

    // Mostrar según el rol
    if (rol === "cliente") {
      elementosCliente.forEach((el) => (el.style.display = "block"))
    } else if (rol === "empleado") {
      elementosEmpleado.forEach((el) => (el.style.display = "block"))
    } else if (rol === "admin") {
      elementosAdmin.forEach((el) => (el.style.display = "block"))
      elementosEmpleado.forEach((el) => (el.style.display = "block"))
    }
  }

  // Cargar datos adicionales del usuario desde el servidor
  async function cargarDatosAdicionales(usuarioId) {
    try {
      const token = localStorage.getItem("authToken")

      const response = await fetch(`${API_URL}/usuarios/${usuarioId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Error al cargar datos del usuario")
      }

      const data = await response.json()

      // Actualizar fecha de registro si está disponible
      if (data.fechaRegistro) {
        const fecha = new Date(data.fechaRegistro)
        document.getElementById("perfil-fecha").textContent = fecha.toLocaleDateString("es-ES")
      }
    } catch (error) {
      console.error("Error al cargar datos adicionales:", error)
    }
  }

  // Cargar solicitudes del usuario (solo para clientes)
  async function cargarSolicitudes() {
    try {
      const token = localStorage.getItem("authToken")
      const usuario = JSON.parse(localStorage.getItem("usuario"))

      const response = await fetch(`${API_URL}/solicitudes/usuario/${usuario.id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Error al cargar solicitudes")
      }

      const solicitudes = await response.json()
      const tablaSolicitudes = document.getElementById("tabla-solicitudes")

      if (solicitudes.length === 0) {
        tablaSolicitudes.innerHTML =
          '<tr><td colspan="5" class="texto-centrado">No hay solicitudes registradas</td></tr>'
        return
      }

      let html = ""
      solicitudes.forEach((solicitud) => {
        const fecha = new Date(solicitud.fecha).toLocaleDateString("es-ES")
        const estado = obtenerEstadoHTML(solicitud.estado)

        html += `
          <tr>
            <td>${solicitud.id}</td>
            <td>${solicitud.tipo}</td>
            <td>${fecha}</td>
            <td>${estado}</td>
            <td>
              <button class="boton-accion ver" data-id="${solicitud.id}" title="Ver detalles">
                <i class="fas fa-eye"></i>
              </button>
            </td>
          </tr>
        `
      })

      tablaSolicitudes.innerHTML = html

      // Agregar eventos a los botones de acción
      document.querySelectorAll(".boton-accion.ver").forEach((btn) => {
        btn.addEventListener("click", function () {
          const id = this.getAttribute("data-id")
          verDetalleSolicitud(id)
        })
      })
    } catch (error) {
      console.error("Error al cargar solicitudes:", error)
      const tablaSolicitudes = document.getElementById("tabla-solicitudes")
      tablaSolicitudes.innerHTML = '<tr><td colspan="5" class="texto-centrado">Error al cargar solicitudes</td></tr>'
    }
  }

  // Cargar proyectos (solo para empleados y administradores)
  async function cargarProyectos() {
    try {
      const token = localStorage.getItem("authToken")
      const usuario = JSON.parse(localStorage.getItem("usuario"))

      const response = await fetch(`${API_URL}/proyectos`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Error al cargar proyectos")
      }

      const proyectos = await response.json()
      const tablaProyectos = document.getElementById("tabla-proyectos")

      if (proyectos.length === 0) {
        tablaProyectos.innerHTML = '<tr><td colspan="6" class="texto-centrado">No hay proyectos registrados</td></tr>'
        return
      }

      let html = ""
      proyectos.forEach((proyecto) => {
        const fechaInicio = new Date(proyecto.fechaInicio).toLocaleDateString("es-ES")
        const estado = obtenerEstadoHTML(proyecto.estado)

        html += `
          <tr>
            <td>${proyecto.id}</td>
            <td>${proyecto.nombre}</td>
            <td>${proyecto.cliente}</td>
            <td>${fechaInicio}</td>
            <td>${estado}</td>
            <td>
              <button class="boton-accion ver" data-id="${proyecto.id}" title="Ver detalles">
                <i class="fas fa-eye"></i>
              </button>
              ${
                usuario.rol === "admin"
                  ? `
                <button class="boton-accion editar" data-id="${proyecto.id}" title="Editar">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="boton-accion eliminar" data-id="${proyecto.id}" title="Eliminar">
                  <i class="fas fa-trash-alt"></i>
                </button>
              `
                  : ""
              }
            </td>
          </tr>
        `
      })

      tablaProyectos.innerHTML = html

      // Agregar eventos a los botones de acción
      document.querySelectorAll(".boton-accion").forEach((btn) => {
        btn.addEventListener("click", function () {
          const id = this.getAttribute("data-id")
          if (this.classList.contains("ver")) {
            verDetalleProyecto(id)
          } else if (this.classList.contains("editar")) {
            editarProyecto(id)
          } else if (this.classList.contains("eliminar")) {
            eliminarProyecto(id)
          }
        })
      })
    } catch (error) {
      console.error("Error al cargar proyectos:", error)
      const tablaProyectos = document.getElementById("tabla-proyectos")
      tablaProyectos.innerHTML = '<tr><td colspan="6" class="texto-centrado">Error al cargar proyectos</td></tr>'
    }
  }

  // Cargar usuarios (solo para administradores)
  async function cargarUsuarios() {
    try {
      const token = localStorage.getItem("authToken")

      const response = await fetch(`${API_URL}/usuarios`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Error al cargar usuarios")
      }

      const usuarios = await response.json()
      const tablaUsuarios = document.getElementById("tabla-usuarios")
      const selectUsuarios = document.getElementById("usuario-rol")

      if (usuarios.length === 0) {
        tablaUsuarios.innerHTML = '<tr><td colspan="6" class="texto-centrado">No hay usuarios registrados</td></tr>'
        return
      }

      // Llenar tabla de usuarios
      let htmlTabla = ""
      // Llenar select de usuarios
      let htmlSelect = '<option value="">Seleccione un usuario</option>'

      usuarios.forEach((usuario) => {
        const rolTexto = {
          cliente: "Cliente",
          empleado: "Empleado",
          admin: "Administrador",
        }

        const estado = usuario.activo
          ? '<span class="estado activo">Activo</span>'
          : '<span class="estado inactivo">Inactivo</span>'

        htmlTabla += `
          <tr>
            <td>${usuario.id}</td>
            <td>${usuario.nombre}</td>
            <td>${usuario.email}</td>
            <td>${rolTexto[usuario.rol] || "Cliente"}</td>
            <td>${estado}</td>
            <td>
              <button class="boton-accion ver" data-id="${usuario.id}" title="Ver detalles">
                <i class="fas fa-eye"></i>
              </button>
              <button class="boton-accion editar" data-id="${usuario.id}" title="Editar">
                <i class="fas fa-edit"></i>
              </button>
              <button class="boton-accion ${usuario.activo ? "desactivar" : "activar"}" data-id="${usuario.id}" title="${usuario.activo ? "Desactivar" : "Activar"}">
                <i class="fas fa-${usuario.activo ? "user-slash" : "user-check"}"></i>
              </button>
            </td>
          </tr>
        `

        htmlSelect += `<option value="${usuario.id}">${usuario.nombre} (${usuario.email})</option>`
      })

      tablaUsuarios.innerHTML = htmlTabla

      // Actualizar select de usuarios si existe
      if (selectUsuarios) {
        selectUsuarios.innerHTML = htmlSelect
      }

      // Agregar eventos a los botones de acción
      document.querySelectorAll(".tabla-usuarios .boton-accion").forEach((btn) => {
        btn.addEventListener("click", function () {
          const id = this.getAttribute("data-id")
          if (this.classList.contains("ver")) {
            verDetalleUsuario(id)
          } else if (this.classList.contains("editar")) {
            editarUsuario(id)
          } else if (this.classList.contains("desactivar")) {
            cambiarEstadoUsuario(id, false)
          } else if (this.classList.contains("activar")) {
            cambiarEstadoUsuario(id, true)
          }
        })
      })
    } catch (error) {
      console.error("Error al cargar usuarios:", error)
      const tablaUsuarios = document.getElementById("tabla-usuarios")
      tablaUsuarios.innerHTML = '<tr><td colspan="6" class="texto-centrado">Error al cargar usuarios</td></tr>'
    }
  }

  // Función para obtener HTML de estado con color
  function obtenerEstadoHTML(estado) {
    const estados = {
      pendiente: '<span class="estado pendiente">Pendiente</span>',
      en_proceso: '<span class="estado en-proceso">En Proceso</span>',
      completado: '<span class="estado completado">Completado</span>',
      cancelado: '<span class="estado cancelado">Cancelado</span>',
    }

    return estados[estado] || `<span class="estado">${estado}</span>`
  }

  // Funciones para manejar acciones de solicitudes, proyectos y usuarios
  function verDetalleSolicitud(id) {
    alert(`Ver detalle de solicitud ${id}`)
    // Implementar modal o redirección a página de detalle
  }

  function verDetalleProyecto(id) {
    alert(`Ver detalle de proyecto ${id}`)
    // Implementar modal o redirección a página de detalle
  }

  function editarProyecto(id) {
    alert(`Editar proyecto ${id}`)
    // Implementar modal o redirección a página de edición
  }

  function eliminarProyecto(id) {
    if (confirm(`¿Está seguro de eliminar el proyecto ${id}?`)) {
      alert(`Proyecto ${id} eliminado`)
      // Implementar lógica de eliminación
    }
  }

  function verDetalleUsuario(id) {
    alert(`Ver detalle de usuario ${id}`)
    // Implementar modal o redirección a página de detalle
  }

  function editarUsuario(id) {
    alert(`Editar usuario ${id}`)
    // Implementar modal o redirección a página de edición
  }

  function cambiarEstadoUsuario(id, activar) {
    const accion = activar ? "activar" : "desactivar"
    if (confirm(`¿Está seguro de ${accion} al usuario ${id}?`)) {
      alert(`Usuario ${id} ${activar ? "activado" : "desactivado"}`)
      // Implementar lógica de cambio de estado
    }
  }

  // Manejar cambio de tabs
  tabLinks.forEach((link) => {
    link.addEventListener("click", function () {
      const tabId = this.getAttribute("data-tab")

      // Desactivar todos los tabs
      tabLinks.forEach((tab) => tab.classList.remove("active"))
      tabContents.forEach((content) => content.classList.remove("active"))

      // Activar el tab seleccionado
      this.classList.add("active")
      document.getElementById(`tab-${tabId}`).classList.add("active")

      // Cargar datos específicos según el tab
      if (tabId === "solicitudes") {
        cargarSolicitudes()
      } else if (tabId === "proyectos") {
        cargarProyectos()
      } else if (tabId === "usuarios") {
        cargarUsuarios()
      }
    })
  })

  // Manejar menú desplegable de usuario
  if (botonUsuario) {
    botonUsuario.addEventListener("click", function () {
      this.classList.toggle("active")
      menuDesplegable.classList.toggle("active")
    })

    // Cerrar menú al hacer clic fuera
    document.addEventListener("click", (e) => {
      if (!botonUsuario.contains(e.target) && !menuDesplegable.contains(e.target)) {
        botonUsuario.classList.remove("active")
        menuDesplegable.classList.remove("active")
      }
    })
  }

  // Manejar cierre de sesión
  if (cerrarSesion) {
    cerrarSesion.addEventListener("click", () => {
      if (confirm("¿Está seguro de cerrar sesión?")) {
        // Eliminar token y datos de usuario
        localStorage.removeItem("authToken")
        localStorage.removeItem("usuario")

        // Redireccionar a la página de login
        window.location.href = "login.html"
      }
    })
  }

  // Manejar formulario de asignación de roles
  const formAsignarRol = document.getElementById("form-asignar-rol")
  if (formAsignarRol) {
    formAsignarRol.addEventListener("submit", async (e) => {
      e.preventDefault()

      const usuarioId = document.getElementById("usuario-rol").value
      const nuevoRol = document.getElementById("nuevo-rol").value

      if (!usuarioId || !nuevoRol) {
        alert("Debe seleccionar un usuario y un rol")
        return
      }

      try {
        const token = localStorage.getItem("authToken")

        const response = await fetch(`${API_URL}/usuarios/${usuarioId}/rol`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ rol: nuevoRol }),
        })

        if (!response.ok) {
          throw new Error("Error al cambiar el rol del usuario")
        }

        alert("Rol asignado correctamente")
        cargarUsuarios() // Recargar lista de usuarios
      } catch (error) {
        alert(error.message || "Error al asignar rol")
      }
    })
  }

  // Inicializar dashboard
  function inicializarDashboard() {
    const usuario = verificarAutenticacion()
    if (usuario) {
      cargarDatosUsuario(usuario)
    }
  }

  // Iniciar dashboard
  inicializarDashboard()
})

