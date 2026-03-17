(function definirPeriodoPadrao() {

const hoje = new Date();
const inicioDoMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

document.getElementById('dataInicio').valueAsDate = inicioDoMes;
document.getElementById('dataFim').valueAsDate = hoje;

})();

let presencasGlobal = [];

let paginaAtual = 1;
let registrosPorPagina = 30;

let colunaOrdenacao = null;
let direcaoOrdenacao = 'asc';

let timeoutBusca;

function formatarData(valor){

if(!valor) return '-';

var d = new Date(valor);

if(!isNaN(d.getTime())){
return d.toLocaleDateString('pt-BR');
}

if(typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(valor)){

var partes = valor.split('-');

return partes[2] + '/' + partes[1] + '/' + partes[0];

}

return valor;

}

document.getElementById('btnBuscar').addEventListener('click', async function(){

const dataInicio = document.getElementById('dataInicio').value;
const dataFim = document.getElementById('dataFim').value;

if(!dataInicio || !dataFim){

alert('Informe Data Início e Data Fim');
return;

}

const params = new URLSearchParams();

params.append('data_inicio', dataInicio);
params.append('data_fim', dataFim);

const condominio = document.getElementById('condominio').value;
const empresa = document.getElementById('empresa').value;
const colaborador = document.getElementById('colaboradorId').value;
const status = document.getElementById('status').value;

if(condominio) params.append('condominio_id', condominio);
if(empresa) params.append('empresa_id', empresa);
if(colaborador) params.append('colaborador_id', colaborador);
if(status) params.append('status', status);

try{

const res = await fetch('/presenca/api/consultar?' + params.toString());

presencasGlobal = await res.json();

paginaAtual = 1;

renderizarResultados();

}catch(error){

console.error(error);
alert('Erro ao buscar presenças');

}

});

function renderizarResultados(){

const areaResultados = document.getElementById('areaResultados');

if(!presencasGlobal || presencasGlobal.length === 0){

areaResultados.innerHTML =
'<div class="alert alert-warning">Nenhum registro encontrado.</div>';

return;

}

const totalPaginas = Math.ceil(presencasGlobal.length / registrosPorPagina);

const inicio = (paginaAtual - 1) * registrosPorPagina;
const fim = inicio + registrosPorPagina;

const dadosPagina = presencasGlobal.slice(inicio, fim);

let html = '<div class="table-responsive">';
html += '<table class="table table-striped table-hover table-sm">';

html += '<thead class="table-dark">';
html += '<tr>';

html += '<th onclick="ordenarPor(\'data\')" style="cursor:pointer;">Data</th>';
html += '<th onclick="ordenarPor(\'condominio\')" style="cursor:pointer;">Condomínio</th>';
html += '<th onclick="ordenarPor(\'colaborador\')" style="cursor:pointer;">Colaborador</th>';
html += '<th onclick="ordenarPor(\'empresa\')" style="cursor:pointer;">Empresa</th>';
html += '<th onclick="ordenarPor(\'posto\')" style="cursor:pointer;">Posto</th>';
html += '<th>Status</th>';
html += '<th>Observações</th>';

html += '</tr>';
html += '</thead>';

html += '<tbody>';

dadosPagina.forEach(function(p){

const dataFormatada = formatarData(p.data);
const statusBadge = getStatusBadge(p.status);

html += '<tr>';

html += '<td>'+dataFormatada+'</td>';
html += '<td>'+p.condominio+'</td>';
html += '<td>'+p.colaborador+'</td>';
html += '<td>'+(p.empresa || '-')+'</td>';
html += '<td>'+(p.posto || '-')+'</td>';
html += '<td>'+statusBadge+'</td>';
html += '<td>'+(p.observacoes || '-')+'</td>';

html += '</tr>';

});

html += '</tbody></table></div>';

html += montarPaginacao(totalPaginas);

areaResultados.innerHTML = html;

document.getElementById('totalRegistros').textContent =
presencasGlobal.length + ' registro(s)';

document.getElementById('btnExportar').disabled = false;

}

function montarPaginacao(totalPaginas){

let html = '<div class="d-flex justify-content-between align-items-center mt-3">';

html += '<div>';

html += 'Mostrar ';

html += '<select onchange="mudarLimite(this.value)" class="form-select form-select-sm d-inline-block" style="width:auto;">';

[10,25,50,100].forEach(function(n){

html += '<option value="'+n+'" '+(n==registrosPorPagina?'selected':'')+'>'+n+'</option>';

});

html += '</select> registros';

html += '</div>';

html += '<div class="btn-group">';

if(paginaAtual>1){

html += '<button class="btn btn-sm btn-outline-primary" onclick="mudarPagina(1)">«</button>';
html += '<button class="btn btn-sm btn-outline-primary" onclick="mudarPagina('+(paginaAtual-1)+')">‹</button>';

}

let inicio = Math.max(1,paginaAtual-2);
let fim = Math.min(totalPaginas,paginaAtual+2);

for(let i=inicio;i<=fim;i++){

html += '<button class="btn btn-sm '+(i==paginaAtual?'btn-primary':'btn-outline-primary')+'" onclick="mudarPagina('+i+')">'+i+'</button>';

}

if(paginaAtual<totalPaginas){

html += '<button class="btn btn-sm btn-outline-primary" onclick="mudarPagina('+(paginaAtual+1)+')">›</button>';
html += '<button class="btn btn-sm btn-outline-primary" onclick="mudarPagina('+totalPaginas+')">»</button>';

}

html += '</div></div>';

return html;

}

window.mudarPagina = function(p){

paginaAtual = p;

renderizarResultados();

}

window.mudarLimite = function(n){

registrosPorPagina = parseInt(n);

paginaAtual = 1;

renderizarResultados();

}

window.ordenarPor = function(coluna){

if(colunaOrdenacao === coluna){

direcaoOrdenacao = direcaoOrdenacao === 'asc' ? 'desc' : 'asc';

}else{

colunaOrdenacao = coluna;
direcaoOrdenacao = 'asc';

}

presencasGlobal.sort(function(a,b){

let v1 = a[coluna] || '';
let v2 = b[coluna] || '';

if(v1 < v2) return direcaoOrdenacao === 'asc' ? -1 : 1;
if(v1 > v2) return direcaoOrdenacao === 'asc' ? 1 : -1;

return 0;

});

renderizarResultados();

}

function getStatusBadge(status){

const badges = {

presente:'<span class="badge bg-success">Presente</span>',
falta:'<span class="badge bg-danger">Falta</span>',
folga:'<span class="badge bg-secondary">Folga</span>',
atestado:'<span class="badge bg-warning text-dark">Atestado</span>',
ferias:'<span class="badge bg-info text-dark">Férias</span>',
em_cobertura:'<span class="badge bg-dark">Em cobertura</span>'

};

return badges[status] || '<span class="badge bg-light text-dark">'+(status || 'Não lançado')+'</span>';

}

/* =========================
   AUTOCOMPLETE COLABORADOR
========================= */

document.getElementById('colaboradorBusca').addEventListener('input', function () {

const termo = this.value;

clearTimeout(timeoutBusca);

if (termo.length < 2) {

document.getElementById('colaboradorSugestoes').style.display = 'none';
document.getElementById('colaboradorId').value = '';

return;

}

timeoutBusca = setTimeout(async function () {

try {

const condominioId = document.getElementById('condominio').value;
const empresaId = document.getElementById('empresa').value;

let url = '/presenca/api/colaboradores?termo=' + encodeURIComponent(termo);

if (condominioId) url += '&condominio_id=' + condominioId;
if (empresaId) url += '&empresa_id=' + empresaId;

const res = await fetch(url);
const colaboradores = await res.json();

const divSug = document.getElementById('colaboradorSugestoes');

divSug.innerHTML = '';

if (!colaboradores.length) {

divSug.style.display = 'none';
return;

}

colaboradores.forEach(function (c) {

const item = document.createElement('a');

item.href = '#';
item.className = 'list-group-item list-group-item-action';

let texto = c.nome;

if (c.empresa) texto += ' - ' + c.empresa;
if (c.condominio) texto += ' (' + c.condominio + ')';

item.textContent = texto;

item.onclick = function (e) {

e.preventDefault();

document.getElementById('colaboradorBusca').value = c.nome;
document.getElementById('colaboradorId').value = c.id;

divSug.style.display = 'none';

if (c.condominio_id) {

document.getElementById('condominio').value = c.condominio_id;

}

document.getElementById('btnExportarPdfDetalhado').classList.remove('d-none');

};

divSug.appendChild(item);

});

divSug.style.display = 'block';

} catch (error) {

console.error('Erro ao buscar colaboradores:', error);

}

}, 300);

});


/* =========================
   LIMPAR FILTROS
========================= */

document.getElementById('btnLimpar').addEventListener('click', function () {

const hoje = new Date();
const seteDiasAtras = new Date();

seteDiasAtras.setDate(hoje.getDate() - 7);

document.getElementById('dataInicio').valueAsDate = seteDiasAtras;
document.getElementById('dataFim').valueAsDate = hoje;

document.getElementById('condominio').value = '';
document.getElementById('empresa').value = '';
document.getElementById('status').value = '';

document.getElementById('colaboradorBusca').value = '';
document.getElementById('colaboradorId').value = '';

document.getElementById('btnExportarPdfDetalhado').classList.add('d-none');

document.getElementById('areaResultados').innerHTML =
'<div class="text-center text-muted py-5"><i class="bi bi-inbox" style="font-size:3rem;opacity:.3;"></i><p class="mt-3">Selecione os filtros e clique em <strong>Buscar</strong>.</p></div>';

document.getElementById('totalRegistros').textContent = '0 registros';

});


/* =========================
   PDF MENSAL
========================= */

document.getElementById('btnExportarPdfMensal').addEventListener('click', function(){

const condId = document.getElementById('condominio').value;
const dataInicio = document.getElementById('dataInicio').value;

if(!condId || !dataInicio){

alert('Selecione condomínio e data inicial');

return;

}

const mes = dataInicio.slice(0,7);

const url =
`/presenca/relatorios/mensal/pdf?condominio_id=${condId}&mes=${mes}`;

window.open(url,'_blank');

});


/* =========================
   PDF DETALHADO
========================= */

document.getElementById('btnExportarPdfDetalhado').addEventListener('click', function(){

const dataInicio = document.getElementById('dataInicio').value;
const colaboradorId = document.getElementById('colaboradorId').value;

if(!dataInicio || !colaboradorId){

alert('Selecione colaborador e mês');

return;

}

const mes = dataInicio.slice(0,7);

const url =
`/presenca/relatorios/colaborador/pdf?colaborador_id=${colaboradorId}&mes=${mes}`;

window.open(url,'_blank');

});
