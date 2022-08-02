const bcrypt = require('bcryptjs')
const passport = require('passport')
const LocalStrategy = require('passport-local')
const { registerPostController } = require('../controllers/register.controller')
const { profileExercisesGetController, profileMetricsGetController, profileResumenGetController } = require('../controllers/profile.controller')
const { loginGetController, loginPostController } = require('../controllers/login.controller')
const { logoutPostController } = require('../controllers/logout.controller')
const { institutionGetController, institutionPostController, institutionPutController } = require('../controllers/institution.controller')
const { exercisePostConstroller } = require('../controllers/exercise.controller')
const { handleAuth, handleAuthAdmin } = require('../middlewares/auth.middleware')

const { createConnection } = require('../controllers/sqlQueries.controller')
const connection = createConnection()
connection.query('SELECT 1')


passport.use(new LocalStrategy({usernameField:"email",passwordField:"password", passReqToCallback:true},function verify(_req, email, password, cb){
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




module.exports = (router) => {
    router.post('/register', registerPostController)

    router.route('/login')
        .get(
            handleAuth,
            loginGetController
        )
        .post(
            passport.authenticate('local'),
            loginPostController
        )

    router.post('/exercise', 
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

    
    
    router.post('/logout', logoutPostController)
}
