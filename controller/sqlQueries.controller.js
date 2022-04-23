require('dotenv').config()
const mysql = require('mysql')

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

function checkInstitution(institutionCode){
    return new Promise((resolve, reject) => {
        if(!institutionCode) {
            reject(new Error('Missing parameters'))
        }
        const query = `SELECT * FROM institution WHERE id = '${institutionCode}';`
        connection.query(query, (err, result) => {
            if(err) { reject(err) }
            resolve(result)
        })
    })
}

function registerNewUser({ email, password, name, inst, borned_on, created_at }) {
    return new Promise((resolve, reject) => {
        if(!email || !password || !name || !inst || !borned_on || !created_at) {
            reject(new Error('Missing parameters'))
        }
        const query = `INSERT INTO users (id, email, password, name, institution_code, borned_date, created_date, role, average_score, average_time, total_exercises) VALUES (NULL, '${email}', '${password}', '${name}', '${inst}', '${borned_on}', '${created_at}', 'student', '0.0', '0.0', '0');`
        connection.query(query, (err, result) => {
            if(err) { reject(err) }
            resolve(result)
        })
    })
}

function registerNewInstitution({ name, email, institution_code, country, city, province }){
    return new Promise((resolve, reject) => {
        if(!name || !email || !institution_code || !country || !city || !province) {
            reject(new Error('Missing parameters'))
        }
        const query = `INSERT INTO institution (id, name, email, country, city, province, num_students, average_score) VALUES ('${institution_code}', '${name}', '${email}', '${country}', '${city}', '${province}', '0', '0.0');`
        connection.query(query, (err, result) => {
            if(err) { reject(err) }
            resolve(result)
        })
    })
}

function registerNewExercise({ studentId, exerciseId, score, time, created_at }){
    return new Promise((resolve, reject) => {
        if(!studentId || exerciseId === undefined || exerciseId === null || score === undefined || score === null || !time || !created_at) {
            reject(new Error('Missing parameters'))
        }
        const query = `INSERT INTO history (id, user_id, exercise_id, score, time, date) VALUES (NULL, '${studentId}', '${exerciseId}', '${score}', '${time}', '${created_at}');`
        connection.query(query, (err, result) => {
            if(err) { reject(err) }
            resolve(result)
        })
    })
}

function getNewAverage({prevAverage, totalItems, table, target, score}){
    return new Promise((resolve, reject) => {
        if(!prevAverage || !totalItems || !table || !target) {
            reject(new Error('Missing parameters'))
        }
        const query = `SELECT ${prevAverage}, ${totalItems} FROM ${table} WHERE id = '${target}';`
        connection.query(query, (err, result) => {
            if(err) { reject(err) }
            if(!result.length) { reject(new Error('No user found')) }
            const finalAverage = ((Number(result[0][prevAverage] * result[0][totalItems]) + Number(score)) / (result[0][totalItems] + 1)).toFixed(2)
            resolve({initAverage: result[0][prevAverage], finalAverage})
        })
    })
}

function getUpdatedCurrAverage(studentId, initAverage){
    return new Promise((resolve, reject) => {
        if(!studentId) {
            reject(new Error('Missing parameters'))
        }
        const query = `SELECT average_score, institution_code FROM users WHERE id = '${studentId}';`
        connection.query(query, (err, result) => {
            if(err) { reject(err) }
            if(!result.length) { reject(new Error('No user found')) }
            const query2 = `SELECT average_score, num_students FROM institution WHERE id = '${result[0].institution_code}';`
            connection.query(query2, (err, result2) => {
                if(err) { reject(err) }
                const finalAverage = (((Number(result[0].average_score) - Number(initAverage)) + Number(result2[0].average_score * result2[0].num_students)) / Number(result2[0].num_students).toFixed(2))
                resolve(finalAverage)
            })
        })
    })
}

function updateValues({table, target, column, value}){
    return new Promise((resolve, reject) => {
        if(!table || !target || !column || value === undefined || value === null) {
            reject(new Error('Missing parameters'))
        }
        const query = `UPDATE ${table} SET ${column} = '${value}' WHERE id = '${target}';`
        connection.query(query, (err, result) => {
            if(err) { reject(err) }
            resolve(result)
        })
    })
}

function incrementValues({table, target, column, increment}){
    return new Promise((resolve, reject) => {
        if(!table || !target || !column || !increment) {
            reject(new Error('Missing parameters'))
        }
        const query = `SELECT ${column} FROM ${table} WHERE id = '${target}';`
        connection.query(query, (err, result) => {
            if(err) { reject(err) }
            if(!result.length) { reject(new Error('No user found')) }
            const query2 = `UPDATE ${table} SET ${column} = '${result[0][column] + increment}' WHERE id = '${target}';`
            connection.query(query2, (err, result2) => {
                if(err) { reject(err) }
                resolve(result2)
            })
        })
    })
}

function getInstitutions(){
    return new Promise((resolve, reject) => {
        const query = `SELECT * FROM institution WHERE NOT (id='ADMIN');`
        connection.query(query, (err, result) => {
            if(err) { reject(err) }
            resolve(result)
        })
    })
}



module.exports = {
    registerNewUser,
    checkEmail,
    createConnection,
    getNewAverage,
    getUpdatedCurrAverage,
    updateValues,
    registerNewExercise,
    incrementValues,
    checkInstitution,
    getInstitutions,
    registerNewInstitution
}