const bcrypt = require('bcryptjs')
const { 
    checkEmail, 
    checkInstitution, 
    registerNewUser, 
    registerNewStudent,
    registerNewTeacher,
    updateNewAverageGrade, 
} = require('./sqlQueries.controller')

const registerPostController = async (req, res) => {
    try {
        const { email, inst } = req.body
        if(!email || !inst) { return res.status(400).json({ error: 'Missing parameters' }) }
        const isNewUser = await checkEmail(email)
        if(isNewUser.length) { return res.status(409).json({msg: 'User already exists', exists: true}) }
        if(inst === "ADMIN") { return res.status(403).json({msg: 'Admin cannot register', exists: true}) }

        const instExists = await checkInstitution(inst)
        if(!instExists.length) { return res.status(404).json({msg: 'Institution not found', exists: true}) }

        const newUser = {
            email: req.body.email,
            password: bcrypt.hashSync(req.body.password, 10),
            name: req.body.name,
            inst: req.body.inst,
            borned_on: req.body.borned_on,
            created_at: new Date(),
            last_login: new Date(),
            role: req.body?.role,
        }

        const newUserId = await registerNewUser(newUser)
        if(req.body?.role === 'teacher') {
            const newTeacherId = await insertTeacher({ id: newUserId, inst })
            if(!newTeacherId) { return res.status(500).json({msg: 'Error registering teacher', exists: true}) }
        }else{
            const newStudentId = await insertStudent({ id: newUserId, inst, grade: req.body.grade, classId: req.body.classId })
            if(!newStudentId) { return res.status(500).json({msg: 'Error registering student', exists: true}) }
        }
        
        res.status(200).json({msg: 'User registered', registered: true, exists: false})

    } catch (err) {
        res.status(500).json({err:err, msg:"We have a problem", registered: false})
    }
}

const insertStudent = async ({id, inst, grade, classId}) => {
    if(!id || !inst || !grade || !classId) { return false }
    try{
        const newStudent = {
            studentId: id,
            institutionId: inst,
            grade,
            classId,
        }
        const update = {
            target_inst: inst,
            target_grade: grade,
            target_class: classId,
            score: 0
        }
        const newStudentId = await Promise.all([
            registerNewStudent(newStudent),
            updateNewAverageGrade({...update, prevAverage: 'average_score' }),
        ])
        return newStudentId[0]
    }catch(err){
        return false
    }

}

const insertTeacher = async ({ id, inst }) => {
    if(!id || !inst) { return false }
    try{
        const newTeacherId = await registerNewTeacher(id, inst)
        return newTeacherId
    }catch(err){
        return false
    }
}

module.exports = { registerPostController }