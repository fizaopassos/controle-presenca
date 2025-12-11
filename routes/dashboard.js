// routes/dashboard.js
const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middlewares/auth');

router.get('/', isAuthenticated, (req, res) => {
  res.render('layout', {
    title: 'Dashboard',
    menuAtivo: 'dashboard',
    page: 'dashboard/index'
  });
});

module.exports = router;

/*// routes/dashboard.js
const express = require('express');
const router = express.Router();

// Middleware inline por enquanto
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  res.redirect('/login');
};

router.get('/', isAuthenticated, (req, res) => {
  res.render('dashboard/index');
});

module.exports = router;*/

