// routes/dashboard.js
const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middlewares/auth');

router.get('/', isAuthenticated, (req, res) => {
  console.log('Dashboard acessado - Usuário:', req.session?.user?.nome);
  console.log('Sessão completa:', req.session);

  res.render('layout', {
    title: 'Dashboard',
    menuAtivo: 'dashboard',
    page: 'dashboard/index'
  });
});

module.exports = router;