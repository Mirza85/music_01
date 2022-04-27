const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const NotFoundError = require('../../exceptions/NotFoundError');
const InvariantError = require('../../exceptions/InvariantError');
const AuthenticationError = require('../../exceptions/AuthenticationError');

class UsersService {
    constructor() {
        this._pool = new Pool();
    }

    async addUser({ username, password, fullname }) {
        await this.verifyUserUsername(username);
        const id = `user-${nanoid(16)}`;
        const hashedPassword = await bcrypt.hash(password, 10);
        const query = {
            text: 'insert into users values($1,$2,$3,$4) returning id',
            values: [id, username, hashedPassword, fullname]
        }
        const result = await this._pool.query(query);

        if (!result.rows.length) {
            throw new InvariantError('Gagal menambahkan user');
        }
        return result.rows[0].id;
    }

    async verifyUserUsername(username) {
        const query = {
            text: 'select username from users where username = $1',
            values: [username],
        }
        const result = await this._pool.query(query);

        if (result.rows.length > 0) {
            throw new InvariantError('Gagal menambahkan user. Username sudah digunakan');
        }

    }


    async getUserById(userId) {
        const query = {
            text: 'select id, username,fullname from users where id = $1',
            values: [userId]
        }
        const result = await this._pool.query(query);

        if (!result.rows.length) {
            throw new NotFoundError('user tidak ditemukan');
        }
        return result.rows[0];
    }

    async verifyUserCredential(username, password) {
        const query = {
            text: 'select id, password from users where username = $1',
            values: [username]
        };
        const result = await this._pool.query(query);

        if (!result.rows.length) {
            throw new AuthenticationError('kredensial yang anda berikan salah');
        }

        const { id, password: hashedPassword } = result.rows[0];
        const match = await bcrypt.compare(password, hashedPassword);

        if (!match) {
            throw new AuthenticationError('kredensial yang anda berikan salah')
        }
        return id;
    }
}
module.exports = UsersService;