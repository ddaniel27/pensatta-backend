require('dotenv').config()
const mysql = require('mysql')
const passport = require('passport')
const LocalStrategy = require('passport-local')

const configConnection = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    port: process.env.DB_PORT,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    multipleStatements: true
}

const connection = mysql.createConnection(configConnection)

function createConnection() {
    return mysql.createConnection(configConnection)
}

function checkEmail(email) {
    return new Promise((resolve, reject) => {
        if(!email) {
            reject(new Error('Missing parameters'))
        }
        const query = `SELECT * FROM users WHERE email = '${email}';`
        connection.query(query, (err, result) => {
            if(err) reject(err)
            resolve(result)
        })
    })
}


function registerNewUser({ email, password, name, inst, borned_on, created_at }) {
    return new Promise((resolve, reject) => {
        if(!email || !password || !name || !inst || !borned_on || !created_at) {
            reject(new Error('Missing parameters'))
        }
        const query = `INSERT INTO users (id, email, password, name, inst, borned_on, created_at) VALUES (NULL, '${email}', '${password}', '${name}', '${inst}', '${borned_on}', '${created_at}');`
        connection.query(query, (err, result) => {
            if(err) { reject(err) }
            resolve(result)
        })
    })
}



module.exports = {
    registerNewUser,
    checkEmail,
    createConnection
}