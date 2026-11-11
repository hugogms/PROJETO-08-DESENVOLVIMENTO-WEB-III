
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'database.sqlite');

const db = new sqlite3.Database(dbPath);

db.serialize(() => {

    db.run('PRAGMA foreign_keys = ON');

    db.run(`
        CREATE TABLE IF NOT EXISTS fornecedores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            razao_social TEXT NOT NULL,
            nome_fantasia TEXT NOT NULL,
            cnpj TEXT NOT NULL UNIQUE,
            telefone TEXT NOT NULL,
            email TEXT NOT NULL,
            endereco TEXT NOT NULL
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS produtos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            codigo TEXT NOT NULL UNIQUE,
            categoria TEXT NOT NULL,
            descricao TEXT NOT NULL,
            preco REAL NOT NULL CHECK (preco >= 0),
            quantidade INTEGER NOT NULL CHECK (quantidade >= 0),
            fornecedor_id INTEGER NOT NULL,
            FOREIGN KEY (fornecedor_id)
                REFERENCES fornecedores(id)
                ON DELETE RESTRICT
        )
    `);

});

// Consulta vários registros
export function dbAll(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (erro, rows) => {
            if (erro) {
                reject(erro);
            } else {
                resolve(rows);
            }
        });
    });
}

// Consulta um único registro
export function dbGet(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (erro, row) => {
            if (erro) {
                reject(erro);
            } else {
                resolve(row);
            }
        });
    });
}

// Executa INSERT, UPDATE ou DELETE
export function dbRun(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (erro) {
            if (erro) {
                reject(erro);
            } else {
                resolve({
                    id: this.lastID,
                    changes: this.changes
                });
            }
        });
    });
}

export default db;
