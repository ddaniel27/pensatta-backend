const bcrypt = require('bcryptjs')
const { 
        registerNewUser, 
        checkEmail, 
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
    } = require('./sqlQueries.controller')

/* Handle Authentication */
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

/* Register controllers */
const registerPostController = async (req, res) => {
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
}

/* Login Controllers */
const loginGetController = (req, res) => {
    res.status(200).json({msg: 'User logged in', logged: true, user: req.user})
}

const loginPostController = (req,res) => {
    res.status(200).json({msg: 'User logged in', logged: true, user: req.user})
}

/* Exercise Controllers */
const exercisePostConstroller = async (req, res) => {
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

/* Institution Controllers */
const institutionGetController = async (_, res) => {
    try{
        const result = await getInstitutions()
        res.status(200).json({msg: 'Institutions retrieved', institutions: result})
    }catch(err){
        res.status(500).json({err:err, msg:"We have a problem", institutions: []})
    }
}

const institutionPostController = async (req, res) => {
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

const institutionPutController = async (req, res) => {
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

/* Profile Exercises Controllers */
const profileExercisesGetController = async (req, res) => {
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

/* Logout Controllers */
const logoutPostController = async (req, res) => {
    await req.logOut()
    req.session.destroy()
    await res.clearCookie('sessionId')
    res.status(200).json({msg: 'User logged out', logged: false})
}

/* Profile Resumen Controllers */
const profileResumenGetController = async (req, res) => {}

module.exports = {
    registerPostController,
    loginGetController,
    loginPostController,
    exercisePostConstroller,
    institutionGetController,
    institutionPostController,
    institutionPutController,
    profileExercisesGetController,
    logoutPostController,
    handleAuth,
    handleAuthAdmin,
    profileResumenGetController
}