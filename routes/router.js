const bcrypt = require('bcryptjs')
const passport = require('passport')
const LocalStrategy = require('passport-local')
const { registerNewUser, checkEmail, createConnection } = require('../controller/sqlQueries.controller')
const connection = createConnection()

passport.use(new LocalStrategy({usernameField:"email",passwordField:"password", passReqToCallback:true},function verify(req, email, password, cb){
    connection.query(`SELECT * FROM users WHERE email = '${email}';`, (err, result) => {
        if( err ) { return cb(err) }
        if( !result.length ) { return cb(null, false) }
        if( !bcrypt.compareSync(password, result[0].password) ) { return cb(null, false) }
        return cb(null, {
            id: result[0].id,
            email: result[0].email,
            name: result[0].name,
            inst: result[0].inst,
            borned_on: result[0].borned_on,
            created_at: result[0].created_at
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
    router.post('/register', async (req, res) => {
        try {
            const { email } = req.body
            const isNewUser = await checkEmail(email)
            if(isNewUser.length) { res.status(200).json({msg: 'User already exists', exists: true}) }
            else {
                const newUser = {
                    email: req.body.email,
                    password: bcrypt.hashSync(req.body.password, 10),
                    name: req.body.name,
                    inst: req.body.inst,
                    borned_on: req.body.borned_on,
                    created_at: new Date()
                }
                await registerNewUser(newUser)
                res.status(200).json({msg: 'User registered', registered: true, exists: false})
            }
        } catch (err) {
            res.status(500).json({err:err, msg:"We have a problem", registered: false})
        }
    })

    router.post('/login',passport.authenticate('local'),function(req,res){
        res.status(200).json({msg: 'User logged in', logged: true, user: req.user})
    })
    router.post('/logout', async function(req, res){
        await req.logOut()
        req.session.destroy()
        await res.clearCookie('sessionId')
        res.status(200).json({msg: 'User logged out', logged: false})
    })
    router.get('/login',function(req,res){
        if(req.isAuthenticated()){
        res.status(200).json({msg: 'User logged in', logged: true, user: req.user})
        } else {
        res.status(200).json({msg: 'User not logged in', logged: false})
        }
    })
}