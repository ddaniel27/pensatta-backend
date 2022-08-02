const { changeLastLogin } = require('./sqlQueries.controller')

const loginGetController = (req, res) => {
    res.status(200).json({msg: 'User logged in', logged: true, user: req.user})
}

const loginPostController = (req,res) => {
    changeLastLogin(new Date(), req.user.id)
    res.status(200).json({msg: 'User logged in', logged: true, user: req.user})
}

module.exports = { loginGetController, loginPostController }