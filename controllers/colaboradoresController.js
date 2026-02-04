const db = require('../config/db');

function isHTMX(req) {
  return req.get('HX-Request') === 'true';
}

exports.listar = async (req, res) => {
  try {
    const user = req.session && req.session.user ? req.session.user : null;
    const condominioId = req.query.condominio_id ? Number(req.query.condominio_id) : null;

    if (!user) {
      return res.redirect('/auth/login');
    }

    const isAdmin = user.perfil === 'admin';

    const condominiosPermitidos = !isAdmin
      ? (Array.isArray(user.condominios)
          ? user.condominios
              .map(c => Number(c.id))
              .filter(n => Number.isFinite(n))
          : [])
      : [];

    if (!isAdmin && condominiosPermitidos.length === 0) {
      return res.status(403).send('Seu usuário não tem condomínios permitidos para acessar.');
    }

    if (!isAdmin && condominiosPermitidos.length === 1 && !condominioId) {
      return res.redirect(`/colaboradores?condominio_id=${condominiosPermitidos[0]}`);
    }

    if (!condominioId) {
      let sqlConds;
      let params = [];

      if (isAdmin) {
        sqlConds = `
          SELECT cond.id, cond.nome,
            (SELECT COUNT(*) FROM colaboradores c 
             WHERE c.condominio_id = cond.id AND c.ativo = 1) AS total_colaboradores
          FROM condominios cond
          WHERE cond.ativo = 1
          ORDER BY cond.nome
        `;
      } else {
        sqlConds = `
          SELECT cond.id, cond.nome,
            (SELECT COUNT(*) FROM colaboradores c 
             WHERE c.condominio_id = cond.id AND c.ativo = 1) AS total_colaboradores
          FROM condominios cond
          WHERE cond.ativo = 1
            AND cond.id IN (?)
          ORDER BY cond.nome
        `;
        params = [condominiosPermitidos];
      }

      const [condominios] = await db.query(sqlConds, params);

      const [[cob]] = await db.query(
        "SELECT COUNT(*) AS total FROM colaboradores WHERE tipo = 'cobertura' AND ativo = 1"
      );
      const totalCoberturas = cob.total;

      return res.render('layout', {
        title: 'Colaboradores',
        page: 'colaboradores/selecionar_condominio',
        menuAtivo: 'cadastros',
        condominios,
        totalCoberturas
      });
    }

    if (!isAdmin && !condominiosPermitidos.includes(condominioId)) {
      return res.status(403).send('Acesso negado a este condomínio');
    }

    const sql = `
      SELECT 
        c.*, 
        e.nome AS empresa_nome, 
        p.nome AS posto_nome, 
        cond.nome AS condominio_nome 
      FROM colaboradores c 
      LEFT JOIN empresas e ON c.empresa_id = e.id 
      LEFT JOIN postos p ON c.posto_id = p.id 
      LEFT JOIN condominios cond ON c.condominio_id = cond.id 
      WHERE c.condominio_id = ? 
      ORDER BY c.nome
    `;

    const [rows] = await db.query(sql, [condominioId]);

    const [[condSel]] = await db.query(
      'SELECT id, nome FROM condominios WHERE id = ?',
      [condominioId]
    );

    return res.render('layout', {
      title: 'Colaboradores',
      page: 'colaboradores/lista',
      menuAtivo: 'cadastros',
      colaboradores: rows,
      condominioSelecionado: condSel || null
    });

  } catch (error) {
    console.error('Erro ao listar colaboradores:', error);
    return res.status(500).send('Erro ao listar colaboradores');
  }
};

exports.listarCoberturas = async (req, res) => {
  try {
    const sql = `
      SELECT 
        c.*, 
        e.nome AS empresa_nome, 
        p.nome AS posto_nome, 
        cond.nome AS condominio_nome 
      FROM colaboradores c 
      LEFT JOIN empresas e ON c.empresa_id = e.id 
      LEFT JOIN postos p ON c.posto_id = p.id 
      LEFT JOIN condominios cond ON c.condominio_id = cond.id 
      WHERE c.tipo = 'cobertura'
      ORDER BY c.nome
    `;

    const [rows] = await db.query(sql);

    return res.render('layout', {
      title: 'Colaboradores - Coberturas',
      page: 'colaboradores/lista',
      menuAtivo: 'cadastros',
      colaboradores: rows,
      condominioSelecionado: { nome: 'Coberturas' }
    });

  } catch (error) {
    console.error('Erro ao listar coberturas:', error);
    return res.status(500).send('Erro ao listar coberturas');
  }
};

exports.formNovo = async (req, res) => {
  try {
    const user = req.session.user;
    const isAdmin = user.perfil === 'admin';

    const [empresas] = await db.query(
      'SELECT id, nome FROM empresas WHERE ativo = TRUE ORDER BY nome'
    );
    const [postos] = await db.query(
      'SELECT id, nome FROM postos WHERE ativo = TRUE ORDER BY nome'
    );

    let condominios = [];

    if (isAdmin) {
      const [rowsCond] = await db.query(
        'SELECT id, nome FROM condominios WHERE ativo = TRUE ORDER BY nome'
      );
      condominios = rowsCond;
    } else {
      const condominiosPermitidos = Array.isArray(user.condominios)
        ? user.condominios
            .map(c => Number(c.id))
            .filter(n => Number.isFinite(n))
        : [];

      if (condominiosPermitidos.length === 0) {
        return res
          .status(403)
          .send('Seu usuário não tem condomínios permitidos para cadastrar colaboradores.');
      }

      const [rowsCond] = await db.query(
        'SELECT id, nome FROM condominios WHERE ativo = TRUE AND id IN (?) ORDER BY nome',
        [condominiosPermitidos]
      );
      condominios = rowsCond;
    }

    const isPartial = req.query.partial === '1' || isHTMX(req);

    const viewData = {
      colaborador: null,
      acao: 'novo',
      empresas,
      postos,
      condominios
    };

    if (isPartial) {
      return res.render('colaboradores/_form', viewData);
    }

    return res.render('layout', {
      title: 'Novo Colaborador',
      page: 'colaboradores/form',
      menuAtivo: 'cadastros',
      ...viewData
    });
  } catch (error) {
    console.error('Erro ao carregar formulário:', error);
    return res.status(500).send('Erro ao carregar formulário');
  }
};

exports.criar = async (req, res) => {
  try {
    const user = req.session.user;

    let { nome, empresa_id, condominio_id, posto_id, tipo } = req.body;

    if (!nome || nome.trim() === '') {
      return res.status(400).send('Nome é obrigatório.');
    }
    if (!empresa_id) {
      return res.status(400).send('Empresa é obrigatória.');
    }
    if (!tipo) {
      return res.status(400).send('Tipo é obrigatório.');
    }

    const nomeNormalizado = nome.trim();

    tipo = String(tipo).toLowerCase();
    const tipoFinal = tipo === 'cobertura' ? 'cobertura' : 'fixo';

    condominio_id = condominio_id || null;
    posto_id = posto_id || null;

    if (tipoFinal === 'fixo') {
      if (!condominio_id) {
        return res
          .status(400)
          .send('Para colaboradores FIXOS, o condomínio é obrigatório.');
      }
      if (!posto_id) {
        return res
          .status(400)
          .send('Para colaboradores FIXOS, o posto é obrigatório.');
      }
    }

    if (condominio_id && user.perfil !== 'admin') {
      const [rowsPerm] = await db.query(
        `SELECT 1 
         FROM usuario_condominios 
         WHERE usuario_id = ? AND condominio_id = ?
         LIMIT 1`,
        [user.id, condominio_id]
      );

      if (rowsPerm.length === 0) {
        return res
          .status(403)
          .send('Você não tem permissão para cadastrar colaborador neste condomínio.');
      }
    }

    // ✅ CHECK: verifica se já existe colaborador com mesmo nome na mesma empresa
    const [[existe]] = await db.query(
      `SELECT id FROM colaboradores
       WHERE nome = ? AND empresa_id = ?
       LIMIT 1`,
      [nomeNormalizado, empresa_id]
    );

    if (existe) {
      return res.status(400).send('Já existe um colaborador com esse nome nesta empresa.');
    }

    const condFinal = tipoFinal === 'cobertura' ? null : condominio_id;
    const postoFinal = tipoFinal === 'cobertura' ? null : posto_id;

    const sqlInsert =
      'INSERT INTO colaboradores (nome, empresa_id, condominio_id, posto_id, tipo, ativo) ' +
      'VALUES (?, ?, ?, ?, ?, TRUE)';

    const [result] = await db.query(sqlInsert, [
      nomeNormalizado,
      empresa_id,
      condFinal,
      postoFinal,
      tipoFinal
    ]);

    if (isHTMX(req)) {
      const insertedId = result.insertId;

      const sqlSelectUm =
        'SELECT ' +
        '  c.*, ' +
        '  e.nome AS empresa_nome, ' +
        '  p.nome AS posto_nome, ' +
        '  cond.nome AS condominio_nome ' +
        'FROM colaboradores c ' +
        'LEFT JOIN empresas e ON c.empresa_id = e.id ' +
        'LEFT JOIN postos p ON c.posto_id = p.id ' +
        'LEFT JOIN condominios cond ON c.condominio_id = cond.id ' +
        'WHERE c.id = ?';

      const [rows] = await db.query(sqlSelectUm, [insertedId]);
      return res.render('colaboradores/_linha', { c: rows[0] });
    }

    return res.redirect('/colaboradores');

  } catch (error) {
    console.error('Erro ao criar colaborador:', error);

    // ✅ Trata erro de UNIQUE (caso race condition)
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).send('Já existe um colaborador com esse nome nesta empresa (duplicado detectado).');
    }

    return res.status(500).send('Erro ao criar colaborador');
  }
};

exports.formEditar = async (req, res) => {
  const { id } = req.params;

  try {
    const user = req.session.user;
    const isAdmin = user.perfil === 'admin';

    const [rows] = await db.query('SELECT * FROM colaboradores WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).send('Colaborador não encontrado');

    const colaborador = rows[0];

    const [empresas] = await db.query(
      'SELECT id, nome FROM empresas WHERE ativo = TRUE ORDER BY nome'
    );
    const [postos] = await db.query(
      'SELECT id, nome FROM postos WHERE ativo = TRUE ORDER BY nome'
    );

    let condominios = [];
    if (isAdmin) {
      const [rowsCond] = await db.query(
        'SELECT id, nome FROM condominios WHERE ativo = TRUE ORDER BY nome'
      );
      condominios = rowsCond;
    } else {
      const condominiosPermitidos = Array.isArray(user.condominios)
        ? user.condominios
            .map(c => Number(c.id))
            .filter(n => Number.isFinite(n))
        : [];

      if (condominiosPermitidos.length === 0) {
        return res
          .status(403)
          .send('Seu usuário não tem condomínios permitidos para editar colaboradores.');
      }

      const [rowsCond] = await db.query(
        'SELECT id, nome FROM condominios WHERE ativo = TRUE AND id IN (?) ORDER BY nome',
        [condominiosPermitidos]
      );
      condominios = rowsCond;
    }

    const isPartial = req.query.partial === '1' || isHTMX(req);

    const viewData = {
      colaborador,
      acao: 'editar',
      empresas,
      postos,
      condominios
    };

    if (isPartial) {
      return res.render('colaboradores/_form', viewData);
    }

    return res.render('layout', {
      title: 'Editar Colaborador',
      page: 'colaboradores/form',
      menuAtivo: 'cadastros',
      ...viewData
    });
  } catch (error) {
    console.error('Erro ao carregar colaborador:', error);
    return res.status(500).send('Erro ao carregar colaborador');
  }
};

exports.atualizar = async (req, res) => {
  const { id } = req.params;
  let { nome, empresa_id, condominio_id, posto_id, tipo, ativo } = req.body;

  try {
    const user = req.session.user;

    if (!nome || nome.trim() === '') {
      return res.status(400).send('Nome é obrigatório.');
    }
    if (!empresa_id) {
      return res.status(400).send('Empresa é obrigatória.');
    }

    const nomeNormalizado = nome.trim();

    tipo = (tipo || 'fixo').toLowerCase();
    const tipoFinal = tipo === 'cobertura' ? 'cobertura' : 'fixo';

    condominio_id = condominio_id || null;
    posto_id = posto_id || null;

    if (tipoFinal === 'fixo') {
      if (!condominio_id) {
        return res
          .status(400)
          .send('Para colaboradores FIXOS, o condomínio é obrigatório.');
      }
      if (!posto_id) {
        return res
          .status(400)
          .send('Para colaboradores FIXOS, o posto é obrigatório.');
      }
    }

    if (condominio_id && user.perfil !== 'admin') {
      const [rowsPerm] = await db.query(
        `SELECT 1 
         FROM usuario_condominios 
         WHERE usuario_id = ? AND condominio_id = ?
         LIMIT 1`,
        [user.id, condominio_id]
      );

      if (rowsPerm.length === 0) {
        return res
          .status(403)
          .send('Você não tem permissão para alterar colaborador neste condomínio.');
      }
    }

    // ✅ CHECK: verifica se já existe outro colaborador (id diferente) com mesmo nome na mesma empresa
    const [[existe]] = await db.query(
      `SELECT id FROM colaboradores
       WHERE nome = ?
         AND empresa_id = ?
         AND id != ?
       LIMIT 1`,
      [nomeNormalizado, empresa_id, id]
    );

    if (existe) {
      return res.status(400).send('Já existe outro colaborador com esse nome nesta empresa.');
    }

    const condFinal = tipoFinal === 'cobertura' ? null : condominio_id;
    const postoFinal = tipoFinal === 'cobertura' ? null : posto_id;
    const ativoBool = ativo === 'on' ? 1 : 0;

    const sqlUpdate =
      'UPDATE colaboradores ' +
      'SET nome = ?, empresa_id = ?, condominio_id = ?, posto_id = ?, tipo = ?, ativo = ? ' +
      'WHERE id = ?';

    await db.query(sqlUpdate, [
      nomeNormalizado,
      empresa_id,
      condFinal,
      postoFinal,
      tipoFinal,
      ativoBool,
      id
    ]);

    if (isHTMX(req)) {
      const sqlSelectUm =
        'SELECT ' +
        '  c.*, ' +
        '  e.nome AS empresa_nome, ' +
        '  p.nome AS posto_nome, ' +
        '  cond.nome AS condominio_nome ' +
        'FROM colaboradores c ' +
        'LEFT JOIN empresas e ON c.empresa_id = e.id ' +
        'LEFT JOIN postos p ON c.posto_id = p.id ' +
        'LEFT JOIN condominios cond ON c.condominio_id = cond.id ' +
        'WHERE c.id = ?';

      const [rows] = await db.query(sqlSelectUm, [id]);
      return res.render('colaboradores/_linha', { c: rows[0] });
    }

    return res.redirect('/colaboradores');

  } catch (error) {
    console.error('Erro ao atualizar colaborador:', error);

    // ✅ Trata erro de UNIQUE (caso race condition)
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).send('Já existe outro colaborador com esse nome nesta empresa (duplicado detectado).');
    }

    return res.status(500).send('Erro ao atualizar colaborador');
  }
};

exports.toggleAtivo = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.query('SELECT ativo FROM colaboradores WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).send('Colaborador não encontrado');

    const ativoAtual = rows[0].ativo;
    const novoAtivo = !ativoAtual;

    await db.query('UPDATE colaboradores SET ativo = ? WHERE id = ?', [novoAtivo, id]);
    return res.redirect('/colaboradores');

  } catch (error) {
    console.error('Erro ao alterar status do colaborador:', error);
    return res.status(500).send('Erro ao alterar status do colaborador');
  }
};
