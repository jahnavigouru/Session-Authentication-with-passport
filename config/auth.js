module.exports = {
    ensureAuthenticated: function(req, res, next){
        if(req.isAuthenticated()){
            return next()
        }
        req.flash('error_msg', 'Please login')
        res.redirect('/users/login')
    },
    ensureVerification: function(req, res, next){
        if(req.isAuthenticated()){
            req.flash('error_msg', 'You are already logged in')
            res.redirect('/users/login') 
        }
        return next()
    }
}