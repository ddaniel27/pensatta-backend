const { getHistory, getExercises, getResumen, getInstitutionName } = require('./sqlQueries.controller')


const profileExercisesGetController = async (req, res) => {
    try{
        const result = await getHistory(req.params.id, 200)
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
        res.status(200).json({msg: 'Resumen retrieved', resumen: result, 'institution_name': institutionName})
    }catch(err){
        res.status(500).json({err:err, msg:"We have a problem", resumen: {}, 'institution_name': ''})
    }
}

module.exports = { profileExercisesGetController, profileMetricsGetController, profileResumenGetController }