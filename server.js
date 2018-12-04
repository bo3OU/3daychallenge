const express = require('express')
const bodyParser = require('body-parser');
var justify = require('justified');
    wordCount = require('word-count');
    verifyToken = require('./verifyToken');
    db = require('./database')
    mongoose = require('mongoose')

    // used to sign, decode, and verify tokens
    jwt = require('jsonwebtoken'); 
    bcrypt = require('bcryptjs');

userModel = new mongoose.Schema({
    id          : String, 
    userEmail       : String,
    words       : Number,
    start       : Number
},{ versionKey: false })  

User = mongoose.model('User', userModel);
console.log('starting connection to databasse, please hold ...');
mongoose.connect('mongodb://bo3ou:Alibagho2@ds149855.mlab.com:49855/userquota',{ useNewUrlParser: true }, function (error) {
    if (error) console.error(error);
    else console.log('Connected to the database');
});
mongoose.Promise = global.Promise;

function modifyUser(){

}
//create app
express()
// authentification initiale
.use(bodyParser.urlencoded({ extended: true })).post('/api/token', (req, res) => {
    let email = req.body.email
        currentTime = Math.floor(Date.now() / 1000)
    // sign the user with email and prepare the token
    let token = jwt.sign({
        id: email
    }, 'supersecret', {
        expiresIn: 86400 // 24 hours
    })
    // find the authentificated user by email, if it doesn't exist, create one with fresh values
    User.findOne({userEmail : email}, function (err, user) {
        if(!user) {
            var newUser = new User({userEmail : email, words : 80000, start : currentTime})
            newUser.save(function (err, user) {
                if (err) {
                    // an error occured while creating user
                    res.end({
                        auth: false,
                        usercreation: false,
                        err: 'an error occured while creating the user'
                    })
                } else {
                    // user created, send healthy 200 status with token
                    res.status(200).send({
                        auth: true,
                        token: token,
                        usercreation: true,
                        err: ''
                    });
                } 
            })
        }else {
            // user already exists in the database, only send the token
            res.status(200).send({
                auth: true,
                token: token,
                usercreation : false,
                err: ''
            });
        }
    })
})
// justifier un text passé en body (text/plain)
.use(bodyParser.text()).post('/api/justify',verifyToken, (req, res, next) => {
    let token = req.headers.authorization //headers['x-access-token'];
    // verifies secret and checks exp
    /* supersecret est un code secret, je le met ici pour la rapidité*/
    let decoded = jwt.decode(token, {complete: true})
        email = decoded.payload.id
        currentTime = Math.floor(Date.now() / 1000)
        text = req.body
    console.log({
        'decode' : decoded,
        'email' : email,
        'currentTime' : currentTime,
        'text' : text
    })
    User.findOne({userEmail : email}, function (err, user) {
        if(err || !user) {
            res.status(500).end('our mistake')
        } else {
            if(user.start + 60*60*24 <= currentTime) {
                user.start = Math.round((currentTime-user.start) /(60*60*24)) * 60*60*24 + user.start
                user.words = 80000
            }
            if(user.words - wordCount(text) < 0) { //higher than 80000
                res.status(402).end('if you like put some money on it')
            } else {
                user.words = user.words - wordCount(text)
                User.findOneAndUpdate(user._id,{words : user.words, start : user.start}, err => {
                    if(err) console.log(err)
                    res.end(justify(text))
                })
            }            
        } 
    })
})
.listen(3000)
