
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { sendJSON } from './utils.js';
import { tratarRotasFornecedores } from './rotas/fornecedores.js';
import { tratarRotasProdutos } from './rotas/produtos.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, 'public');

// Tipos de arquivos que o servidor pode enviar
const contentTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf'
};

// Envia arquivos da pasta public
function serveStaticFile(response, pathname) {
    const arquivo = pathname === '/'
        ? '/index.html'
        : pathname;

    const filePath = path.resolve(publicDir, `.${arquivo}`);

    // Impede acesso a arquivos fora da pasta public
    if (
        filePath !== publicDir &&
        !filePath.startsWith(publicDir + path.sep)
    ) {
        sendJSON(response, 403, {
            erro: 'Acesso não permitido.'
        });
        return;
    }

    fs.readFile(filePath, (erro, conteudo) => {
        if (erro) {
            sendJSON(response, 404, {
                erro: 'Arquivo não encontrado.'
            });
            return;
        }

        const extensao = path.extname(filePath);
        const contentType =
            contentTypes[extensao] || 'application/octet-stream';

        response.writeHead(200, {
            'Content-Type': contentType
        });

        response.end(conteudo);
    });
}

// Cria o servidor
const server = http.createServer(async (request, response) => {

    let pathname;

    try {
        pathname = decodeURIComponent(
            new URL(request.url, 'http://localhost').pathname
        );
    } catch (erro) {
        sendJSON(response, 400, {
            erro: 'Endereço inválido.'
        });
        return;
    }

    try {
        // Verifica as rotas dos fornecedores
        const fornecedorAtendido =
            await tratarRotasFornecedores(request, response, pathname);

        if (fornecedorAtendido) {
            return;
        }

        // Verifica as rotas dos produtos
        const produtoAtendido =
            await tratarRotasProdutos(request, response, pathname);

        if (produtoAtendido) {
            return;
        }

        // Responde quando uma rota da API não existe
        if (pathname.startsWith('/api/')) {
            sendJSON(response, 404, {
                erro: 'Rota da API não encontrada.'
            });
            return;
        }

        // Envia os arquivos da interface
        if (request.method === 'GET') {
            serveStaticFile(response, pathname);
            return;
        }

        sendJSON(response, 405, {
            erro: 'Método não permitido.'
        });

    } catch (erro) {
        console.error('Erro no servidor:', erro);

        if (!response.headersSent) {
            sendJSON(response, 500, {
                erro: 'Erro interno do servidor.'
            });
        }
    }
});

// Inicia o servidor
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
