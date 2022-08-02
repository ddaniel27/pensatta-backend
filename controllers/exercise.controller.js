const { updateAverageStudent, updateAverageGrade, registerNewExercise } = require('./sqlQueries.controller')

const exercisePostConstroller = async (req, res) => {
    try {
        const { exercise, score, time } = req.body
        const { id } = req.user
        const result = await Promise.all([
            updateAverageStudent(id, score, time),
            registerNewExercise( id, exercise, score, time )
        ])
        await updateAverageGrade(id, result[0].average_score, result[0].average_time)
        res.status(200).json({msg: 'New exercise registered', updated: true})
    } catch (err) {
        res.status(500).json({err:err, msg:"We have a problem", updated: false})
    }
}

module.exports = { exercisePostConstroller }