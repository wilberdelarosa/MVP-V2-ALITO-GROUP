const express = require("express")
const router = express.Router()
const passport = require("passport")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const Usuario = require("../models/usuario")

// Configuración JWT
const JWT_SECRET = process.env.JWT_SECRET || "alito-group-jwt-secret"
const JWT_EXPIRES = process.env.JWT_EXPIRES || "7d"

// Generar token JWT
const generarToken = (usuario) => {
  return jwt.sign(
    {
      id: usuario._id,
      email: usuario.email,
      rol: usuario.rol,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES },
  )
}

// Ruta de registro
router.post("/registro", async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body

    // Verificar si el email ya está registrado
    const usuarioExistente = await Usuario.findOne({ email })
    if (usuarioExistente) {
      return res.status(400).json({ message: "El correo electrónico ya está registrado" })
    }

    // Encriptar contraseña
    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(password, salt)

    // Crear nuevo usuario
    const nuevoUsuario = new Usuario({
      nombre,
      email,
      password: passwordHash,
      rol: rol || "cliente", // Rol por defecto
    })

    await nuevoUsuario.save()

    res.status(201).json({
      message: "Usuario registrado exitosamente",
      usuario: {
        id: nuevoUsuario._id,
        nombre: nuevoUsuario.nombre,
        email: nuevoUsuario.email,
        rol: nuevoUsuario.rol,
      },
    })
  } catch (error) {
    console.error("Error en registro:", error)
    res.status(500).json({ message: "Error en el servidor" })
  }
})

// Ruta de login
router.post("/login", (req, res, next) => {
  passport.authenticate("local", { session: false }, (err, usuario, info) => {
    if (err) {
      return res.status(500).json({ message: "Error en el servidor" })
    }

    if (!usuario) {
      return res.status(401).json({ message: info.message || "Credenciales inválidas" })
    }

    // Generar token JWT
    const token = generarToken(usuario)

    // Responder con token y datos del usuario
    res.json({
      message: "Inicio de sesión exitoso",
      token,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        avatar: usuario.avatar,
      },
    })
  })(req, res, next)
})

// Ruta para iniciar autenticación con Google
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  }),
)

// Callback de Google
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
    session: false,
  }),
  (req, res) => {
    // Generar token JWT
    const token = generarToken(req.user)

    // Redireccionar a la página principal con token
    res.redirect(`/dashboard.html?token=${token}`)
  },
)

// Ruta para verificar token
router.get("/verificar", passport.authenticate("jwt", { session: false }), (req, res) => {
  res.json({
    usuario: {
      id: req.user._id,
      nombre: req.user.nombre,
      email: req.user.email,
      rol: req.user.rol,
      avatar: req.user.avatar,
    },
  })
})

// Ruta para cerrar sesión
router.post("/logout", (req, res) => {
  req.logout()
  res.json({ message: "Sesión cerrada exitosamente" })
})

module.exports = router

