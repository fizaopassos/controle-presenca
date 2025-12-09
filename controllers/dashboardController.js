exports.show = (req, res) => {
const usuario = req.session.user;

// Por enquanto, só mostra uma tela simples
res.render('dashboard', { usuario });
};