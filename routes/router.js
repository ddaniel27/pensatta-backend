const bcrypt = require('bcryptjs')
const passport = require('passport')
const LocalStrategy = require('passport-local')
const { 
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
        registerNewInstitution,
        getHistory,
        getInstitutionName
    } = require('../controller/sqlQueries.controller')
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


const handleAuth = (req, res, next)=>{
    if(!req.isAuthenticated()){
        res.status(403).json({msg: 'User not logged in', logged: false})
    }else{
        next()
    }
}

const handleAuthAdmin = (req, res, next)=>{
    if(!req.isAuthenticated() || req.user.role !== 'admin'){
        res.status(403).json({msg: 'User not logged in or not admin', logged: false})
    }else{
        next()
    }
}

module.exports = (router) => {
    router.post('/register', async (req, res) => {
        try {
            const { email, inst } = req.body
            const isNewUser = await checkEmail(email)
            if(isNewUser.length) { res.status(200).json({msg: 'User already exists', exists: true}) }
            if(inst === "ADMIN") { res.status(200).json({msg: 'Admin cannot register', exists: false}) }
            const instExists = await checkInstitution(inst)
            if(!instExists.length) { res.status(200).json({msg: 'Institution not found', exists: false}) }
            else {
                const newUser = {
                    email: req.body.email,
                    password: bcrypt.hashSync(req.body.password, 10),
                    name: req.body.name,
                    inst: req.body.inst,
                    borned_on: req.body.borned_on,
                    created_at: new Date()
                }
                const result = await getNewAverage({prevAverage: 'average_score', totalItems: 'num_students', table: 'institution', target: newUser.inst, score: 0})
                await Promise.all([
                    registerNewUser(newUser),
                    updateValues({table: 'institution', target: newUser.inst, column: 'average_score', value: result.finalAverage}),
                    incrementValues({table: 'institution', target: newUser.inst, column: 'num_students', increment: 1})
                ])
                res.status(200).json({msg: 'User registered', registered: true, exists: false})
            }
        } catch (err) {
            res.status(500).json({err:err, msg:"We have a problem", registered: false})
        }
    })

    router.route('/login')
        .get(
            handleAuth,
            (req, res) => {
                res.status(200).json({msg: 'User logged in', logged: true, user: req.user})
            }
        )
        .post(
            passport.authenticate('local'),
            (req,res) => {
                res.status(200).json({msg: 'User logged in', logged: true, user: req.user})
            }
        )

    router.post('/exercise', 
        handleAuth,
        async (req, res) => {
            try {
                const { exercise, score, time } = req.body
                const { id, institution_code } = req.user
                const [result, resultTime] = await Promise.all([ 
                    getNewAverage({prevAverage: 'average_score', totalItems: 'total_exercises', table: 'users', target: id, score: score}),
                    getNewAverage({prevAverage: 'average_time', totalItems: 'total_exercises', table: 'users', target: id, score: time})
                ])
                await Promise.all([
                    updateValues({table: 'users', target: id, column: 'average_score', value: result.finalAverage}), 
                    updateValues({table: 'users', target: id, column: 'average_time', value: resultTime.finalAverage}),
                    incrementValues({table: 'users', target: id, column: 'total_exercises', increment: 1}),
                    registerNewExercise({exerciseId: exercise, score: score, studentId:id, time: time, created_at: new Date()})
                ])
                const updatedAverage = await getUpdatedCurrAverage(id, result.initAverage)
                await updateValues({table: 'institution', target: institution_code, column: 'average_score', value: updatedAverage.toFixed(2)})
                res.status(200).json({msg: 'New exercise registered', updated: true})
            } catch (err) {
                res.status(500).json({err:err, msg:"We have a problem", updated: false})
            }
        }
    )

    router.route('/institution')
        .get(
            handleAuth,
            async (_, res) => {
                try{
                    const result = await getInstitutions()
                    res.status(200).json({msg: 'Institutions retrieved', institutions: result})
                }catch(err){
                    res.status(500).json({err:err, msg:"We have a problem", institutions: []})
                }
            }
        )

        .post(
            handleAuthAdmin,
            async (req, res) => {
                const { institution_code, name, email, country, province, city } = req.body
                if(!institution_code || !name || !email || !country || !province || !city ) { return res.status(200).json({msg: 'Missing parameters', registered: false}) }
                try {
                    const instExists = await checkInstitution(institution_code)
                    if(instExists.length) { return res.status(200).json({msg: 'Institution already exists', registered: false}) }
                    await registerNewInstitution({institution_code: institution_code, name: name, email: email, country: country, province: province, city: city})
                    res.status(200).json({msg: 'Institution registered', registered: true})
                } catch (err) {
                    res.status(500).json({err:err, msg:"We have a problem", registered: false})
                }
            }
        )

        .put(
            handleAuthAdmin,
            async (req, res) => {
                const { institution_code, field, value } = req.body
                if(!institution_code || !field || value === undefined || value === null) { res.status(200).json({msg: 'Missing parameters', updated: false}) }
                if(field === 'average_score' || field === 'num_students') { res.status(200).json({msg: 'Cannot update this field', updated: false}) }
                try {
                    await updateValues({table: 'institution', target: institution_code, column: field, value: value})
                    res.status(200).json({msg: 'Institution updated', updated: true})
                } catch (err) {
                    res.status(500).json({err:err, msg:"We have a problem", updated: false})
                }
            }
        )
    
    router.route('/profile/exercises/:id')
        .get(
            handleAuth,
            async (req, res) => {
                try{
                    const result = await getHistory(req.params.id)
		            const institutionName = await getInstitutionName(req.user.institution_code)
                    const finalResult = result.map(item => {
                        const timeToSeconds = Math.round(item.time / 1000)
                        const timeStr = `${Math.floor(timeToSeconds/60)}:${timeToSeconds%60 < 10 ? "0"+timeToSeconds%60 : timeToSeconds%60}`
                        return({'exercise_id': item.exercise_id, 'score': item.score, 'time': timeStr})
                    })
                    res.status(200).json({msg: 'History retrieved', history: finalResult, 'institution_name': institutionName})
                }catch(err){
                    res.status(500).json({err:err, msg:"We have a problem", history: []})
                }
            }
        )

    router.post('/logout', async function(req, res){
        await req.logOut()
        req.session.destroy()
        await res.clearCookie('sessionId')
        res.status(200).json({msg: 'User logged out', logged: false})
    })

    router.route('/profile/resumen/:id')
        .get(
            handleAuth,
            async (req, res) => {}
        )
}
