const Joi = require('joi');
const User = require('./user');
const constants = require('../routes/constants');

exports.registerNewUser = function (req, res) {
    //#swagger.description = Register a new user
    const schema = Joi.object().keys({
        username : Joi.string().required(),
        password : Joi.string().required(),
        email :    Joi.string().email().required(),
        image :    Joi.string().uri().required(),
    });

    const body = req.body;
    const result = schema.validate(req.body);
    
    if(result.error) {
        console.log(result.error);
        res.status(400).send({error: result.error.message}); //sending errors in response for easy testing. Normally not displayed to user
    }
    else {
        User.register({ username: body.username, email: body.email, image: body.image, role: 2 }, body.password, (err) => {
            if (!err) {
                res.status(200).send({result: 'User registered successfully'});
            }
            else {
                res.status(400).send({error: err.message}); 
            }
        })
    }   
}

exports.sendLoginMessage = function (req, res) {
    //#swagger.description = Send a login prompt in case user is not logged in
    res.status(400).send({error: 'To access this API, please login to your account at /login'});
}


exports.sendLoginFailureResponse = function (req, res) {
    //#swagger.description = Send a failed login response
    res.status(400).send({error: req.session.messages});
}

exports.sendLoginResponse = function (req, res) {
    //#swagger.description = Send a succesful login response
    res.status(200).send({result: 'Logged in successfully'});
}

exports.logoutUser = function (req, res) {
    //#swagger.description = Send a succesful login response
    req.logout(function(err) {
        if (err) { return res.status(400).send({error: constants.responses.FAILURE_RESPONSE}) }
        res.status(200).send({result: 'You have been logged out'});
    });
}