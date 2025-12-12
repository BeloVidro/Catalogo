// Referências globais
const controlsArea = document.getElementById('controls-area');
const navItems = document.querySelectorAll('.nav-item');

// Onde a imagem única será exibida (usando apenas a layer-base)
const layerBase = document.getElementById('layer-base'); 

let allCatalogData = {};
let currentCategory = 'portas';
let currentProduct = null;
let currentSelections = {}; 

// --- 1. FUNÇÕES DE INICIALIZAÇÃO ---

async function loadCatalogData() {
    try {
        // ATENÇÃO: Verifique se o nome do arquivo JSON está correto (data.json ou data_swap.json)
        const response = await fetch('data_swap.json'); 
        if (!response.ok) {
            throw new Error(`Erro ao carregar data_swap.json: ${response.statusText}`);
        }
        const data = await response.json();
        allCatalogData = data.categorias;
        
        // Não inicializa o catálogo automaticamente — mostra a tela inicial (landing)
        populateLandingFilters();

    } catch (error) {
        console.error("Não foi possível carregar os dados:", error);
        controlsArea.innerHTML = '<p class="error-message">Erro ao carregar dados do catálogo.</p>';
    }
}

function populateLandingFilters() {
    const categorySelect = document.getElementById('filter-category');
    const searchBtn = document.getElementById('search-btn');
    const previews = document.getElementById('landing-previews');

    function updatePreviews() {
        const cat = categorySelect.value;
        previews.innerHTML = '';
        const products = allCatalogData[cat] || [];
        if (!products || products.length === 0) {
            previews.innerHTML = '<p class="no-products">Nenhum produto disponível nesta categoria.</p>';
            return;
        }

        const thumbs = products.map(p => {
            let img = 'assets/img/sem_imagem_placeholder.jpg';
            // Prioriza o campo 'preview' se existir
            if (p.preview) {
                img = p.preview;
            } else if (p.combinacoes && p.combinacoes.length > 0) {
                img = p.combinacoes[0].path;
            }
            return `
                <button class="landing-thumb" data-model="${p.id}" title="${p.nome}" style="border:0;background:none;padding:6px;">
                    <img src="${img}" alt="${p.nome}">
                    <div class="thumb-label">${p.nome}</div>
                </button>
            `;
        }).join('');

        previews.innerHTML = `<div class="landing-thumbs">${thumbs}</div>`;

        // add click handlers
        previews.querySelectorAll('.landing-thumb').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modelId = btn.getAttribute('data-model');
                const cat = categorySelect.value;

                // Abre o catálogo e seleciona o produto
                currentCategory = cat;
                document.getElementById('landing').classList.add('hidden');
                document.getElementById('catalog').classList.remove('hidden');
                document.getElementById('toggle-controls').classList.remove('hidden');
                initializeCatalog(cat);

                setTimeout(() => {
                    handleModelChange(modelId);
                }, 50);

                const backBtn = document.getElementById('back-btn');
                if (backBtn) backBtn.classList.remove('hidden');
            });
        });
    }

    // Dispara atualização APENAS ao clicar no botão de busca
    if (searchBtn) {
        searchBtn.addEventListener('click', (e) => {
            e.preventDefault();
            updatePreviews();
        });
    }
}

// Função para voltar ao landing
function goToLanding() {
    document.getElementById('catalog').classList.add('hidden');
    document.getElementById('landing').classList.remove('hidden');
    document.getElementById('toggle-controls').classList.add('hidden');
    const backBtn = document.getElementById('back-btn');
    if (backBtn) backBtn.classList.add('hidden');
}

// Liga o botão flutuante ao comportamento de voltar
document.addEventListener('DOMContentLoaded', () => {
    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', (e) => {
            e.preventDefault();
            goToLanding();
        });
    }
});

function initializeCatalog(categoryName) {
    const products = allCatalogData[categoryName];
    if (products && products.length > 0) {
        selectProduct(products[0]);
    } else {
        controlsArea.innerHTML = `<p>Nenhum produto encontrado na categoria "${categoryName}".</p>`;
        layerBase.src = '';
    }
    setupCategoryNavigation();
    // Atualiza a exibição das sub-abas conforme a categoria atual
    setupSubtabs();
}

// --- 2.1 SUB-ABAS (visíveis apenas em algumas categorias) ---
function setupSubtabs() {
    const subtabs = document.getElementById('subtabs');
    const subtabContent = document.getElementById('subtab-content');
    if (!subtabs || !subtabContent) return;

    // Mostra subtabs somente para a categoria 'portas'
    if (currentCategory === 'portas') {
        subtabs.classList.remove('hidden');
        // Define evento nos itens de subtab
        document.querySelectorAll('#subtabs .subtab-item').forEach(item => {
            item.classList.remove('active');
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const name = item.getAttribute('data-subtab');
                showSubtab(name);
            });
        });

        // Ativa a sub-aba 'hoje' por padrão
        showSubtab('hoje');
    } else {
        subtabs.classList.add('hidden');
        subtabContent.classList.add('hidden');
        subtabContent.innerHTML = '';
    }
}

function showSubtab(name) {
    const subtabContent = document.getElementById('subtab-content');
    if (!subtabContent) return;

    // Atualiza classes ativas
    document.querySelectorAll('#subtabs .subtab-item').forEach(item => {
        item.classList.toggle('active', item.getAttribute('data-subtab') === name);
    });

    // Gera conteúdo para cada sub-aba
    if (name === 'hoje') {
        // Mostra miniaturas de todas as combinações do produto atual
        if (!currentProduct || !currentProduct.combinacoes) {
            subtabContent.innerHTML = '<p>Nenhum conteúdo disponível.</p>';
            subtabContent.classList.remove('hidden');
            return;
        }

        const thumbs = currentProduct.combinacoes.map(comb => {
            const label = `${comb.aluminio.charAt(0).toUpperCase() + comb.aluminio.slice(1)} / ${comb.vidro.charAt(0).toUpperCase() + comb.vidro.slice(1)}`;
            return `
                <button class="comb-thumb" data-aluminio="${comb.aluminio}" data-vidro="${comb.vidro}" title="${label}" style="border:0;background:none;padding:6px;">
                    <img src="${comb.path}" alt="${label}" style="width:80px;height:60px;object-fit:cover;border-radius:4px;border:1px solid #ddd;">
                    <div style="font-size:12px;color:#333;margin-top:4px">${label}</div>
                </button>
            `;
        }).join('');

        subtabContent.innerHTML = `
            <div style="display:flex;flex-wrap:wrap;gap:12px">${thumbs}</div>
        `;
        subtabContent.classList.remove('hidden');

        // Delegação de clique para as miniaturas
        subtabContent.querySelectorAll('.comb-thumb').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const a = btn.getAttribute('data-aluminio');
                const v = btn.getAttribute('data-vidro');
                // Atualiza seleções e visualizador
                currentSelections.aluminio = a;
                currentSelections.vidro = v;

                // Atualiza botões ativos na área de controles
                document.querySelectorAll('[data-type="aluminio"]').forEach(b => b.classList.toggle('active', b.getAttribute('data-value') === a));
                document.querySelectorAll('[data-type="vidro"]').forEach(b => b.classList.toggle('active', b.getAttribute('data-value') === v));

                updateVisualizer();
            });
        });

    } else if (name === 'detalhes') {
        // Conteúdo simples de detalhes (pode ser expandido)
        subtabContent.innerHTML = `
            <h4>Detalhes do Produto</h4>
            <p>Modelo: ${currentProduct ? currentProduct.nome : 'N/A'}</p>
            <p>Acabamento: ${currentProduct ? currentProduct.acabamento : 'N/A'}</p>
        `;
        subtabContent.classList.remove('hidden');
    } else {
        subtabContent.classList.add('hidden');
        subtabContent.innerHTML = '';
    }
}

function selectProduct(product) {
    currentProduct = product;
    
    // Define o estado inicial com as primeiras opções (Alumínio e Vidro)
    currentSelections = {
        aluminio: currentProduct.opcoes.cores_aluminio[0],
        vidro: currentProduct.opcoes.cores_vidro[0]
        // Puxador removido
    };

    renderControls();
    updateVisualizer(); // Carrega a imagem inicial
}

function setupCategoryNavigation() {
    navItems.forEach(navItem => {
        navItem.classList.remove('active');
        navItem.addEventListener('click', (e) => {
            e.preventDefault();
            const category = navItem.getAttribute('data-category');
            currentCategory = category;
            
            navItems.forEach(item => item.classList.remove('active'));
            navItem.classList.add('active');
            
            initializeCatalog(category);

            // Se o sidebar estiver aberto, feche-o após a seleção
            const sidebar = document.getElementById('sidebar');
            if (sidebar && !sidebar.classList.contains('hidden')) {
                sidebar.classList.add('hidden');
            }
        });
    });
    
    // Define a primeira categoria como ativa
    const activeNav = document.querySelector(`[data-category="${currentCategory}"]`);
    if (activeNav) {
        activeNav.classList.add('active');
    }
}

// Sidebar open/close handlers
document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.getElementById('hamburger');
    const hamburgerFixed = document.getElementById('hamburger-fixed');
    const sidebar = document.getElementById('sidebar');
    const closeBtn = document.getElementById('close-sidebar');
    function openSidebar() {
        if (sidebar) sidebar.classList.remove('hidden');
    }
    function closeSidebar() {
        if (sidebar) sidebar.classList.add('hidden');
    }
    if (hamburger && sidebar) {
        hamburger.addEventListener('click', openSidebar);
    }
    if (hamburgerFixed && sidebar) {
        hamburgerFixed.addEventListener('click', openSidebar);
    }
    if (closeBtn && sidebar) {
        closeBtn.addEventListener('click', closeSidebar);
    }
    // close sidebar when clicking outside (optional)
    document.addEventListener('click', (e) => {
        if (!sidebar || sidebar.classList.contains('hidden')) return;
        const inside = sidebar.contains(e.target) || (hamburger && hamburger.contains(e.target)) || (hamburgerFixed && hamburgerFixed.contains(e.target));
        if (!inside) closeSidebar();
    });

    // Toggle controls panel
    const toggleControls = document.getElementById('toggle-controls');
    const controlsPanel = document.querySelector('.controls-panel');
    if (toggleControls && controlsPanel) {
        toggleControls.addEventListener('click', () => {
            controlsPanel.classList.toggle('hidden');
            toggleControls.textContent = controlsPanel.classList.contains('hidden') ? '⚙️ Mostrar Configurações' : '⚙️ Ocultar Configurações';
        });
    }
});

// --- 2. GERAÇÃO DE CONTROLES E EVENTOS ---

function renderControls() {
    controlsArea.innerHTML = ''; // Limpa a área de controles

    // 1. Controle de Modelo (Select) - (Mantido igual)
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


    // 2. Controles Específicos por Categoria
    
    if (currentCategory === 'portas') {
        renderPortasControls(currentProduct.opcoes);
    } 
    // Outras categorias virão aqui...
    
    // Adiciona o evento de clique aos novos botões gerados
    document.querySelectorAll('.option-button').forEach(button => {
        button.addEventListener('click', handleVariationChange);
    });
}

function renderPortasControls(opcoes) {
    // --- Cor do Alumínio ---
    controlsArea.innerHTML += `
        <div class="control-group">
            <label>Cor do Alumínio:</label>
            <div id="options-aluminio" class="option-buttons">
                ${opcoes.cores_aluminio.map(valor => 
                    `<button class="option-button ${valor === currentSelections.aluminio ? 'active' : ''}" 
                             data-type="aluminio" data-value="${valor}">
                        ${valor.charAt(0).toUpperCase() + valor.slice(1)}
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
                ${opcoes.cores_vidro.map(valor => 
                    `<button class="option-button ${valor === currentSelections.vidro ? 'active' : ''}" 
                             data-type="vidro" data-value="${valor}">
                        ${valor.charAt(0).toUpperCase() + valor.slice(1)}
                    </button>`
                ).join('')}
            </div>
        </div>
    `;
}

// Manipula a troca de modelo no <select> (Mantido igual)
function handleModelChange(modelId) {
    const newProduct = allCatalogData[currentCategory].find(p => p.id === modelId);
    if (newProduct) {
        selectProduct(newProduct);
    }
}

// Manipula o clique nos botões de variação
function handleVariationChange(event) {
    const button = event.currentTarget;
    const type = button.getAttribute('data-type');
    const value = button.getAttribute('data-value');

    // Atualiza o estado visual e a seleção
    document.querySelectorAll(`[data-type="${type}"]`).forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');

    currentSelections[type] = value;

    updateVisualizer(); // Chama a função para trocar a imagem
}

// --- 3. ATUALIZAÇÃO DA VISUALIZAÇÃO (O CORE DE TROCA ÚNICA) ---

function updateVisualizer() {
    const { aluminio, vidro } = currentSelections;
    
    // 1. Encontra a combinação no array "combinacoes"
    const combinacaoEncontrada = currentProduct.combinacoes.find(comb => 
        comb.aluminio.toLowerCase() === aluminio.toLowerCase() && 
        comb.vidro.toLowerCase() === vidro.toLowerCase()
    );

    // 2. Atualiza a Imagem Única
    if (combinacaoEncontrada) {
        layerBase.src = combinacaoEncontrada.path;
        layerBase.style.opacity = '1';
    } else {
        // Fallback: Use uma imagem genérica de "sem imagem" se a combinação faltar no JSON
        layerBase.src = 'assets/img/sem_imagem_placeholder.jpg'; 
        layerBase.style.opacity = '0.5';
        console.error(`Combinação não encontrada: ${aluminio} + ${vidro}`);
        console.log("Combinações disponíveis:", currentProduct.combinacoes);
    }
    
    // 3. Atualiza o Resumo de Especificações (Adapte esta função para a nova estrutura do JSON)
    updateSpecsSummary();
    
    // 4. Setup do zoom interativo
    setupImageZoom();
}

function updateSpecsSummary() {
    document.getElementById('spec-modelo').textContent = currentProduct.nome;
    document.getElementById('spec-acabamento').textContent = currentProduct.acabamento;
    document.getElementById('spec-cor-aluminio').textContent = currentSelections.aluminio.charAt(0).toUpperCase() + currentSelections.aluminio.slice(1);
    document.getElementById('spec-cor-vidro').textContent = currentSelections.vidro.charAt(0).toUpperCase() + currentSelections.vidro.slice(1);
    // Remove o resumo do puxador
}

// --- ZOOM INTERATIVO NA IMAGEM DO PRODUTO ---
function setupImageZoom() {
    const productDisplay = document.getElementById('product-display');
    const productLayer = document.getElementById('layer-base');
    
    if (!productDisplay || !productLayer) return;

    productDisplay.addEventListener('mouseenter', () => {
        productLayer.style.cursor = 'zoom-in';
    });

    productDisplay.addEventListener('mousemove', (e) => {
        const rect = productDisplay.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const xPercent = (x / rect.width) * 100;
        const yPercent = (y / rect.height) * 100;

        // Zoom de 2.2x (220%) ao passar o mouse
        productLayer.style.transform = `scale(2.2)`;
        productLayer.style.transformOrigin = `${xPercent}% ${yPercent}%`;
    });

    productDisplay.addEventListener('mouseleave', () => {
        productLayer.style.transform = 'scale(1)';
        productLayer.style.cursor = 'zoom-in';
    });
}

// --- INICIALIZAÇÃO ---
loadCatalogData();

// Função de debug para verificar as combinações carregadas
window.debugCatalog = function() {
    console.log("=== DEBUG CATÁLOGO ===");
    console.log("Categoria atual:", currentCategory);
    console.log("Produto atual:", currentProduct);
    console.log("Seleções atuais:", currentSelections);
    if (currentProduct && currentProduct.combinacoes) {
        console.log("Combinações disponíveis:", currentProduct.combinacoes);
    }
};
