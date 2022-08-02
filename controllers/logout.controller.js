const logoutPostController = async (req, res) => {
    await req.logOut()
    req.session.destroy()
    await res.clearCookie('sessionId')
    res.status(200).json({msg: 'User logged out', logged: false})
}

module.exports = { logoutPostController }