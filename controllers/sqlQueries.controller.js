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

const connection = mysql.createPool(configConnection)
connection.query('SELECT 1')

function createConnection() {
    return mysql.createPool(configConnection)
}

/* REGISTER FUNCTIONS */
function registerNewUser({ email, password, name, inst, borned_on, created_at, last_login, role='student' }) {
    return new Promise((resolve, reject) => {
        if(!email || !password || !name || !inst || !borned_on || !created_at || !last_login) {
            reject(new Error('Missing parameters'))
        }
        const query = `INSERT INTO users (id, email, password, name, institution_code, borned_date, created_date, role, last_login) VALUES (NULL, '${email}', '${password}', '${name}', '${inst}', '${borned_on}', '${created_at}', '${role}', '${last_login}');`
        connection.query(query, (err, results) => {
            if (err) { reject(err) } 
            resolve(results.insertId)
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

function registerNewExercise( studentId, exerciseId, score, time, created_at = new Date() ){
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

function registerNewStudent({studentId, institutionId, grade, classId}){
    return new Promise((resolve, reject) => {
        if(!studentId || !institutionId) {
            reject(new Error('Missing parameters'))
        }
        const query = `INSERT INTO student (id, institution_code, grade, class, student_id) VALUES (NULL, '${institutionId}', '${grade}', '${classId}', '${studentId}');`
        connection.query(query, (err, result) => {
            if(err) { reject(err) }
            resolve(result.insertId)
        })
    })
}

function registerNewTeacher(teacherId, institutionId){
    return new Promise((resolve, reject) => {
        if(!teacherId || !institutionId) {
            reject(new Error('Missing parameters'))
        }
        const query = `INSERT INTO teachers (id, institution_code, teacher_id) VALUES (NULL, '${institutionId}', '${teacherId}');`
        connection.query(query, (err, result) => {
            if(err) { reject(err) }
            resolve(result.insertId)
        })
    })
}

/* GET FUNCTIONS */
function getInstitutions(){
    return new Promise((resolve, reject) => {
        const query = `SELECT * FROM institution WHERE NOT (id='ADMIN');`
        connection.query(query, (err, result) => {
            if(err) { reject(err) }
            resolve(result)
        })
    })
}

function getHistory(studentId, limit=5){
    return new Promise((resolve, reject) => {
        if(!studentId) {
            reject(new Error('Missing parameters'))
        }
        const query = `SELECT * FROM history WHERE user_id = '${studentId}' ORDER BY id DESC LIMIT ${limit};`
        connection.query(query, (err, result) => {
            if(err) { reject(err) }
            resolve(result)
        })
    })
}

function getInstitutionName(institutionId){
  return new Promise((resolve, reject) => {
    if(!institutionId) {
      reject(new Error('Missing parameters'))
    }
    const query = `SELECT name FROM institution WHERE id = '${institutionId}';`
    connection.query(query, (err, result) => {
      if(err) { reject(err) }
      resolve(result[0].name)
    })
  })
}

function getExercises(values){
    return new Promise((resolve, reject) => {
        if(!values) {
            reject(new Error('Missing parameters'))
        }
        const query = `SELECT * FROM exercises WHERE id IN (${values});`
        connection.query(query, (err, result) => {
            if(err) { reject(err) }
            resolve(result)
        })
    })
}

function getResumen(studentId){
    return new Promise((resolve, reject) => {
        if(!studentId) {
            reject(new Error('Missing parameters'))
        }
        const query = `SELECT average_score, average_time, total_exercises FROM student WHERE student_id = '${studentId}';`
        connection.query(query, (err, result) => {
            if(err) { reject(err) }
            resolve(result[0])
        })
    })
}


/* CHECK FUNCTIONS */
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


/* UPDATE FUNCTIONS */
const finalAverageFun = (total, prev, score) => {
    return (((Number(prev) * Number(total)) + Number(score))/(Number(total) + 1)).toFixed(2)
}

const finalAverageSameFun = (total, prev, score, init) => {
    return (((Number(score)-Number(init)) + (Number(prev)*Number(total)))/(Number(total))).toFixed(2)
}

function updateNewAverageGrade({target_inst, target_class, target_grade}){
    return new Promise((resolve, reject) => {
        if(!target_inst || !target_class || !target_grade) {
            reject(new Error('Missing parameters'))
        }
        const query = `UPDATE grade SET num_students = num_students + 1 WHERE institution_code = '${target_inst}' AND class = '${target_class}' AND grade = '${target_grade}';`
        connection.query(query, (err, result) => {
            if(err) { reject(err) }
            resolve(result)
        })
    })
}

function updateAverageStudent(studentId, score, time){
    return new Promise((resolve, reject) => {
        if(!studentId || score === undefined) {
            reject(new Error('Missing parameters'))
        }
        const query = `SELECT average_score, total_exercises, average_time FROM student WHERE student_id = '${studentId}';`
        connection.query(query, (err, result) => {
            if(err) { reject(err) }
            const finalAverageScore = finalAverageFun(result[0].total_exercises, result[0].average_score, score)
            const finalAverageTime = finalAverageFun(result[0].total_exercises, result[0].average_time, time)
            const query2 = `UPDATE student SET average_score = '${finalAverageScore}', average_time = '${finalAverageTime}', total_exercises = '${result[0].total_exercises + 1}' WHERE student_id = '${studentId}';`
            connection.query(query2, (err, result2) => {
                if(err) { reject(err) }
                resolve(result[0])
            })
        })
    })
}

function updateAverageGrade(studentId, score, time){
    return new Promise((resolve, reject) => {
        if(!studentId) {
            reject(new Error('Missing parameters'))
        }
        const query = `SELECT average_score, average_time, institution_code, grade, class FROM student WHERE student_id = '${studentId}';`
        connection.query(query, (err, result) => {
            if(err) { reject(err) }
            const {average_score: studentScore, average_time: studentTime, institution_code, grade } = result[0]
            const query2 = `SELECT average_score, average_time, num_students FROM grade WHERE institution_code = '${institution_code}' AND grade = '${grade}' AND class = '${result[0].class}';`
            connection.query(query2, (err, result2) => {
                if(err) { reject(err) }
                const finalAverageScore = finalAverageSameFun(result2[0].num_students, result2[0].average_score, studentScore, score)
                const finalAverageTime = finalAverageSameFun(result2[0].num_students, result2[0].average_time, studentTime, time)
                const query3 = `UPDATE grade SET average_score = '${finalAverageScore}', average_time = '${finalAverageTime}' WHERE institution_code = '${institution_code}' AND grade = '${grade}' AND class = '${result[0].class}';`
                connection.query(query3, (err, result3) => {
                    if(err) { reject(err) }
                    resolve(result3[0])
                })
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


function changeLastLogin(date, userId){
    return new Promise((resolve, reject) => {
        if(!date) {
            reject(new Error('Missing parameters'))
        }
        const query = `UPDATE users SET last_login = '${date}' WHERE id = '${userId}';`
        connection.query(query, (err, result) => {
            if(err) { reject(err) }
            resolve(result)
        })
    })
}



module.exports = {
    registerNewUser,
    registerNewExercise,
    registerNewInstitution,
    registerNewStudent,
    registerNewTeacher,
    getResumen,
    updateNewAverageGrade,
    updateAverageStudent,
    updateAverageGrade,
    getInstitutions,
    getHistory,
    getInstitutionName,
    getExercises,
    checkEmail,
    createConnection,
    checkInstitution,
    updateValues,
    changeLastLogin,
}
