document.body.addEventListener('htmx:confirm', function(evt) {
  // Cancela o confirm nativo
  evt.preventDefault();

  // Pega os atributos data-confirm-* do form
  const form = evt.detail.target;
  const title = form.getAttribute('data-confirm-title') || 'Confirmar';
  const body = form.getAttribute('data-confirm-body') || 'Tem certeza?';
  const okText = form.getAttribute('data-confirm-ok') || 'Sim';

  // Abre o modal (exemplo com Bootstrap)
  const modalHtml = `
    <div class="modal fade" id="confirmModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">${title}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">${body}</div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="button" class="btn btn-primary" id="confirmOkBtn">${okText}</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Remove modal antigo se existir
  const oldModal = document.getElementById('confirmModal');
  if (oldModal) oldModal.remove();

  // Insere o modal no body
  document.body.insertAdjacentHTML('beforeend', modalHtml);

  const modalEl = document.getElementById('confirmModal');
  const modal = new bootstrap.Modal(modalEl);
  modal.show();

  // Quando clicar em "Sim"
  document.getElementById('confirmOkBtn').addEventListener('click', function() {
    modal.hide();
    // Dispara o request do HTMX
    evt.detail.issueRequest();
  });

  // Limpa o modal ao fechar
  modalEl.addEventListener('hidden.bs.modal', function() {
    modalEl.remove();
  });
});
