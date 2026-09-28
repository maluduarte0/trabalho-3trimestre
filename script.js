/* =========================================================
   script.js — EcoTroca & Doação de Roupas
   ========================================================= */

// Chave para armazenar os dados no localStorage do navegador
const CHAVE = "ecoTrocaRoupas-dados";

// Seleção de elementos da DOM
const formulario = document.getElementById("formulario");
const listaEl    = document.getElementById("lista");
const painel     = document.getElementById("painel");
const busca      = document.getElementById("busca");
const filtro     = document.getElementById("filtro");
const aviso      = document.getElementById("aviso");

/* ---------- 1. LER o que está salvo no localStorage ---------- */
function lerFichas(){
  const texto = localStorage.getItem(CHAVE);
  if(!texto) return [];
  try { return JSON.parse(texto); } catch(erro){ return []; }
}

/* ---------- 2. GRAVAR no localStorage ---------- */
function gravarFichas(fichas){
  localStorage.setItem(CHAVE, JSON.stringify(fichas));
}

/* ---------- 3. Sanitização contra código malicioso ---------- */
function escapar(texto){
  const caixa = document.createElement("div");
  caixa.textContent = texto || "";
  return caixa.innerHTML;
}

/* ---------- 4. EXIBIR peças no mural ---------- */
function mostrar(){
  const fichas = lerFichas();
  const termo = busca.value.trim().toLowerCase();
  const escolhida = filtro.value;

  const visiveis = fichas.filter(function(f){
    const passaFiltro = (escolhida === "todas") || (f.categoria === escolhida);
    const textoTodo = Object.values(f).join(" ").toLowerCase();
    const passaBusca = (termo === "") || (textoTodo.indexOf(termo) >= 0);
    return passaFiltro && passaBusca;
  });

  listaEl.innerHTML = "";

  if(visiveis.length === 0){
    listaEl.innerHTML = '<p class="vazio">Nenhuma peça encontrada no mural. Anuncie uma peça no formulário acima!</p>';
    desenharPainel(fichas);
    return;
  }

  visiveis.forEach(function(f){
    const cartao = document.createElement("article");
    cartao.className = "cartao";
    
    let html = "";
    html += '<span class="tag-acao">' + escapar(f.tipoAcao) + '</span>';
    html += "<h3>" + escapar(f.tituloDaAcao) + "</h3>";
    html += '<span class="etiqueta">Categoria: ' + escapar(f.categoria) + ' | Tamanho: ' + escapar(f.tamanho) + '</span>';
    html += "<p><b>Ponto de Retirada/Contato:</b> " + escapar(f.local) + "</p>";
    html += "<p><b>Descrição:</b> " + escapar(f.oQueFoiFeito) + "</p>";
    html += '<footer><small>Anunciado em: ' + escapar(f.data) + '</small>' +
            '<button type="button" class="apagar" data-id="' + f.id + '">Excluir</button></footer>';
    
    cartao.innerHTML = html;
    listaEl.appendChild(cartao);
  });

  desenharPainel(fichas);
}

/* ---------- 5. PAINEL E INDICADOR DE IMPACTO ---------- */
function desenharPainel(fichas){
  let html = "";
  html += '<div class="numero"><b>' + fichas.length + "</b><span>peças registradas</span></div>";
  
  const doacoes = fichas.filter(function(f){ return f.tipoAcao === "Doação"; }).length;
  const trocas = fichas.filter(function(f){ return f.tipoAcao === "Troca"; }).length;
  
  html += '<div class="numero pequeno"><b>' + doacoes + "</b><span>para Doação</span></div>";
  html += '<div class="numero pequeno"><b>' + trocas + "</b><span>para Troca</span></div>";

  painel.innerHTML = html;
}

/* ---------- 6. SALVAR nova peça cadastrada ---------- */
formulario.addEventListener("submit", function(evento){
  evento.preventDefault();

  const nova = {
    id: Date.now(),
    tituloDaAcao: document.getElementById("tituloDaAcao").value.trim(),
    tipoAcao: document.getElementById("tipoAcao").value,
    categoria: document.getElementById("categoria").value,
    tamanho: document.getElementById("tamanho").value,
    local: document.getElementById("local").value.trim(),
    oQueFoiFeito: document.getElementById("oQueFoiFeito").value.trim(),
    data: new Date().toLocaleDateString("pt-BR")
  };

  const fichas = lerFichas();
  fichas.unshift(nova);
  gravarFichas(fichas);

  formulario.reset();
  mostrar();
  
  aviso.textContent = "Peça cadastrada com sucesso no mural!";
  setTimeout(function(){ aviso.textContent = ""; }, 4000);
});

/* ---------- 7. EXCLUIR registro ---------- */
listaEl.addEventListener("click", function(evento){
  if(!evento.target.classList.contains("apagar")) return;
  const id = Number(evento.target.getAttribute("data-id"));
  const fichas = lerFichas().filter(function(f){ return f.id !== id; });
  gravarFichas(fichas);
  mostrar();
});

/* ---------- 8. BUSCA E FILTROS ---------- */
busca.addEventListener("input", mostrar);
filtro.addEventListener("change", mostrar);

document.getElementById("limpar").addEventListener("click", function(){
  if(confirm("Deseja apagar todos os registros salvos neste navegador?")){
    localStorage.removeItem(CHAVE);
    mostrar();
  }
});

/* ---------- 9. EXPORTAR E IMPORTAR BACKUP (JSON) ---------- */
document.getElementById("exportar").addEventListener("click", function(){
  const texto = JSON.stringify(lerFichas(), null, 2);
  const arquivo = new Blob([texto], {type: "application/json"});
  const link = document.createElement("a");
  link.href = URL.createObjectURL(arquivo);
  link.download = "dados-doacao-roupas.json";
  link.click();
  URL.revokeObjectURL(link.href);
});

document.getElementById("importar").addEventListener("change", function(evento){
  const arquivo = evento.target.files[0];
  if(!arquivo) return;
  const leitor = new FileReader();
  leitor.onload = function(){
    try {
      const recebidas = JSON.parse(leitor.result);
      if(!Array.isArray(recebidas)) throw new Error("Formato inválido");
      gravarFichas(recebidas.concat(lerFichas()));
      mostrar();
      aviso.textContent = recebidas.length + " peças importadas com sucesso.";
    } catch(erro){
      aviso.textContent = "Arquivo JSON de backup inválido.";
    }
  };
  leitor.readAsText(arquivo);
});

/* ---------- 10. INICIALIZAÇÃO ---------- */
mostrar();