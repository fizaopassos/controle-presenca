const express = require('express');
const path = require('path');
const session = require('express-session');

const app = express();

// Definir a porta
const PORT = process.env.PORT || 3000;

// ========================
// View engine (EJS)
// ========================
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ========================
// Middlewares de parsing
// ========================
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ========================
// Arquivos estáticos
// ========================
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use(express.static(path.join(__dirname, 'public')));

// ========================
// Sessão
// ========================
app.use(session({
  secret: process.env.SESSION_SECRET || 'seu-secret-super-seguro-aqui',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 // 1 dia
  }
}));

// ========================
// Usuário disponível nas views
// ========================
app.use((req, res, next) => {
  const sess = req.session || {};
  res.locals.usuario = sess.user || null;
  next();
});


// ========================
// Rotas
// ========================
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const condominiosRoutes = require('./routes/condominios');
const empresasRoutes = require('./routes/empresas');
const postosRoutes = require('./routes/postos');
const colaboradoresRoutes = require('./routes/colaboradores');
const presencaRoutes = require('./routes/presenca');
const usuariosRoutes = require('./routes/usuarios');

// Se não precisar mais dos logs de debug, pode apagar:
console.log('authRoutes typeof:', typeof authRoutes);
console.log('authRoutes keys:', authRoutes && Object.keys(authRoutes));
console.log('authRoutes value:', authRoutes);

// Montagem das rotas
app.use('/auth', authRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/condominios', condominiosRoutes);
app.use('/empresas', empresasRoutes);
app.use('/postos', postosRoutes);
app.use('/colaboradores', colaboradoresRoutes);
app.use('/presenca', presencaRoutes);
app.use('/usuarios', usuariosRoutes);

app.get('/login', (req, res) => res.redirect('/auth/login'));
app.post('/login', (req, res) => res.redirect(307, '/auth/login'));

// ========================
// Iniciar servidor
// ========================
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
