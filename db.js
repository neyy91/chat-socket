
const mysql = require('mysql');

class Db {
    constructor(config) {
        this.connection = mysql.createPool({
            connectionLimit: 100,
            host: '127.0.0.1',
            user: 'root',
            password: '0000',
            database: 'chat',
            debug: false
        });
    }

    query(sql, arg) {
        return new Promise((resolve, reject) => {

            // console.log("----2----",sql, arg)
            this.connection.query(sql, arg, (err, rows) => {
                if(err) {
                    return reject(err);
                }
                resolve(rows)
            })
        })
    }

    close() {
        return new Promise((resolve, reject) => {
            this.connection.end(err => {
                if (err) {
                    return reject()
                }
                resolve()
            });
        })
    }

}

module.exports = new Db();