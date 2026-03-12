document.addEventListener("DOMContentLoaded", function(){

const select = document.getElementById("condominioDashboard");

async function atualizar(){

const cond = select.value;

const res = await fetch(`/dashboard/api/resumo?condominio_id=${cond}`);
const data = await res.json();

document.getElementById("totalColabs").innerText = data.colaboradores;
document.getElementById("totalPostos").innerText = data.postos;
document.getElementById("totalEmpresas").innerText = data.empresas;

}

select.addEventListener("change", atualizar);

atualizar();

});

document.getElementById("cardColabs")
.addEventListener("click",()=>{

const cond = document.getElementById("condominioDashboard").value;

window.location = 'colaboradores?condominio_id=${cond}';

window.location = 'presenca/lancar?condominio_id=${cond}&data=${data}';



});