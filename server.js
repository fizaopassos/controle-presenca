const express = require('express');
const path = require('path');
const session = require('express-session');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar view engine (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares para body
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Sessão
app.use(session({
secret: process.env.SESSION_SECRET || 'um_segredo_qualquer_trocar_depois',
resave: false,
saveUninitialized: false,
cookie: {
maxAge: 1000 * 60 * 30 // 30 minutos
}
}));

// Arquivos estáticos (CSS, JS, imagens)
app.use(express.static(path.join(__dirname, 'public')));

// Rotas
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const condominiosRoutes = require('./routes/condominios');
const empresasRoutes = require('./routes/empresas');
const postosRoutes = require('./routes/postos');
const colaboradoresRoutes = require('./routes/colaboradores');
const presencaRoutes = require('./routes/presenca');

app.use('/auth', authRoutes);
app.use('/condominios', condominiosRoutes);
app.use('/empresas', empresasRoutes);
app.use('/postos', postosRoutes);
app.use('/colaboradores', colaboradoresRoutes);
app.use('/', dashboardRoutes);
app.use('/presenca', presencaRoutes);





// Iniciar servidor
app.listen(PORT, () => {
console.log(`Servidor rodando em http://localhost:${PORT}`);
});