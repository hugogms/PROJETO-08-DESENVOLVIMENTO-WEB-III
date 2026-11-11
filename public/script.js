
const API = '/api';

// Elementos da página
const formProduto = document.getElementById('formProduto');
const formFornecedor = document.getElementById('formFornecedor');

const tabelaProdutos = document.getElementById('tabelaProdutos');
const tabelaFornecedores = document.getElementById('tabelaFornecedores');

const fornecedorProduto = document.getElementById('fornecedorProduto');

let produtos = [];
let fornecedores = [];

// Função para conversar com a API
async function requisicao(url, opcoes = {}) {
    const resposta = await fetch(url, opcoes);
    const dados = await resposta.json();

    if (!resposta.ok) {
        throw new Error(dados.erro || 'Erro na requisição.');
    }

    return dados;
}

// Cria botões das tabelas
function criarBotao(texto, acao, id) {
    const botao = document.createElement('button');

    botao.textContent = texto;
    botao.dataset.acao = acao;
    botao.dataset.id = id;

    return botao;
}

// Carrega os fornecedores
async function carregarFornecedores() {
    fornecedores = await requisicao(`${API}/fornecedores`);

    tabelaFornecedores.innerHTML = '';

    fornecedores.forEach(fornecedor => {
        const linha = document.createElement('tr');

        const campos = [
            fornecedor.razao_social,
            fornecedor.nome_fantasia,
            fornecedor.cnpj,
            fornecedor.telefone,
            fornecedor.email
        ];

        campos.forEach(valor => {
            const celula = document.createElement('td');
            celula.textContent = valor;
            linha.appendChild(celula);
        });

        const acoes = document.createElement('td');

        acoes.appendChild(
            criarBotao('Editar', 'editar-fornecedor', fornecedor.id)
        );

        acoes.appendChild(
            criarBotao('Excluir', 'excluir-fornecedor', fornecedor.id)
        );

        linha.appendChild(acoes);
        tabelaFornecedores.appendChild(linha);
    });

    // Atualiza a lista de fornecedores do formulário de produtos
    fornecedorProduto.innerHTML =
        '<option value="">Selecione um fornecedor</option>';

    fornecedores.forEach(fornecedor => {
        const opcao = document.createElement('option');

        opcao.value = fornecedor.id;
        opcao.textContent = fornecedor.nome_fantasia;

        fornecedorProduto.appendChild(opcao);
    });
}

// Carrega os produtos
async function carregarProdutos() {
    produtos = await requisicao(`${API}/produtos`);

    atualizarTabelaProdutos();
    atualizarResumo();
    atualizarCategorias();
}

// Atualiza a tabela de produtos
function atualizarTabelaProdutos() {
    tabelaProdutos.innerHTML = '';

    const pesquisa = document
        .getElementById('pesquisaProduto')
        .value.toLowerCase();

    const categoria = document.getElementById('filtroCategoria').value;

    const produtosFiltrados = produtos.filter(produto => {
        const correspondeNome =
            produto.nome.toLowerCase().includes(pesquisa);

        const correspondeCategoria =
            categoria === '' || produto.categoria === categoria;

        return correspondeNome && correspondeCategoria;
    });

    produtosFiltrados.forEach(produto => {
        const linha = document.createElement('tr');

        const campos = [
            produto.nome,
            produto.codigo,
            produto.categoria,
            Number(produto.preco).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            }),
            produto.quantidade,
            produto.fornecedor
        ];

        campos.forEach((valor, indice) => {
            const celula = document.createElement('td');

            celula.textContent = valor;

            if (indice === 4 && produto.quantidade < 5) {
                celula.classList.add('estoque-baixo');
            }

            linha.appendChild(celula);
        });

        const acoes = document.createElement('td');

        acoes.appendChild(
            criarBotao('Editar', 'editar-produto', produto.id)
        );

        acoes.appendChild(
            criarBotao('Excluir', 'excluir-produto', produto.id)
        );

        linha.appendChild(acoes);
        tabelaProdutos.appendChild(linha);
    });
}

// Atualiza os números do resumo
function atualizarResumo() {
    const totalProdutos = produtos.length;

    const valorEstoque = produtos.reduce((total, produto) => {
        return total + Number(produto.preco) * Number(produto.quantidade);
    }, 0);

    const estoqueBaixo = produtos.filter(produto => {
        return produto.quantidade < 5;
    }).length;

    document.getElementById('totalProdutos').textContent = totalProdutos;

    document.getElementById('valorEstoque').textContent =
        valorEstoque.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });

    document.getElementById('estoqueBaixo').textContent = estoqueBaixo;
}

// Atualiza as categorias disponíveis no filtro
function atualizarCategorias() {
    const filtro = document.getElementById('filtroCategoria');
    const categoriaSelecionada = filtro.value;

    const categorias = [
        ...new Set(produtos.map(produto => produto.categoria))
    ];

    filtro.innerHTML = '<option value="">Todas as categorias</option>';

    categorias.forEach(categoria => {
        const opcao = document.createElement('option');

        opcao.value = categoria;
        opcao.textContent = categoria;

        filtro.appendChild(opcao);
    });

    filtro.value = categorias.includes(categoriaSelecionada)
        ? categoriaSelecionada
        : '';
}

// Abre o formulário de produto
document.getElementById('btnNovoProduto').addEventListener('click', () => {
    formProduto.reset();

    document.getElementById('produtoId').value = '';
    document.getElementById('tituloFormProduto').textContent =
        'Cadastrar produto';

    formProduto.hidden = false;
});

// Cancela o formulário de produto
document.getElementById('btnCancelarProduto').addEventListener('click', () => {
    formProduto.hidden = true;
    formProduto.reset();
});

// Salva um produto
formProduto.addEventListener('submit', async evento => {
    evento.preventDefault();

    const id = document.getElementById('produtoId').value;

    const dados = {
        nome: document.getElementById('nomeProduto').value,
        codigo: document.getElementById('codigoProduto').value,
        categoria: document.getElementById('categoriaProduto').value,
        descricao: document.getElementById('descricaoProduto').value,
        preco: Number(document.getElementById('precoProduto').value),
        quantidade: Number(document.getElementById('quantidadeProduto').value),
        fornecedor_id: Number(fornecedorProduto.value)
    };

    try {
        await requisicao(
            id ? `${API}/produtos/${id}` : `${API}/produtos`,
            {
                method: id ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados)
            }
        );

        alert('Produto salvo com sucesso!');

        formProduto.hidden = true;
        formProduto.reset();

        await carregarProdutos();

    } catch (erro) {
        alert(erro.message);
    }
});

// Abre o formulário de fornecedor
document.getElementById('btnNovoFornecedor').addEventListener('click', () => {
    formFornecedor.reset();

    document.getElementById('fornecedorId').value = '';
    document.getElementById('tituloFormFornecedor').textContent =
        'Cadastrar fornecedor';

    document.getElementById('statusCNPJ').textContent = '';

    formFornecedor.hidden = false;
});

// Cancela o formulário de fornecedor
document.getElementById('btnCancelarFornecedor').addEventListener('click', () => {
    formFornecedor.hidden = true;
    formFornecedor.reset();

    document.getElementById('statusCNPJ').textContent = '';
});

// Consulta o CNPJ na BrasilAPI
document.getElementById('btnConsultarCNPJ').addEventListener('click', async () => {
    const campoCNPJ = document.getElementById('cnpjFornecedor');
    const status = document.getElementById('statusCNPJ');

    const cnpj = campoCNPJ.value.replace(/\D/g, '');

    if (cnpj.length !== 14) {
        status.textContent = 'Informe um CNPJ com 14 números.';
        return;
    }

    status.textContent = 'Consultando CNPJ...';

    try {
        const resposta = await fetch(
            `https://brasilapi.com.br/api/cnpj/v1/${cnpj}`
        );

        if (!resposta.ok) {
            throw new Error('CNPJ não encontrado ou serviço indisponível.');
        }

        const dados = await resposta.json();

        document.getElementById('razaoSocial').value =
            dados.razao_social || '';

        document.getElementById('nomeFantasia').value =
            dados.nome_fantasia || '';

        document.getElementById('situacaoCadastral').value =
            dados.descricao_situacao_cadastral || '';

        document.getElementById('telefoneFornecedor').value =
            dados.ddd_telefone_1 || '';

        document.getElementById('emailFornecedor').value =
            dados.email || '';

        const endereco = [
            dados.logradouro,
            dados.numero,
            dados.complemento,
            dados.bairro,
            dados.cep
        ].filter(Boolean).join(', ');

        document.getElementById('enderecoFornecedor').value = endereco;

        document.getElementById('municipioFornecedor').value =
            dados.municipio || '';

        document.getElementById('estadoFornecedor').value =
            dados.uf || '';

        status.textContent =
            'Dados encontrados! Confira as informações antes de salvar.';

    } catch (erro) {
        status.textContent =
            `${erro.message} Você pode preencher os dados manualmente.`;
    }
});

// Salva um fornecedor
formFornecedor.addEventListener('submit', async evento => {
    evento.preventDefault();

    const id = document.getElementById('fornecedorId').value;

    const dados = {
        razao_social: document.getElementById('razaoSocial').value,
        nome_fantasia: document.getElementById('nomeFantasia').value,
        cnpj: document.getElementById('cnpjFornecedor').value,
        telefone: document.getElementById('telefoneFornecedor').value,
        email: document.getElementById('emailFornecedor').value,
        endereco: document.getElementById('enderecoFornecedor').value
    };

    try {
        await requisicao(
            id ? `${API}/fornecedores/${id}` : `${API}/fornecedores`,
            {
                method: id ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados)
            }
        );

        alert('Fornecedor salvo com sucesso!');

        formFornecedor.hidden = true;
        formFornecedor.reset();

        await carregarFornecedores();
        await carregarProdutos();

    } catch (erro) {
        alert(erro.message);
    }
});

// Ações da tabela de produtos
tabelaProdutos.addEventListener('click', async evento => {
    const botao = evento.target.closest('button');

    if (!botao) return;

    const id = botao.dataset.id;
    const acao = botao.dataset.acao;

    if (acao === 'editar-produto') {
        const produto = produtos.find(item => item.id == id);

        document.getElementById('produtoId').value = produto.id;
        document.getElementById('nomeProduto').value = produto.nome;
        document.getElementById('codigoProduto').value = produto.codigo;
        document.getElementById('categoriaProduto').value = produto.categoria;
        document.getElementById('descricaoProduto').value = produto.descricao;
        document.getElementById('precoProduto').value = produto.preco;
        document.getElementById('quantidadeProduto').value = produto.quantidade;
        fornecedorProduto.value = produto.fornecedor_id;

        document.getElementById('tituloFormProduto').textContent =
            'Editar produto';

        formProduto.hidden = false;
    }

    if (acao === 'excluir-produto') {
        if (!confirm('Deseja realmente excluir este produto?')) return;

        try {
            await requisicao(`${API}/produtos/${id}`, {
                method: 'DELETE'
            });

            alert('Produto excluído com sucesso!');

            await carregarProdutos();

        } catch (erro) {
            alert(erro.message);
        }
    }
});

// Ações da tabela de fornecedores
tabelaFornecedores.addEventListener('click', async evento => {
    const botao = evento.target.closest('button');

    if (!botao) return;

    const id = botao.dataset.id;
    const acao = botao.dataset.acao;

    if (acao === 'editar-fornecedor') {
        const fornecedor = fornecedores.find(item => item.id == id);

        document.getElementById('fornecedorId').value = fornecedor.id;
        document.getElementById('razaoSocial').value = fornecedor.razao_social;
        document.getElementById('nomeFantasia').value = fornecedor.nome_fantasia;
        document.getElementById('cnpjFornecedor').value = fornecedor.cnpj;
        document.getElementById('telefoneFornecedor').value = fornecedor.telefone;
        document.getElementById('emailFornecedor').value = fornecedor.email;
        document.getElementById('enderecoFornecedor').value = fornecedor.endereco;

        document.getElementById('situacaoCadastral').value = '';
        document.getElementById('municipioFornecedor').value = '';
        document.getElementById('estadoFornecedor').value = '';

        document.getElementById('statusCNPJ').textContent = '';

        document.getElementById('tituloFormFornecedor').textContent =
            'Editar fornecedor';

        formFornecedor.hidden = false;
    }

    if (acao === 'excluir-fornecedor') {
        if (!confirm('Deseja realmente excluir este fornecedor?')) return;

        try {
            await requisicao(`${API}/fornecedores/${id}`, {
                method: 'DELETE'
            });

            alert('Fornecedor excluído com sucesso!');

            await carregarFornecedores();
            await carregarProdutos();

        } catch (erro) {
            alert(erro.message);
        }
    }
});

// Pesquisa e filtro
document.getElementById('pesquisaProduto').addEventListener('input', () => {
    atualizarTabelaProdutos();
});

document.getElementById('filtroCategoria').addEventListener('change', () => {
    atualizarTabelaProdutos();
});

// Inicializa a página
async function iniciarSistema() {
    try {
        await carregarFornecedores();
        await carregarProdutos();
    } catch (erro) {
        alert('Não foi possível carregar os dados: ' + erro.message);
    }
}

iniciarSistema();
