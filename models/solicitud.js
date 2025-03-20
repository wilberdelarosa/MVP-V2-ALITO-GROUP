const mongoose = require("mongoose")
const Schema = mongoose.Schema

const SolicitudSchema = new Schema({
  usuario: {
    type: Schema.Types.ObjectId,
    ref: "Usuario",
    required: true,
  },
  tipo: {
    type: String,
    enum: ["alquiler", "transporte", "excavacion", "materiales"],
    required: true,
  },
  descripcion: {
    type: String,
    required: true,
  },
  fecha: {
    type: Date,
    default: Date.now,
  },
  estado: {
    type: String,
    enum: ["pendiente", "en_proceso", "completado", "cancelado"],
    default: "pendiente",
  },
  detalles: {
    type: Object,
  },
})

module.exports = mongoose.model("Solicitud", SolicitudSchema)

