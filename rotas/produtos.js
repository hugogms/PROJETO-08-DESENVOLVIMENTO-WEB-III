
import { dbAll, dbGet, dbRun } from '../database.js';
import { sendJSON, getRequestBody } from '../utils.js';

// Valida os dados do produto
function validarProduto(dados) {
    const campos = [
        'nome',
        'codigo',
        'categoria',
        'descricao'
    ];

    if (!dados || typeof dados !== 'object') {
        return 'Dados inválidos.';
    }

    for (const campo of campos) {
        if (!dados[campo] || !String(dados[campo]).trim()) {
            return `O campo ${campo} é obrigatório.`;
        }
    }

    if (
        dados.preco === undefined ||
        dados.preco === null ||
        dados.preco === '' ||
        !Number.isFinite(Number(dados.preco)) ||
        Number(dados.preco) < 0
    ) {
        return 'O preço deve ser um número maior ou igual a zero.';
    }

    if (
        dados.quantidade === undefined ||
        dados.quantidade === null ||
        dados.quantidade === '' ||
        !Number.isInteger(Number(dados.quantidade)) ||
        Number(dados.quantidade) < 0
    ) {
        return 'A quantidade deve ser um número inteiro maior ou igual a zero.';
    }

    if (
        !Number.isInteger(Number(dados.fornecedor_id)) ||
        Number(dados.fornecedor_id) <= 0
    ) {
        return 'Informe um fornecedor válido.';
    }

    return null;
}

// Trata as rotas dos produtos
export async function tratarRotasProdutos(request, response, pathname) {

    // GET - Listar produtos
    if (request.method === 'GET' && pathname === '/api/produtos') {
        try {
            const produtos = await dbAll(`
                SELECT produtos.*,
                fornecedores.nome_fantasia AS fornecedor
                FROM produtos
                INNER JOIN fornecedores
                ON produtos.fornecedor_id = fornecedores.id
            `);

            sendJSON(response, 200, produtos);

        } catch (erro) {
            sendJSON(response, 500, {
                erro: 'Erro ao buscar produtos.'
            });
        }

        return true;
    }

    // POST - Cadastrar produto
    if (request.method === 'POST' && pathname === '/api/produtos') {
        try {
            const dados = await getRequestBody(request);

            const erroValidacao = validarProduto(dados);

            if (erroValidacao) {
                sendJSON(response, 400, { erro: erroValidacao });
                return true;
            }

            const fornecedor = await dbGet(
                'SELECT id FROM fornecedores WHERE id = ?',
                [dados.fornecedor_id]
            );

            if (!fornecedor) {
                sendJSON(response, 404, {
                    erro: 'Fornecedor não encontrado.'
                });
                return true;
            }

            const resultado = await dbRun(
                `INSERT INTO produtos
                (nome, codigo, categoria, descricao, preco, quantidade, fornecedor_id)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    dados.nome,
                    dados.codigo,
                    dados.categoria,
                    dados.descricao,
                    Number(dados.preco),
                    Number(dados.quantidade),
                    Number(dados.fornecedor_id)
                ]
            );

            sendJSON(response, 201, {
                mensagem: 'Produto cadastrado com sucesso.',
                id: resultado.id
            });

        } catch (erro) {
            if (erro.code === 'SQLITE_CONSTRAINT') {
                sendJSON(response, 409, {
                    erro: 'Este código de produto já está cadastrado.'
                });
            } else if (erro instanceof SyntaxError) {
                sendJSON(response, 400, {
                    erro: 'JSON inválido.'
                });
            } else {
                sendJSON(response, 500, {
                    erro: 'Erro ao cadastrar produto.'
                });
            }
        }

        return true;
    }

    // Identifica rotas que recebem um ID
    const busca = pathname.match(/^\/api\/produtos\/(\d+)$/);

    // GET - Buscar produto por ID
    if (request.method === 'GET' && busca) {
        try {
            const produto = await dbGet(`
                SELECT produtos.*,
                fornecedores.nome_fantasia AS fornecedor
                FROM produtos
                INNER JOIN fornecedores
                ON produtos.fornecedor_id = fornecedores.id
                WHERE produtos.id = ?
            `, [busca[1]]);

            if (!produto) {
                sendJSON(response, 404, {
                    erro: 'Produto não encontrado.'
                });
            } else {
                sendJSON(response, 200, produto);
            }

        } catch (erro) {
            sendJSON(response, 500, {
                erro: 'Erro ao buscar produto.'
            });
        }

        return true;
    }

    // PUT - Atualizar produto
    if (request.method === 'PUT' && busca) {
        try {
            const dados = await getRequestBody(request);

            const erroValidacao = validarProduto(dados);

            if (erroValidacao) {
                sendJSON(response, 400, { erro: erroValidacao });
                return true;
            }

            const fornecedor = await dbGet(
                'SELECT id FROM fornecedores WHERE id = ?',
                [dados.fornecedor_id]
            );

            if (!fornecedor) {
                sendJSON(response, 404, {
                    erro: 'Fornecedor não encontrado.'
                });
                return true;
            }

            const resultado = await dbRun(
                `UPDATE produtos SET
                    nome = ?,
                    codigo = ?,
                    categoria = ?,
                    descricao = ?,
                    preco = ?,
                    quantidade = ?,
                    fornecedor_id = ?
                WHERE id = ?`,
                [
                    dados.nome,
                    dados.codigo,
                    dados.categoria,
                    dados.descricao,
                    Number(dados.preco),
                    Number(dados.quantidade),
                    Number(dados.fornecedor_id),
                    busca[1]
                ]
            );

            if (resultado.changes === 0) {
                sendJSON(response, 404, {
                    erro: 'Produto não encontrado.'
                });
            } else {
                sendJSON(response, 200, {
                    mensagem: 'Produto atualizado com sucesso.'
                });
            }

        } catch (erro) {
            if (erro.code === 'SQLITE_CONSTRAINT') {
                sendJSON(response, 409, {
                    erro: 'Este código de produto já está cadastrado.'
                });
            } else if (erro instanceof SyntaxError) {
                sendJSON(response, 400, {
                    erro: 'JSON inválido.'
                });
            } else {
                sendJSON(response, 500, {
                    erro: 'Erro ao atualizar produto.'
                });
            }
        }

        return true;
    }

    // DELETE - Excluir produto
    if (request.method === 'DELETE' && busca) {
        try {
            const resultado = await dbRun(
                'DELETE FROM produtos WHERE id = ?',
                [busca[1]]
            );

            if (resultado.changes === 0) {
                sendJSON(response, 404, {
                    erro: 'Produto não encontrado.'
                });
            } else {
                sendJSON(response, 200, {
                    mensagem: 'Produto excluído com sucesso.'
                });
            }

        } catch (erro) {
            sendJSON(response, 500, {
                erro: 'Erro ao excluir produto.'
            });
        }

        return true;
    }

    return false;
}
