const express = require("express")
const router = express.Router()
const passport = require("passport")
const Proyecto = require("../models/proyecto")

// Middleware para verificar roles
const verificarRol = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "No autorizado" })
    }
    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ message: "No tiene permiso para realizar esta acción" })
    }
    next()
  }
}

// Obtener todos los proyectos (solo admin y empleados)
router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  verificarRol("admin", "empleado"),
  async (req, res) => {
    try {
      const proyectos = await Proyecto.find()
        .populate("cliente", "nombre email")
        .populate("responsable", "nombre email")
      res.json(proyectos)
    } catch (error) {
      res.status(500).json({ message: error.message })
    }
  },
)

// Crear un nuevo proyecto
router.post("/", passport.authenticate("jwt", { session: false }), verificarRol("admin"), async (req, res) => {
  const proyecto = new Proyecto({
    nombre: req.body.nombre,
    descripcion: req.body.descripcion,
    cliente: req.body.cliente,
    responsable: req.body.responsable,
    fechaInicio: req.body.fechaInicio,
    fechaFin: req.body.fechaFin,
    estado: req.body.estado,
    presupuesto: req.body.presupuesto,
    ubicacion: req.body.ubicacion,
  })

  try {
    const nuevoProyecto = await proyecto.save()
    res.status(201).json(nuevoProyecto)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
})

// Obtener un proyecto específico
router.get(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  verificarRol("admin", "empleado"),
  async (req, res) => {
    try {
      const proyecto = await Proyecto.findById(req.params.id)
        .populate("cliente", "nombre email")
        .populate("responsable", "nombre email")
      if (!proyecto) {
        return res.status(404).json({ message: "Proyecto no encontrado" })
      }
      res.json(proyecto)
    } catch (error) {
      res.status(500).json({ message: error.message })
    }
  },
)

// Actualizar un proyecto
router.patch(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  verificarRol("admin", "empleado"),
  async (req, res) => {
    try {
      const proyecto = await Proyecto.findById(req.params.id)
      if (!proyecto) {
        return res.status(404).json({ message: "Proyecto no encontrado" })
      }

      if (req.body.nombre) proyecto.nombre = req.body.nombre
      if (req.body.descripcion) proyecto.descripcion = req.body.descripcion
      if (req.body.cliente) proyecto.cliente = req.body.cliente
      if (req.body.responsable) proyecto.responsable = req.body.responsable
      if (req.body.fechaInicio) proyecto.fechaInicio = req.body.fechaInicio
      if (req.body.fechaFin) proyecto.fechaFin = req.body.fechaFin
      if (req.body.estado) proyecto.estado = req.body.estado
      if (req.body.presupuesto) proyecto.presupuesto = req.body.presupuesto
      if (req.body.ubicacion) proyecto.ubicacion = req.body.ubicacion

      const proyectoActualizado = await proyecto.save()
      res.json(proyectoActualizado)
    } catch (error) {
      res.status(400).json({ message: error.message })
    }
  },
)

// Eliminar un proyecto
router.delete("/:id", passport.authenticate("jwt", { session: false }), verificarRol("admin"), async (req, res) => {
  try {
    const proyecto = await Proyecto.findById(req.params.id)
    if (!proyecto) {
      return res.status(404).json({ message: "Proyecto no encontrado" })
    }
    await proyecto.remove()
    res.json({ message: "Proyecto eliminado" })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

module.exports = router

