const { getInstitutions, checkInstitution, registerNewInstitution, updateValues } = require('./sqlQueries.controller')

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

module.exports = { institutionGetController, institutionPostController, institutionPutController }