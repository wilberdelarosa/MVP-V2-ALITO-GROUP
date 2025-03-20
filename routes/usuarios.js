const express = require("express")
const router = express.Router()
const passport = require("passport")
const bcrypt = require("bcryptjs")
const Usuario = require("../models/usuario")

// Middleware para verificar rol de administrador
const esAdmin = (req, res, next) => {
  if (req.user.rol !== "admin") {
    return res.status(403).json({ message: "Acceso denegado. Se requiere rol de administrador" })
  }
  next()
}

// Obtener todos los usuarios (solo admin)
router.get("/", passport.authenticate("jwt", { session: false }), esAdmin, async (req, res) => {
  try {
    const usuarios = await Usuario.find()
    res.json(usuarios)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
