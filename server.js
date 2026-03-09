require('dotenv').config();

const express = require('express');
const path = require('path');
const session = require('express-session');

const app = express();
const perfilRoutes = require('./routes/perfil');

// ========================
// Validações de produção
// ========================
if (process.env.NODE_ENV === 'production') {
if (!process.env.SESSION_SECRET) {
throw new Error('SESSION_SECRET não definido no .env');
}
}

// ========================
// Middleware de manutenção
// ========================
function maintenanceMiddleware(req, res, next) {
const on = String(process.env.MAINTENANCE_MODE || '') === '1';
if (!on) return next();

// Healthcheck (opcional)
if (req.path === '/health') return res.status(200).send('OK');

// Libera logout
if (req.path === '/auth/logout') return next();

// Bypass para admin logado
const user = req.session && req.session.user;
if (user && user.perfil === 'admin') return next();

// Se quiser conseguir entrar no /auth/login mesmo em manutenção (para renovar sessão),
// deixe passar /auth. Usuário comum até consegue logar, mas continuará bloqueado em seguida.
if (req.path.startsWith('/auth') || req.path === '/login') return next();

// Se for HTMX ou API/JSON, responde JSON 503
const wantsJson =
req.get('HX-Request') === 'true' ||
req.path.startsWith('/api') ||
(req.get('Accept') || '').includes('application/json') ||
req.xhr === true;

res.set('Retry-After', '300');

if (wantsJson) {
return res.status(503).json({
error: 'Sistema em manutenção. Tente novamente em alguns minutos.'
});
}

return res.status(503).render('maintenance', { title: 'Manutenção' });
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
// Sessão (precisa vir ANTES da manutenção)
// ========================
app.use(
session({
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
})
);

// ========================
// Usuário disponível nas views (antes da manutenção é ok, mas pode ficar antes ou depois)
// ========================
app.use((req, res, next) => {
res.locals.usuario = req.session?.user || null;
next();
});

// ========================
// Manutenção (tem que vir ANTES das rotas)
// ========================
app.use(maintenanceMiddleware);

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
app.use('/perfil', perfilRoutes);

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
console.log('Servidor rodando na porta ${PORT}');
});