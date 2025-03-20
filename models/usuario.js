const mongoose = require("mongoose")
const Schema = mongoose.Schema

const UsuarioSchema = new Schema({
  nombre: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
  },
  googleId: {
    type: String,
  },
  avatar: {
    type: String,
  },
  rol: {
    type: String,
    enum: ["cliente", "empleado", "admin"],
    default: "cliente",
  },
  activo: {
    type: Boolean,
    default: true,
  },
  fechaRegistro: {
    type: Date,
    default: Date.now,
  },
})

module.exports = mongoose.model("Usuario", UsuarioSchema)

