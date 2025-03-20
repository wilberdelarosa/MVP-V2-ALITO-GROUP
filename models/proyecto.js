const mongoose = require("mongoose")
const Schema = mongoose.Schema

const ProyectoSchema = new Schema({
  nombre: {
    type: String,
    required: true,
  },
  descripcion: {
    type: String,
    required: true,
  },
  cliente: {
    type: Schema.Types.ObjectId,
    ref: "Usuario",
    required: true,
  },
  responsable: {
    type: Schema.Types.ObjectId,
    ref: "Usuario",
  },
  fechaInicio: {
    type: Date,
    default: Date.now,
  },
  fechaFin: {
    type: Date,
  },
  estado: {
    type: String,
    enum: ["pendiente", "en_proceso", "completado", "cancelado"],
    default: "pendiente",
  },
  presupuesto: {
    type: Number,
  },
  ubicacion: {
    type: String,
  },
})

module.exports = mongoose.model("Proyecto", ProyectoSchema)

