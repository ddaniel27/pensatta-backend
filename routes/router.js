const bcrypt = require('bcryptjs')
const passport = require('passport')
const LocalStrategy = require('passport-local')
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
    logoutPostController

} = require('../controller/requests.controller')

const {createConnection} = require('../controller/sqlQueries.controller')
const connection = createConnection()
connection.query('SELECT 1')


passport.use(new LocalStrategy({usernameField:"email",passwordField:"password", passReqToCallback:true},function verify(req, email, password, cb){
    connection.query(`SELECT * FROM users WHERE email = '${email}';`, (err, result) => {
        if( err ) { return cb(err) }
        if( !result.length ) { return cb(null, false) }
        if( !bcrypt.compareSync(password, result[0].password) ) { return cb(null, false) }
        return cb(null, {
            id: result[0].id,
            email: result[0].email,
            name: result[0].name,
            institution_code: result[0].institution_code,
            role: result[0].role,
            borned_date: result[0].borned_date,
            created_date: result[0].created_date
        })
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

    router.post('/logout', logoutPostController)

    router.route('/profile/resumen/:id')
        .get(
            handleAuth,
            async (req, res) => {}
        )
}
