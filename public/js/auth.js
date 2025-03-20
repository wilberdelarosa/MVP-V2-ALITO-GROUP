document.addEventListener("DOMContentLoaded", () => {
  // Referencias a elementos del DOM
  const loginForm = document.getElementById("login-form")
  const registroForm = document.getElementById("registro-form")
  const mensajeError = document.getElementById("mensaje-error")
  const textoError = document.getElementById("texto-error")
  const mensajeExito = document.getElementById("mensaje-exito")
  const textoExito = document.getElementById("texto-exito")
  const googleLoginBtn = document.getElementById("google-login")
  const togglePasswordBtns = document.querySelectorAll(".toggle-password")

  // URL base para las peticiones API
  const API_URL = "http://localhost:3000/api"

  // Función para mostrar mensajes de error
  function mostrarError(mensaje) {
    textoError.textContent = mensaje
    mensajeError.style.display = "flex"
    mensajeExito.style.display = "none"

    // Ocultar después de 5 segundos
    setTimeout(() => {
      mensajeError.style.display = "none"
    }, 5000)
  }

  // Función para mostrar mensajes de éxito
  function mostrarExito(mensaje) {
    textoExito.textContent = mensaje
    mensajeExito.style.display = "flex"
    mensajeError.style.display = "none"
  }

  // Función para mostrar estado de carga en botones
  function toggleCargando(boton, cargando) {
    if (cargando) {
      boton.classList.add("cargando")
      boton.disabled = true
    } else {
      boton.classList.remove("cargando")
      boton.disabled = false
    }
  }

  // Manejo del formulario de inicio de sesión
  if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
      e.preventDefault()

      const email = document.getElementById("email").value
      const password = document.getElementById("password").value
      const recordar = document.getElementById("recordar")?.checked || false

      const submitBtn = this.querySelector('button[type="submit"]')
      toggleCargando(submitBtn, true)

      try {
        const response = await fetch(`${API_URL}/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password, recordar }),
          credentials: "include", // Importante para cookies
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || "Error al iniciar sesión")
        }

        // Guardar token en localStorage si "recordar" está marcado
        if (recordar && data.token) {
          localStorage.setItem("authToken", data.token)
        }

        // Guardar información básica del usuario
        if (data.usuario) {
          localStorage.setItem(
            "usuario",
            JSON.stringify({
              id: data.usuario.id,
              nombre: data.usuario.nombre,
              email: data.usuario.email,
              rol: data.usuario.rol,
            }),
          )
        }

        mostrarExito("Inicio de sesión exitoso. Redirigiendo...")

        // Redireccionar al dashboard después de 1.5 segundos
        setTimeout(() => {
          window.location.href = "dashboard.html"
        }, 1500)
      } catch (error) {
        mostrarError(error.message || "Error al iniciar sesión. Intente nuevamente.")
        toggleCargando(submitBtn, false)
      }
    })
  }

  // Manejo del formulario de registro
  if (registroForm) {
    registroForm.addEventListener("submit", async function (e) {
      e.preventDefault()

      const nombre = document.getElementById("nombre").value
      const email = document.getElementById("email").value
      const password = document.getElementById("password").value
      const confirmarPassword = document.getElementById("confirmar-password").value
      const terminos = document.getElementById("terminos").checked

      // Validaciones
      if (password !== confirmarPassword) {
        mostrarError("Las contraseñas no coinciden")
        return
      }

      if (!terminos) {
        mostrarError("Debe aceptar los términos y condiciones")
        return
      }

      const submitBtn = this.querySelector('button[type="submit"]')
      toggleCargando(submitBtn, true)

      try {
        const response = await fetch(`${API_URL}/auth/registro`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nombre,
            email,
            password,
            rol: "cliente", // Rol por defecto para nuevos registros
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || "Error al registrarse")
        }

        mostrarExito("Registro exitoso. Redirigiendo al inicio de sesión...")

        // Redireccionar a la página de login después de 2 segundos
        setTimeout(() => {
          window.location.href = "login.html"
        }, 2000)
      } catch (error) {
        mostrarError(error.message || "Error al registrarse. Intente nuevamente.")
        toggleCargando(submitBtn, false)
      }
    })
  }

  // Manejo del botón de inicio de sesión con Google
  if (googleLoginBtn) {
    googleLoginBtn.addEventListener("click", () => {
      // Redirigir a la ruta de autenticación de Google
      window.location.href = `${API_URL}/auth/google`
    })
  }

  // Manejo de los botones para mostrar/ocultar contraseña
  togglePasswordBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      const input = this.parentElement.querySelector("input")
      const icon = this.querySelector("i")

      if (input.type === "password") {
        input.type = "text"
        icon.classList.remove("fa-eye")
        icon.classList.add("fa-eye-slash")
      } else {
        input.type = "password"
        icon.classList.remove("fa-eye-slash")
        icon.classList.add("fa-eye")
      }
    })
  })

  // Verificar si hay un token de autenticación al cargar la página
  function verificarAutenticacion() {
    const token = localStorage.getItem("authToken")
    const paginasPublicas = ["login.html", "registro.html", "recuperar-password.html", "index.html"]
    const paginaActual = window.location.pathname.split("/").pop()

    // Si estamos en una página que requiere autenticación y no hay token, redirigir al login
    if (!paginasPublicas.includes(paginaActual) && !token) {
      window.location.href = "login.html"
    }

    // Si estamos en login o registro y ya hay un token, redirigir al dashboard
    if ((paginaActual === "login.html" || paginaActual === "registro.html") && token) {
      window.location.href = "dashboard.html"
    }
  }

  // Verificar autenticación al cargar la página
  verificarAutenticacion()
})

