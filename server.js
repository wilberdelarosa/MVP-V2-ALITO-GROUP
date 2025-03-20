// Importar dependencias
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const passport = require("passport");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const path = require("path");
const dotenv = require("dotenv");

// Cargar variables de entorno
dotenv.config();

// Verificar que las variables de entorno críticas están definidas
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.error("❌ ERROR: Faltan credenciales de Google OAuth en el archivo .env");
  process.exit(1);
}

if (!process.env.MONGODB_URI) {
  console.error("❌ ERROR: Faltan las credenciales de conexión a MongoDB en el archivo .env");
  process.exit(1);
}

console.log("✅ GOOGLE_CLIENT_ID cargado:", process.env.GOOGLE_CLIENT_ID);

// Importar configuraciones
const configPassport = require("./config/passport");

// Importar rutas
const authRoutes = require("./routes/auth");
const usuariosRoutes = require("./routes/usuarios");
const solicitudesRoutes = require("./routes/solicitudes");
const proyectosRoutes = require("./routes/proyectos");

// Crear aplicación Express
const app = express();
const PORT = process.env.PORT || 3000;

// Configurar middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:5500"],
    credentials: true,
  })
);

// Configurar sesiones
app.use(
  session({
    secret: process.env.JWT_SECRET || "default-secret-key",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      ttl: 14 * 24 * 60 * 60, // 14 días
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 14 * 24 * 60 * 60 * 1000, // 14 días
    },
  })
);

// Configurar Passport
app.use(passport.initialize());
app.use(passport.session());
configPassport(passport);

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, "public")));

// Configurar rutas
app.use("/api/auth", authRoutes);
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/solicitudes", solicitudesRoutes);
app.use("/api/proyectos", proyectosRoutes);

// Ruta para servir archivos HTML
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get("/registro", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "registro.html"));
});

app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

// Conectar a MongoDB con validación
mongoose
  .connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("📌 Conectado a MongoDB");
    app.listen(PORT, () => {
      console.log(`🚀 Servidor ejecutándose en el puerto ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Error al conectar a MongoDB:", err);
    process.exit(1);
  });
