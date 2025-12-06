// Referências globais
const controlsArea = document.getElementById('controls-area');
const productDisplay = document.getElementById('product-display');
const navItems = document.querySelectorAll('.nav-item');

// Referências das camadas de imagem
const layerBase = document.getElementById('layer-base');
const layerAluminio = document.getElementById('layer-aluminio');
const layerVidro = document.getElementById('layer-vidro');
const layerPuxador = document.getElementById('layer-puxador');

let allCatalogData = {}; // Armazenará todos os dados do JSON
let currentCategory = 'portas'; // Categoria ativa
let currentProduct = null; // O objeto do produto atualmente selecionado
let currentSelections = {}; // Armazena as seleções atuais do usuário

// Função principal para carregar o JSON
async function loadCatalogData() {
    try {
        const response = await fetch('data.json');
        if (!response.ok) {
            throw new Error(`Erro ao carregar data.json: ${response.statusText}`);
        }
        const data = await response.json();
        allCatalogData = data.categorias;
        
        // Inicia o catálogo com a primeira categoria (Portas)
        initializeCatalog(currentCategory); 

    } catch (error) {
        console.error("Não foi possível carregar os dados:", error);
        controlsArea.innerHTML = '<p class="error-message">Erro ao carregar dados do catálogo. Verifique o arquivo data.json.</p>';
    }
}

// Inicializa a categoria
function initializeCatalog(categoryName) {
    const products = allCatalogData[categoryName];
    if (products && products.length > 0) {
        // Seleciona o primeiro produto por padrão
        selectProduct(products[0]);
    } else {
        controlsArea.innerHTML = `<p>Nenhum produto encontrado na categoria "${categoryName}".</p>`;
        // Limpa visualizador
        layerBase.src = '';
        clearLayers(); 
    }
    // Adiciona evento de mudança de categoria
    setupCategoryNavigation();
}
// Limpa todas as camadas de variação
function clearLayers() {
    layerAluminio.src = '';
    layerVidro.src = '';
    layerPuxador.src = '';
}

// Seleciona e carrega um novo produto
function selectProduct(product) {
    currentProduct = product;
    
    // Define o estado inicial do produto
    currentSelections = {
        aluminio: product.variacoes.cores_aluminio[0].valor,
        vidro: product.variacoes.cores_vidro[0].valor,
        puxador: product.variacoes.puxadores[0].valor,
        modelo: product.id
    };

    // 1. Atualiza a imagem base
    layerBase.src = currentProduct.imagem_base;

    // 2. Monta os controles na Coluna da Direita
    renderControls();

    // 3. Atualiza a visualização com as seleções padrão
    updateVisualizer();
}

// Função para gerar os controles dinamicamente (Portas)
function renderControls() {
    controlsArea.innerHTML = ''; // Limpa a área de controles

    // 1. Controle de Modelo (Select)
    const products = allCatalogData[currentCategory];
    let modelHTML = `
        <div class="control-group">
            <label for="select-model">Modelo do Produto:</label>
            <select id="select-model" onchange="handleModelChange(this.value)">
    `;
    products.forEach(p => {
        modelHTML += `<option value="${p.id}" ${p.id === currentProduct.id ? 'selected' : ''}>${p.nome}</option>`;
    });
    modelHTML += `
            </select>
        </div>
    `;
    controlsArea.innerHTML += modelHTML;


    // 2. Controles de Variação (Botões)
    const variacoes = currentProduct.variacoes;

    // --- Cor do Alumínio ---
    controlsArea.innerHTML += `
        <div class="control-group">
            <label>Cor do Alumínio:</label>
            <div id="options-aluminio" class="option-buttons">
                ${variacoes.cores_aluminio.map(v => 
                    `<button class="option-button ${v.valor === currentSelections.aluminio ? 'active' : ''}" 
                             data-type="aluminio" data-value="${v.valor}">
                        ${v.label}
                    </button>`
                ).join('')}
            </div>
        </div>
    `;

    // --- Cor do Vidro ---
    controlsArea.innerHTML += `
        <div class="control-group">
            <label>Cor do Vidro:</label>
            <div id="options-vidro" class="option-buttons">
                ${variacoes.cores_vidro.map(v => 
                    `<button class="option-button ${v.valor === currentSelections.vidro ? 'active' : ''}" 
                             data-type="vidro" data-value="${v.valor}">
                        ${v.label}
                    </button>`
                ).join('')}
            </div>
        </div>
    `;

    // --- Puxador ---
    controlsArea.innerHTML += `
        <div class="control-group">
            <label>Puxador:</label>
            <div id="options-puxador" class="option-buttons">
                ${variacoes.puxadores.map(v => 
                    `<button class="option-button ${v.valor === currentSelections.puxador ? 'active' : ''}" 
                             data-type="puxador" data-value="${v.valor}">
                        ${v.label}
                    </button>`
                ).join('')}
            </div>
        </div>
    `;

    // Adiciona o evento de clique aos novos botões gerados
    document.querySelectorAll('.option-button').forEach(button => {
        button.addEventListener('click', handleVariationChange);
    });
}
// --- MANIPULADORES DE EVENTOS ---

// Manipula a troca de modelo no <select>
function handleModelChange(modelId) {
    const newProduct = allCatalogData[currentCategory].find(p => p.id === modelId);
    if (newProduct) {
        selectProduct(newProduct);
    }
}

// Manipula o clique nos botões de variação (cor, puxador)
function handleVariationChange(event) {
    const button = event.currentTarget;
    const type = button.getAttribute('data-type');
    const value = button.getAttribute('data-value');

    // 1. Remove 'active' de todos os botões do mesmo tipo
    document.querySelectorAll(`[data-type="${type}"]`).forEach(btn => btn.classList.remove('active'));
    // 2. Adiciona 'active' no botão clicado
    button.classList.add('active');

    // 3. Atualiza a seleção atual
    currentSelections[type] = value;

    // 4. Atualiza a visualização do produto
    updateVisualizer();
}

// Configura a navegação de categorias
function setupCategoryNavigation() {
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const newCategory = e.currentTarget.getAttribute('data-category');
            if (newCategory !== currentCategory) {
                currentCategory = newCategory;
                
                // Atualiza o estado visual da navegação
                navItems.forEach(i => i.classList.remove('active'));
                e.currentTarget.classList.add('active');
                
                // Recarrega o catálogo para a nova categoria
                initializeCatalog(currentCategory);
            }
        });
    });
}

// --- ATUALIZAÇÃO DA VISUALIZAÇÃO (O CORE) ---

function updateVisualizer() {
    const { aluminio, vidro, puxador } = currentSelections;
    const variacoes = currentProduct.variacoes;

    // 1. Atualiza a Cor do Alumínio
    const alumData = variacoes.cores_aluminio.find(v => v.valor === aluminio);
    if (alumData) {
        layerAluminio.src = alumData.path;
    }

    // 2. Atualiza a Cor do Vidro
    const vidroData = variacoes.cores_vidro.find(v => v.valor === vidro);
    if (vidroData) {
        layerVidro.src = vidroData.path;
    }

    // 3. Atualiza o Puxador
    const puxData = variacoes.puxadores.find(v => v.valor === puxador);
    if (puxData) {
        layerPuxador.src = puxData.path;
    }

    // 4. Atualiza o Resumo de Especificações
    updateSpecsSummary();
}

function updateSpecsSummary() {
    // Função para buscar o 'label' pelo 'valor' em um array
    const getLabel = (type, value) => {
        const variation = currentProduct.variacoes[type].find(v => v.valor === value);
        return variation ? variation.label : 'N/A';
    };

    document.getElementById('spec-modelo').textContent = currentProduct.nome;
    document.getElementById('spec-acabamento').textContent = currentProduct.acabamento;
    document.getElementById('spec-cor-aluminio').textContent = getLabel('cores_aluminio', currentSelections.aluminio);
    // Você pode expandir esta função para incluir as especificações de Vidro, Puxador e Dimensão
}


// Inicia o processo quando a página é carregada
loadCatalogData();