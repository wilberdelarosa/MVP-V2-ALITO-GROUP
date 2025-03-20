require("dotenv").config()
const mongoose = require("mongoose")
const Usuario = require("../models/usuario")

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/alito-group"

mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })

async function setAdmin(email) {
  try {
    const usuario = await Usuario.findOne({ email })
    if (!usuario) {
      console.log("Usuario no encontrado")
      return
    }
    usuario.rol = "admin"
    await usuario.save()
    console.log(`${usuario.nombre} (${usuario.email}) ha sido establecido como administrador`)
  } catch (error) {
    console.error("Error:", error)
  } finally {
    mongoose.disconnect()
  }
}

setAdmin("wilber.alitoeirl@gmail.com")

