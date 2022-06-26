require('dotenv').config()
const express = require('express')
const session = require('express-session')
const passport = require('passport')
const mysql = require('mysql')
const mysqlStore = require('express-mysql-session')(session)
const cors = require('cors')

const app = express()
const port = 3001//process.env.PORT || 3000
const router = express.Router()
const routes = require('./routes/router')

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors({
    origin:true,
    credentials: true, 
    allowedHeaders: ["Content-Type","Set-Cookie"]
}))
const configConnection = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    port: process.env.DB_PORT,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    conectionLimit: 10
}

const pool = mysql.createPool(configConnection)
pool.query('SELECT 1')
const sessionStore = new mysqlStore({
    clearExpired:true, 
    checkExpirationInterval: 900000,
    expiration: 86400000,
}, pool)

app.use(session({
    secret: process.env.COOKIE_SECRET,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    name: 'sessionId',
    cookie: {
        maxAge: 1000 * 60 * 60 * 24,
        sameSite: false,
        httpOnly: false
    }
}))
app.use(passport.authenticate('session'))

app.use('/api', router)
routes(router)

app.listen(port, function () {
    console.log(process.env.ENV, ': Listening on port', port, '- start:', Date(Date.now()).toString())
})