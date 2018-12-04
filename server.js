const express = require('express')
const bodyParser = require('body-parser');
var justify = require('justified');
    wordCount = require('word-count');
    verifyToken = require('./verifyToken');
    mongoose = require('mongoose')
    config = require('./config')
    // used to create, sign, and verify tokens
    jwt = require('jsonwebtoken'); 
    bcrypt = require('bcryptjs');
const port=process.env.PORT || 3000
userModel = new mongoose.Schema({
    id          : String, 
    userEmail       : String,
    words       : Number,
    start       : Number
},{ versionKey: false })  

User = mongoose.model('User', userModel);
console.log('starting connection to databasse, please hold ...');
mongoose.connect(`mongodb://${config.user}:${config.password}@ds149855.mlab.com:49855/userquota`,{ useNewUrlParser: true }, function (error) {
    if (error) console.error(error);
    else console.log('Connected to the database');
});

//create app
express()
// Allow cors
.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header(
		"Access-Control-Allow-Headers",
		"Origin, X-Requested-With, Content-Type, Accept"
	);
	res.header(
		"Access-Control-Allow-Methods",
		"POST"
	);

	next();
})
.get('/', (req, res) => {
    res.end('hello there, wassap TicTacTrip people ?');
})

// initial authentification
.use(bodyParser.urlencoded({ extended: true })).post('/api/token', (req, res) => {
    let email = req.body.email
        currentTime = Math.floor(Date.now() / 1000)
    // sign the user with email and prepare the token
    let token = jwt.sign({
        id: email
    }, config.secretPassword , {
        expiresIn: 86400 // 24 hours
    })
    // find the authentificated user by email, if it doesn't exist, create one with fresh values
    User.findOne({userEmail : email}, function (err, user) {
        if(!user) {
            var newUser = new User({userEmail : email, words : config.maxWords, start : currentTime})
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
    User.findOne({userEmail : email}, function (err, user) {
        //has correct token means database should have user !
        if(err || !user) {
            res.status(500).end('Our mistake (communism pun not intended)')
        } else {
            // more than one day, should reset counter and update date!
            if(user.start + 60*60*24 <= currentTime) {
                user.start = Math.round((currentTime-user.start) /(60*60*24)) * 60*60*24 + user.start
                user.words = config.maxWords
            }
            // see if the words left for user are sufficient
            if(user.words - wordCount(text) < 0) { 
                res.status(402).end('How about you buy us some coffee first?')
            } else {
                user.words = user.words - wordCount(text)
                User.findOneAndUpdate({_id : user._id},{words : user.words, start : user.start},{new: true}, err => {
                    if(err) res.status('500').end("I think a rat ate internet cables :x")
                    // actually justifying the text, congrats boiii
                    res.end(justify(text,{width : config.length}))
                })
            }            
        } 
    })
})
.listen(port)
