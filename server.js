require('dotenv').config();

const express = require('express');
const path = require('path');
const session = require('express-session');

const app = express();

// ========================
// Validações de produção
// ========================
if (process.env.NODE_ENV === 'production') {
  if (!process.env.SESSION_SECRET) {
    throw new Error('SESSION_SECRET não definido no .env');
  }
}

// ========================
// Configurações básicas
// ========================
const PORT = process.env.PORT || 3000;

// Necessário para cookies secure atrás do Nginx
app.set('trust proxy', 1);

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
  name: 'retha.sid',
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // true com HTTPS
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 // 1 dia
  }
}));

// ========================
// Usuário disponível nas views
// ========================
app.use((req, res, next) => {
  res.locals.usuario = req.session?.user || null;
  next();
});

// ========================
// Rotas
// ========================
app.use('/auth', require('./routes/auth'));
app.use('/dashboard', require('./routes/dashboard'));
app.use('/condominios', require('./routes/condominios'));
app.use('/empresas', require('./routes/empresas'));
app.use('/postos', require('./routes/postos'));
app.use('/colaboradores', require('./routes/colaboradores'));
app.use('/presenca', require('./routes/presenca'));
app.use('/usuarios', require('./routes/usuarios'));

// ========================
// Rota raiz
// ========================
app.get('/', (req, res) => {
  if (req.session?.user) {
    return res.redirect('/dashboard');
  }
  return res.redirect('/auth/login');
});

// Compatibilidade
app.get('/login', (req, res) => res.redirect('/auth/login'));
app.post('/login', (req, res) => res.redirect(307, '/auth/login'));

// ========================
// Fallback 404
// ========================
app.use((req, res) => {
  res.status(404).render('layout', {
    title: 'Página não encontrada',
    page: 'errors/404',
    showNavbar: false,
    mainClass: 'container',
    menuAtivo: ''
  });
});

// ========================
// Inicialização
// ========================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando em produção na porta ${PORT}`);
});
