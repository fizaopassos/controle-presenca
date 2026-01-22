const express = require('express');
const path = require('path');
const session = require('express-session');

const app = express();

// Definir a porta
const PORT = process.env.PORT || 3000;

// Configurar view engine (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware para parsear body
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Arquivos estáticos (CSS, JS, imagens)
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use(express.static(path.join(__dirname, 'public')));

// Configuração de sessão
app.use(session({
  secret: process.env.SESSION_SECRET || 'seu-secret-super-seguro-aqui',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24
  }
}));

// Middleware para disponibilizar usuário nas views
app.use((req, res, next) => {
  res.locals.usuario = req.session.user || null;
  next();
});

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rotas
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const condominiosRoutes = require('./routes/condominios');
const empresasRoutes = require('./routes/empresas');
const postosRoutes = require('./routes/postos');
const colaboradoresRoutes = require('./routes/colaboradores');
const presencaRoutes = require('./routes/presenca');
const usuariosRoutes = require('./routes/usuarios');


app.use('/', authRoutes); // mudei de /auth para / para funcionar /login
app.use('/condominios', condominiosRoutes);
app.use('/empresas', empresasRoutes);
app.use('/postos', postosRoutes);
app.use('/colaboradores', colaboradoresRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/presenca', presencaRoutes);
app.use('/usuarios', usuariosRoutes);


// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
