const express = require("express")
const router = express.Router()
const passport = require("passport")
const Solicitud = require("../models/solicitud")

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

// Obtener todas las solicitudes (solo admin y empleados)
router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  verificarRol("admin", "empleado"),
  async (req, res) => {
    try {
      const solicitudes = await Solicitud.find().populate("usuario", "nombre email")
      res.json(solicitudes)
    } catch (error) {
      res.status(500).json({ message: error.message })
    }
  },
)

// Obtener solicitudes de un usuario específico
router.get("/usuario/:userId", passport.authenticate("jwt", { session: false }), async (req, res) => {
  try {
    const solicitudes = await Solicitud.find({ usuario: req.params.userId })
    res.json(solicitudes)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Crear una nueva solicitud de cotización
router.post("/cotizacion", passport.authenticate("jwt", { session: false }), async (req, res) => {
  try {
    const { items, comentarios } = req.body

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "La solicitud debe contener al menos un ítem" })
    }

    const solicitud = new Solicitud({
      usuario: req.user._id,
      tipo: "cotizacion",
      descripcion: "Solicitud de cotización de productos y servicios",
      estado: "pendiente",
      detalles: {
        items,
        comentarios,
      },
    })

    const nuevaSolicitud = await solicitud.save()
    res.status(201).json(nuevaSolicitud)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
})

// Obtener una solicitud específica
router.get("/:id", passport.authenticate("jwt", { session: false }), async (req, res) => {
  try {
    const solicitud = await Solicitud.findById(req.params.id).populate("usuario", "nombre email")
    if (!solicitud) {
      return res.status(404).json({ message: "Solicitud no encontrada" })
    }

    // Verificar que el usuario sea el propietario o un admin/empleado
    if (solicitud.usuario._id.toString() !== req.user._id.toString() && !["admin", "empleado"].includes(req.user.rol)) {
      return res.status(403).json({ message: "No tiene permiso para ver esta solicitud" })
    }

    res.json(solicitud)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Actualizar una solicitud
router.patch(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  verificarRol("admin", "empleado"),
  async (req, res) => {
    try {
      const solicitud = await Solicitud.findById(req.params.id)
      if (!solicitud) {
        return res.status(404).json({ message: "Solicitud no encontrada" })
      }

      if (req.body.tipo) solicitud.tipo = req.body.tipo
      if (req.body.descripcion) solicitud.descripcion = req.body.descripcion
      if (req.body.estado) solicitud.estado = req.body.estado
      if (req.body.detalles) solicitud.detalles = req.body.detalles

      // Agregar comentario si se proporciona
      if (req.body.comentario) {
        if (!solicitud.detalles.comentarios) {
          solicitud.detalles.comentarios = []
        }

        solicitud.detalles.comentarios.push({
          usuario: req.user._id,
          texto: req.body.comentario,
          fecha: new Date(),
        })
      }

      // Agregar respuesta si se proporciona
      if (req.body.respuesta) {
        solicitud.detalles.respuesta = {
          tipo: req.body.respuesta.tipo, // "link" o "email"
          contenido: req.body.respuesta.contenido, // URL o mensaje
          fecha: new Date(),
          usuario: req.user._id,
        }

        // Cambiar estado a completado si se proporciona respuesta
        solicitud.estado = "completado"
      }

      const solicitudActualizada = await solicitud.save()
      res.json(solicitudActualizada)
    } catch (error) {
      res.status(400).json({ message: error.message })
    }
  },
)

// Eliminar una solicitud
router.delete("/:id", passport.authenticate("jwt", { session: false }), verificarRol("admin"), async (req, res) => {
  try {
    const solicitud = await Solicitud.findById(req.params.id)
    if (!solicitud) {
      return res.status(404).json({ message: "Solicitud no encontrada" })
    }
    await Solicitud.deleteOne({ _id: req.params.id })
    res.json({ message: "Solicitud eliminada" })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

module.exports = router

