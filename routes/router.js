// Import modules
const bcrypt = require('bcryptjs')
const passport = require('passport')
const LocalStrategy = require('passport-local')

//Import controllers
const {
    registerPostController,
    loginGetController,
    loginPostController,
    handleAuth,
    handleAuthAdmin,
    exercisePostConstroller,
    institutionGetController,
    institutionPostController,
    institutionPutController,
    profileExercisesGetController,
    logoutPostController,
    profileMetricsGetController,
    profileResumenGetController

} = require('../controller/requests.controller')
const {createConnection} = require('../controller/sqlQueries.controller')

const connection = createConnection()
connection.query('SELECT 1')

// Configure passport with local strategy
passport.use(new LocalStrategy({usernameField:"email",passwordField:"password", passReqToCallback:true},function verify(req, email, password, cb){
    connection.query(`SELECT * FROM users WHERE email = '${email}';`, (err, result) => {
        if( err ) { return cb(err) }
        if( !result.length ) { return cb(null, false) }
        if( !bcrypt.compareSync(password, result[0].password) ) { return cb(null, false) }
        return cb(
            null,
            { 
                ...result[0],
                password: undefined
            }
        )
    })
}))

// Passport session serialization
passport.serializeUser(function(user, cb) {
    process.nextTick(function(){
        cb(null, user)
    })
})

passport.deserializeUser(function(user, cb) {
    process.nextTick(function(){
        cb(null, user)
    })
})



//Routes
module.exports = (router) => {
    router.route('/register')
        .post(registerPostController)

    router.route('/login')
        .get(
            handleAuth,
            loginGetController
        )
        .post(
            passport.authenticate('local'),
            loginPostController
        )

    router.route('/exercise')
        .post(
            handleAuth,
            exercisePostConstroller
        )

    router.route('/institution')
        .get(
            handleAuth,
            institutionGetController
        )
        .post(
            handleAuthAdmin,
            institutionPostController
        )
        .put(
            handleAuthAdmin,
            institutionPutController
        )
    
    router.route('/profile/exercises/:id')
        .get(
            handleAuth,
            profileExercisesGetController
        )

    router.route('/profile/metrics/:id')
        .get(
            // handleAuth,
            profileMetricsGetController
        )
    
        router.route('/profile/resumen/:id')
        .get(
            // handleAuth,
            profileResumenGetController
        )
    
    router.route('/logout')
        .post(logoutPostController)
}
