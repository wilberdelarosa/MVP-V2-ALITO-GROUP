const GoogleStrategy = require("passport-google-oauth20").Strategy
const LocalStrategy = require("passport-local").Strategy
const JwtStrategy = require("passport-jwt").Strategy
const ExtractJwt = require("passport-jwt").ExtractJwt
const bcrypt = require("bcryptjs")
const Usuario = require("../models/usuario")

module.exports = (passport) => {
  // Serializar usuario
  passport.serializeUser((usuario, done) => {
    done(null, usuario.id)
  })

  // Deserializar usuario
  passport.deserializeUser(async (id, done) => {
    try {
      const usuario = await Usuario.findById(id)
      done(null, usuario)
    } catch (error) {
      done(error, null)
    }
  })

  // Estrategia Local (email y contraseña)
  passport.use(
    new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
      try {
        // Buscar usuario por email
        const usuario = await Usuario.findOne({ email })

        // Si no existe el usuario
        if (!usuario) {
          return done(null, false, { message: "Correo electrónico no registrado" })
        }

        // Si el usuario está inactivo
        if (!usuario.activo) {
          return done(null, false, { message: "Usuario desactivado. Contacte al administrador" })
        }

        // Verificar contraseña
        const esValida = await bcrypt.compare(password, usuario.password)
        if (!esValida) {
          return done(null, false, { message: "Contraseña incorrecta" })
        }

        // Autenticación exitosa
        return done(null, usuario)
      } catch (error) {
        return done(error)
      }
    }),
  )

  // Estrategia JWT
  const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET || "alito-group-jwt-secret",
  }

  passport.use(
    new JwtStrategy(jwtOptions, async (payload, done) => {
      try {
        // Buscar usuario por ID desde el payload del token
        const usuario = await Usuario.findById(payload.id)

        if (!usuario) {
          return done(null, false)
        }

        if (!usuario.activo) {
          return done(null, false)
        }

        return done(null, usuario)
      } catch (error) {
        return done(error, false)
      }
    }),
  )

  // Estrategia Google OAuth
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/api/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Buscar si el usuario ya existe
          let usuario = await Usuario.findOne({ googleId: profile.id })

          if (usuario) {
            return done(null, usuario)
          }

          // Si no existe, buscar por email
          usuario = await Usuario.findOne({ email: profile.emails[0].value })

          if (usuario) {
            // Actualizar usuario existente con ID de Google
            usuario.googleId = profile.id
            usuario.avatar = profile.photos[0].value
            await usuario.save()
            return done(null, usuario)
          }

          // Crear nuevo usuario
          const nuevoUsuario = new Usuario({
            nombre: profile.displayName,
            email: profile.emails[0].value,
            googleId: profile.id,
            avatar: profile.photos[0].value,
            rol: "cliente", // Rol por defecto
            activo: true,
          })

          await nuevoUsuario.save()
          return done(null, nuevoUsuario)
        } catch (error) {
          return done(error, false)
        }
      },
    ),
  )
}

