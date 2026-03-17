document.addEventListener("DOMContentLoaded", function () {
  
  // 1. Pegando os elementos da tela
  const select = document.getElementById("condominioDashboard");
  const totalColabs = document.getElementById("totalColabs");
  const totalPostos = document.getElementById("totalPostos");
  const totalEmpresas = document.getElementById("totalEmpresas");
  const cardColabs = document.getElementById("cardColabs");

  // Guarda os valores originais GERAIS pra voltar quando selecionar "Geral"
  let valoresGerais = null;

  // Se algum campo faltar, a gente para por aqui pra não dar erro silencioso
  if (!select || !totalColabs || !totalPostos || !totalEmpresas) {
      console.warn("[Dashboard] Faltam elementos na tela para atualizar o resumo.");
      return;
  }

  // Salva os valores que já vieram renderizados pelo EJS (o resumoGeral)
  valoresGerais = {
    colaboradores: totalColabs.innerText,
    postos: totalPostos.innerText,
    empresas: totalEmpresas.innerText
  };

  // 2. Função que busca e atualiza
  async function atualizarCards() {
    const condominioId = select.value;

    // Se voltou pro "Geral" (value vazio)
    if (!condominioId) {
       totalColabs.innerText = valoresGerais.colaboradores;
       totalPostos.innerText = valoresGerais.postos;
       totalEmpresas.innerText = valoresGerais.empresas;
       return;
    }

    // Efeito de loading básico nos números
    totalColabs.innerHTML = '<span class="spinner-border spinner-border-sm text-primary" role="status"></span>';
    totalPostos.innerHTML = '<span class="spinner-border spinner-border-sm text-success" role="status"></span>';
    totalEmpresas.innerHTML = '<span class="spinner-border spinner-border-sm text-warning" role="status"></span>';

    try {
      // Chama a API que você testou e tá funcionando
      const res = await fetch(`/dashboard/api/resumo?condominio_id=${condominioId}`);
      
      if (!res.ok) throw new Error("Erro na resposta da API");
      
      const data = await res.json();

      // Atualiza com os dados reais
      totalColabs.innerText = data.colaboradores ?? 0;
      totalPostos.innerText = data.postos ?? 0;
      totalEmpresas.innerText = data.empresas ?? 0;

    } catch (error) {
      console.error("[Dashboard] Erro ao buscar resumo:", error);
      // Se der erro, zera ou bota um traço
      totalColabs.innerText = '-';
      totalPostos.innerText = '-';
      totalEmpresas.innerText = '-';
    }
  }

  // 3. Coloca o "escutador" pra quando trocar o select
  select.addEventListener("change", atualizarCards);

  // 4. O clique no card de colaboradores (atalho)
  if (cardColabs) {
    cardColabs.addEventListener("click", () => {
      const cond = select.value;
      if (cond) {
        window.location.href = `/colaboradores?condominio_id=${cond}`;
      } else {
        window.location.href = `/colaboradores`;
      }
    });
  }

    // 5. Configurar Filtro de Data do Status
  const inputData = document.getElementById("filtroDataStatus");
  if (inputData && window.flatpickr) {
    flatpickr(inputData, {
      dateFormat: "Y-m-d",         // Formato que vai para a URL e para o banco
      altInput: true,              // Cria um campo mais bonito pra quem vê
      altFormat: "d/m/Y",          // Formato brasileiro pro usuário final
      locale: "pt",                // Em português
      defaultDate: inputData.value,
      onChange: function(selectedDates, dateStr) {
        if(dateStr) {
          // Quando o usuário escolhe a data, a página dá um reload passando "?data=XYZ"
          window.location.href = `/dashboard?data=${dateStr}`;
        }
      }

      
    });
  }

  // Aplicar largura da barra de progresso
const progressBar = document.querySelector('.progress-bar');
if (progressBar) {
  const percentual = progressBar.getAttribute('data-percentual');
  progressBar.style.width = percentual + '%';
}



});
