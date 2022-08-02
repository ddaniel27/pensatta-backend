const handleAuth = (req, res, next)=>{
    if(!req.isAuthenticated()){
        res.status(403).json({msg: 'User not logged in', logged: false})
    }else{
        next()
    }
}

const handleAuthAdmin = (req, res, next)=>{
    if(!req.isAuthenticated() || req.user.role !== 'admin'){
        res.status(403).json({msg: 'User not logged in or not an admin', logged: false})
    }else{
        next()
    }
}

module.exports = { handleAuth, handleAuthAdmin }