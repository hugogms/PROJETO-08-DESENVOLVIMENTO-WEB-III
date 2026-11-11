export function sendJSON(response, status, data) {
    response.writeHead(status, {
        'Content-Type': 'application/json; charset=utf-8'
    });

    response.end(JSON.stringify(data));
}

export function getRequestBody(request) {
    return new Promise((resolve, reject) => {
        let body = '';

        request.on('data', chunk => {
            body += chunk;
        });

        request.on('end', () => {
            try {
                resolve(JSON.parse(body));
            } catch (erro) {
                reject(erro);
            }
        });

        request.on('error', erro => {
            reject(erro);
        });
    });
}