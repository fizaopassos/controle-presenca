// controllers/dashboardController.js
const db = require('../config/db');

exports.show = async (req, res) => {
  try {
    const usuario = req.session.user;
    const isAdmin = usuario.perfil === 'admin';
    
    const dataSelecionada = req.query.data || new Date().toISOString().slice(0, 10);

    let permitidos = [];
    if (!isAdmin) {
      permitidos = Array.isArray(usuario.condominios) ? usuario.condominios.map(c => Number(c.id)) : [];
      if (permitidos.length === 0) permitidos = [0];
    }

    // 1. CONDOMÍNIOS PARA O SELECT
    let condominios;
    if (isAdmin) {
      [condominios] = await db.query(`SELECT id, nome FROM condominios WHERE ativo = 1 ORDER BY nome`);
    } else {
      [condominios] = await db.query(`SELECT id, nome FROM condominios WHERE ativo = 1 AND id IN (?) ORDER BY nome`, [permitidos]);
    }

    // 2. STATUS DO DIA
    let condominiosStatus;
    if (isAdmin) {
      [condominiosStatus] = await db.query(`
        SELECT c.id, c.nome,
        EXISTS (SELECT 1 FROM presencas_diarias WHERE condominio_id = c.id AND data = ?) as tem_lancamento
        FROM condominios c WHERE c.ativo = 1 ORDER BY c.nome
      `, [dataSelecionada]);
    } else {
      [condominiosStatus] = await db.query(`
        SELECT c.id, c.nome,
        EXISTS (SELECT 1 FROM presencas_diarias WHERE condominio_id = c.id AND data = ?) as tem_lancamento
        FROM condominios c WHERE c.ativo = 1 AND c.id IN (?) ORDER BY c.nome
      `, [dataSelecionada, permitidos]);
    }

    // 3. IDENTIFICAR "INICIADOS" (tem lançamento mas não finalizou todos)
    const idsComLancamento = condominiosStatus
      .filter(c => c.tem_lancamento)
      .map(c => c.id);

    let naoCompletos = [];

    if (idsComLancamento.length > 0) {
      // EXATAMENTE 3 datas (uma pra cada ? dentro do NOT EXISTS)
      const params = [dataSelecionada, dataSelecionada, dataSelecionada];

      if (isAdmin) {
        [naoCompletos] = await db.query(`
          SELECT c.id
          FROM condominios c
          WHERE c.id IN (${idsComLancamento.map(() => '?').join(',')})
          AND NOT EXISTS (
            SELECT 1
            FROM colaboradores col
            LEFT JOIN presencas_diarias pd
              ON pd.colaborador_id = col.id AND pd.data = ?
            WHERE col.condominio_id = c.id
              AND col.tipo = 'fixo'
              AND COALESCE(col.data_inicio, DATE(col.criado_em)) <= ?
              AND (col.inativado_em IS NULL OR DATE(col.inativado_em) > ?)
            GROUP BY col.condominio_id
            HAVING COUNT(DISTINCT col.id) = COUNT(DISTINCT pd.colaborador_id)
          )
        `, [...idsComLancamento, ...params]);
      } else {
        [naoCompletos] = await db.query(`
          SELECT c.id
          FROM condominios c
          WHERE c.id IN (${idsComLancamento.map(() => '?').join(',')})
          AND c.id IN (?)
          AND NOT EXISTS (
            SELECT 1
            FROM colaboradores col
            LEFT JOIN presencas_diarias pd
              ON pd.colaborador_id = col.id AND pd.data = ?
            WHERE col.condominio_id = c.id
              AND col.tipo = 'fixo'
              AND COALESCE(col.data_inicio, DATE(col.criado_em)) <= ?
              AND (col.inativado_em IS NULL OR DATE(col.inativado_em) > ?)
            GROUP BY col.condominio_id
            HAVING COUNT(DISTINCT col.id) = COUNT(DISTINCT pd.colaborador_id)
          )
        `, [...idsComLancamento, permitidos, ...params]);
      }
    }

    const naoCompletosIds = naoCompletos.map(c => c.id);

    // 4. DEFINIR STATUS FINAL DE CADA CONDOMÍNIO
    condominiosStatus = condominiosStatus.map(c => {
      if (c.tem_lancamento && naoCompletosIds.includes(c.id)) {
        return { ...c, status: 'iniciado' };
      } else if (c.tem_lancamento) {
        return { ...c, status: 'completo' };
      } else {
        return { ...c, status: 'pendente' };
      }
    });

    // 5. RESUMO DO STATUS (usando status real)
    const totalCondominios = condominiosStatus.length;
    const totalLancados = condominiosStatus.filter(c => c.status === 'completo').length;
    const totalPendentes = condominiosStatus.filter(c => c.status === 'pendente').length;
    const percentual = totalCondominios > 0 
      ? Math.round((totalLancados / totalCondominios) * 100)
      : 0;

    // 6. RESUMO GERAL DOS CARDS
    let resumoGeral;
    if (isAdmin) {
      const [rows] = await db.query(`
        SELECT 
          (SELECT COUNT(*) FROM condominios WHERE ativo = 1) as condominios,
          (SELECT COUNT(*) FROM colaboradores WHERE ativo = 1) as colaboradores,
          (SELECT COUNT(*) FROM condominio_postos) as postos,
          (SELECT COUNT(*) FROM empresas WHERE ativo = 1) as empresas
      `);
      resumoGeral = rows[0];
    } else {
      const [rows] = await db.query(`
        SELECT 
          (SELECT COUNT(*) FROM condominios WHERE ativo = 1 AND id IN (?)) as condominios,
          (SELECT COUNT(*) FROM colaboradores WHERE ativo = 1 AND condominio_id IN (?)) as colaboradores,
          (SELECT COUNT(*) FROM condominio_postos WHERE condominio_id IN (?)) as postos,
          (SELECT COUNT(DISTINCT empresa_id) FROM colaboradores WHERE ativo = 1 AND condominio_id IN (?) AND empresa_id IS NOT NULL) as empresas
      `, [permitidos, permitidos, permitidos, permitidos]);
      resumoGeral = rows[0];
    }

    res.render('layout', {
      title: 'Dashboard',
      menuAtivo: 'dashboard',
      page: 'dashboard/index',
      usuario,
      condominiosStatus,
      condominios,
      resumoGeral: resumoGeral || { condominios: 0, colaboradores: 0, postos: 0, empresas: 0 },
      dataSelecionada,
      totalCondominios,
      totalLancados,
      totalPendentes,
      percentual
    });

  } catch (err) {
    console.error('Erro ao carregar dashboard:', err);
    res.status(500).send('Erro ao carregar dashboard');
  }
};

exports.resumo = async (req, res) => {
  try {
    const { condominio_id } = req.query;
    const usuario = req.session.user;
    const isAdmin = usuario.perfil === 'admin';

    let permitidos = [];
    if (!isAdmin) {
      permitidos = Array.isArray(usuario.condominios) ? usuario.condominios.map(c => Number(c.id)) : [];
      if (permitidos.length === 0) permitidos = [0];
    }

    if (condominio_id) {
      const idNum = Number(condominio_id);
      if (!isAdmin && !permitidos.includes(idNum)) {
        return res.status(403).json({ erro: 'Acesso negado a este condomínio' });
      }

      const [rows] = await db.query(`
        SELECT
          (SELECT COUNT(*) FROM colaboradores WHERE condominio_id = ? AND ativo = 1) AS colaboradores,
          (SELECT COUNT(*) FROM condominio_postos WHERE condominio_id = ?) AS postos,
          (SELECT COUNT(DISTINCT empresa_id) FROM colaboradores WHERE condominio_id = ? AND ativo = 1 AND empresa_id IS NOT NULL) AS empresas
      `, [idNum, idNum, idNum]);

      return res.json(rows[0] || { colaboradores: 0, postos: 0, empresas: 0 });
    }

    if (isAdmin) {
      const [rows] = await db.query(`
        SELECT
          (SELECT COUNT(*) FROM colaboradores WHERE ativo = 1) AS colaboradores,
          (SELECT COUNT(*) FROM condominio_postos) AS postos,
          (SELECT COUNT(*) FROM empresas WHERE ativo = 1) AS empresas
      `);
      return res.json(rows[0] || { colaboradores: 0, postos: 0, empresas: 0 });
    } else {
      const [rows] = await db.query(`
        SELECT
          (SELECT COUNT(*) FROM colaboradores WHERE ativo = 1 AND condominio_id IN (?)) AS colaboradores,
          (SELECT COUNT(*) FROM condominio_postos WHERE condominio_id IN (?)) AS postos,
          (SELECT COUNT(DISTINCT empresa_id) FROM colaboradores WHERE ativo = 1 AND condominio_id IN (?) AND empresa_id IS NOT NULL) AS empresas
      `, [permitidos, permitidos, permitidos]);
      return res.json(rows[0] || { colaboradores: 0, postos: 0, empresas: 0 });
    }

  } catch (err) {
    console.error('Erro ao carregar resumo do dashboard:', err);
    res.status(500).json({ colaboradores: 0, postos: 0, empresas: 0, erro: 'Erro no servidor' });
  }
};
