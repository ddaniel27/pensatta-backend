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
        getInstitutionName,
        getExercises,
        changeLastLogin,
        getResumen
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
        const { email, inst } = req.body //Get email and institution from body
        const isNewUser = await checkEmail(email)

        //Check if user already exists in database or trying to register an Admin
        if(isNewUser.length) { return res.status(200).json({msg: 'User already exists', exists: true}) }
        if(inst === "ADMIN") { return res.status(200).json({msg: 'Admin cannot register', exists: false}) }

        //Check if institution exists
        const instExists = await checkInstitution(inst)
        if(!instExists.length) { return res.status(200).json({msg: 'Institution not found', exists: false}) }

        const newUser = {
            email: req.body.email,
            password: bcrypt.hashSync(req.body.password, 10),
            name: req.body.name,
            inst: req.body.inst,
            borned_on: req.body.borned_on,
            created_at: new Date(),
            last_login: new Date(),
        }
        const result = await getNewAverage({prevAverage: 'average_score', totalItems: 'num_students', table: 'institution', target: newUser.inst, score: 0})
        await Promise.all([
            registerNewUser(newUser), //Register new user
            updateValues({table: 'institution', target: newUser.inst, column: 'average_score', value: result.finalAverage}), //Update institution average score
            incrementValues({table: 'institution', target: newUser.inst, column: 'num_students', increment: 1}) //Increment institution number of students
        ])

        res.status(200).json({msg: 'User registered', registered: true, exists: false})

    } catch (err) {
        res.status(500).json({err:err, msg:"We have a problem", registered: false}) //If error, return error
    }
}

/* Login Controllers */
const loginGetController = (req, res) => {
    res.status(200).json({msg: 'User logged in', logged: true, user: req.user})
}

const loginPostController = (req,res) => {
    changeLastLogin(new Date(), req.user.id) // Add last login to user
    res.status(200).json({msg: 'User logged in', logged: true, user: req.user}) // Return user logged
}

/* Exercise Controllers */
const exercisePostConstroller = async (req, res) => {
    try {
        const { exercise, score, time } = req.body
        const { id, institution_code } = req.user
        const [result, resultTime] = await Promise.all([ 
            getNewAverage({prevAverage: 'average_score', totalItems: 'total_exercises', table: 'users', target: id, score: score}), // Update average score
            getNewAverage({prevAverage: 'average_time', totalItems: 'total_exercises', table: 'users', target: id, score: time}) // Update average time
        ])
        await Promise.all([
            updateValues({table: 'users', target: id, column: 'average_score', value: result.finalAverage}),  // Update
            updateValues({table: 'users', target: id, column: 'average_time', value: resultTime.finalAverage}), // Update
            incrementValues({table: 'users', target: id, column: 'total_exercises', increment: 1}), // Update
            registerNewExercise({exerciseId: exercise, score: score, studentId:id, time: time, created_at: new Date()}) // Add new exercise in history
        ])
        // Update institution average
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
        const result = await getInstitutions() // Get all institutions
        res.status(200).json({msg: 'Institutions retrieved', institutions: result})
    }catch(err){
        res.status(500).json({err:err, msg:"We have a problem", institutions: []})
    }
}

const institutionPostController = async (req, res) => {
    const { institution_code, name, email, country, province, city } = req.body
    if(!institution_code || !name || !email || !country || !province || !city ) { return res.status(200).json({msg: 'Missing parameters', registered: false}) }
    try {
        const instExists = await checkInstitution(institution_code) // Check an institution
        if(instExists.length) { return res.status(200).json({msg: 'Institution already exists', registered: false}) } // Return if institution already exists
        await registerNewInstitution({institution_code: institution_code, name: name, email: email, country: country, province: province, city: city}) // Register a new institution
        res.status(200).json({msg: 'Institution registered', registered: true})
    } catch (err) {
        res.status(500).json({err:err, msg:"We have a problem", registered: false})
    }
}

const institutionPutController = async (req, res) => {
    const { institution_code, field, value } = req.body
    if(!institution_code || !field || value === undefined || value === null) { return res.status(200).json({msg: 'Missing parameters', updated: false}) } // Missing parameters
    if(field === 'average_score' || field === 'num_students') { return res.status(200).json({msg: 'Cannot update this field', updated: false}) } // Don't update this
    try {
        await updateValues({table: 'institution', target: institution_code, column: field, value: value}) // Update
        res.status(200).json({msg: 'Institution updated', updated: true})
    } catch (err) {
        res.status(500).json({err:err, msg:"We have a problem", updated: false})
    }
}

/* Profile Exercises Controllers */
const profileExercisesGetController = async (req, res) => {
    try{
        const result = await getHistory(req.params.id, 1000)

        // Map results
        const finalResult = result.map(item => {
            const timeToSeconds = Math.round(item.time / 1000)
            const timeStr = `${Math.floor(timeToSeconds/60)}:${timeToSeconds%60 < 10 ? "0"+timeToSeconds%60 : timeToSeconds%60}`
            return({'exercise_id': item.exercise_id, 'score': item.score, 'time': timeStr})
        })
        res.status(200).json({msg: 'History retrieved', history: finalResult})
    }catch(err){
        res.status(500).json({err:err, msg:"We have a problem", history: []})
    }
}

/* Logout Controllers */
const logoutPostController = async (req, res) => {
    // Just destroy the session
    await req.logOut()
    req.session.destroy()
    await res.clearCookie('sessionId')
    res.status(200).json({msg: 'User logged out', logged: false})
}

/* Profile Resumen Controllers */
const profileMetricsGetController = async (req, res) => {
    try{
        const resultHistory = await getHistory(req.params.id, 1000)
        const idsAndScores = resultHistory.map(item => ({'exercise_id': item.exercise_id, 'score': item.score}))
        const exercisesIds = [...new Set(idsAndScores.map(item => item.exercise_id))]
        const result = await getExercises(exercisesIds)
        const dimCounter = {
            '1': 0,
            '2': 0,
            '3': 0,
            '4': 0,
            '5': 0,
            '6': 0
        }

        //Map dim
        const finalObjResult = result.reduce((acc, item) => {
            const { id, dimension } = item
            const dim_score = idsAndScores.filter(item => item.exercise_id === id).map(item => item.score)
            if(!acc[dimension]) { 
                acc[dimension] = dim_score.reduce((acc, item) => acc + item, 0) / dim_score.length
                dimCounter[dimension] += dim_score.length
            }
            else { 
                const aux = ((acc[dimension] * dimCounter[dimension]) + dim_score.reduce((acc, item) => acc + item, 0)) / (dimCounter[dimension] + dim_score.length)
                acc[dimension] = aux.toFixed(2)
                dimCounter[dimension] += dim_score.length 
            }
            return acc
        }, {})
        
        //Map apr
        const aprObjResult = idsAndScores.reduce((acc, item) => {
            if(item.score < 60.0) { acc['1'] += 1 }
            else if(item.score < 80.0) { acc['2'] += 1 }
            else{ acc['3'] += 1 }
            return acc
        }, {'3': 0, '1': 0, '2': 0})

        // Response
        res.status(200).json({msg: 'Exercises retrieved', spiderValues: finalObjResult, apropiacionValues: aprObjResult})
    }catch(err){
        res.status(500).json({err:err, msg:"We have a problem", spiderValues: {}})
    }
}

const profileResumenGetController = async (req, res) => {
    try{
        const result = await getResumen(req.params.id)
        const institutionName = await getInstitutionName(req.user.institution_code)
        // Return a profile data
        res.status(200).json({msg: 'Resumen retrieved', resumen: result, 'institution_name': institutionName})
    }catch(err){
        res.status(500).json({err:err, msg:"We have a problem", resumen: {}, 'institution_name': ''})
    }
}

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
    profileMetricsGetController,
    profileResumenGetController
}