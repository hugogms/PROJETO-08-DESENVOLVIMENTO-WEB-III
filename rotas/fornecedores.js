
import { dbAll, dbGet, dbRun } from '../database.js';
import { sendJSON, getRequestBody } from '../utils.js';

// Valida os dados do fornecedor
function validarFornecedor(dados) {
    const campos = [
        'razao_social',
        'nome_fantasia',
        'cnpj',
        'telefone',
        'email',
        'endereco'
    ];

    if (!dados || typeof dados !== 'object') {
        return 'Dados inválidos.';
    }

    for (const campo of campos) {
        if (!dados[campo] || !String(dados[campo]).trim()) {
            return `O campo ${campo} é obrigatório.`;
        }
    }

    return null;
}

// Trata as rotas dos fornecedores
export async function tratarRotasFornecedores(request, response, pathname) {

    // GET - Listar fornecedores
    if (request.method === 'GET' && pathname === '/api/fornecedores') {
        try {
            const fornecedores = await dbAll(
                'SELECT * FROM fornecedores'
            );

            sendJSON(response, 200, fornecedores);

        } catch (erro) {
            sendJSON(response, 500, {
                erro: 'Erro ao buscar fornecedores.'
            });
        }

        return true;
    }

    // POST - Cadastrar fornecedor
    if (request.method === 'POST' && pathname === '/api/fornecedores') {
        try {
            const dados = await getRequestBody(request);

            const erroValidacao = validarFornecedor(dados);

            if (erroValidacao) {
                sendJSON(response, 400, { erro: erroValidacao });
                return true;
            }

            const cnpj = dados.cnpj.replace(/\D/g, '');

            const resultado = await dbRun(
                `INSERT INTO fornecedores
                (razao_social, nome_fantasia, cnpj, telefone, email, endereco)
                VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    dados.razao_social,
                    dados.nome_fantasia,
                    cnpj,
                    dados.telefone,
                    dados.email,
                    dados.endereco
                ]
            );

            sendJSON(response, 201, {
                mensagem: 'Fornecedor cadastrado com sucesso.',
                id: resultado.id
            });

        } catch (erro) {
            if (erro.code === 'SQLITE_CONSTRAINT') {
                sendJSON(response, 409, {
                    erro: 'Este CNPJ já está cadastrado.'
                });
            } else if (erro instanceof SyntaxError) {
                sendJSON(response, 400, {
                    erro: 'JSON inválido.'
                });
            } else {
                sendJSON(response, 500, {
                    erro: 'Erro ao cadastrar fornecedor.'
                });
            }
        }

        return true;
    }

    // GET - Buscar fornecedor por ID
    const busca = pathname.match(/^\/api\/fornecedores\/(\d+)$/);

    if (request.method === 'GET' && busca) {
        try {
            const fornecedor = await dbGet(
                'SELECT * FROM fornecedores WHERE id = ?',
                [busca[1]]
            );

            if (!fornecedor) {
                sendJSON(response, 404, {
                    erro: 'Fornecedor não encontrado.'
                });
            } else {
                sendJSON(response, 200, fornecedor);
            }

        } catch (erro) {
            sendJSON(response, 500, {
                erro: 'Erro ao buscar fornecedor.'
            });
        }

        return true;
    }

    // PUT - Atualizar fornecedor
    if (request.method === 'PUT' && busca) {
        try {
            const dados = await getRequestBody(request);

            const erroValidacao = validarFornecedor(dados);

            if (erroValidacao) {
                sendJSON(response, 400, { erro: erroValidacao });
                return true;
            }

            const cnpj = dados.cnpj.replace(/\D/g, '');

            const resultado = await dbRun(
                `UPDATE fornecedores SET
                    razao_social = ?,
                    nome_fantasia = ?,
                    cnpj = ?,
                    telefone = ?,
                    email = ?,
                    endereco = ?
                WHERE id = ?`,
                [
                    dados.razao_social,
                    dados.nome_fantasia,
                    cnpj,
                    dados.telefone,
                    dados.email,
                    dados.endereco,
                    busca[1]
                ]
            );

            if (resultado.changes === 0) {
                sendJSON(response, 404, {
                    erro: 'Fornecedor não encontrado.'
                });
            } else {
                sendJSON(response, 200, {
                    mensagem: 'Fornecedor atualizado com sucesso.'
                });
            }

        } catch (erro) {
            if (erro.code === 'SQLITE_CONSTRAINT') {
                sendJSON(response, 409, {
                    erro: 'Este CNPJ já está cadastrado.'
                });
            } else if (erro instanceof SyntaxError) {
                sendJSON(response, 400, {
                    erro: 'JSON inválido.'
                });
            } else {
                sendJSON(response, 500, {
                    erro: 'Erro ao atualizar fornecedor.'
                });
            }
        }

        return true;
    }

    // DELETE - Excluir fornecedor
    if (request.method === 'DELETE' && busca) {
        try {
            const resultado = await dbRun(
                'DELETE FROM fornecedores WHERE id = ?',
                [busca[1]]
            );

            if (resultado.changes === 0) {
                sendJSON(response, 404, {
                    erro: 'Fornecedor não encontrado.'
                });
            } else {
                sendJSON(response, 200, {
                    mensagem: 'Fornecedor excluído com sucesso.'
                });
            }

        } catch (erro) {
            if (erro.code === 'SQLITE_CONSTRAINT') {
                sendJSON(response, 409, {
                    erro: 'Não é possível excluir este fornecedor porque existem produtos vinculados.'
                });
            } else {
                sendJSON(response, 500, {
                    erro: 'Erro ao excluir fornecedor.'
                });
            }
        }

        return true;
    }

    return false;
}
