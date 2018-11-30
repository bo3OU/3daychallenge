const express = require('express')
const bodyParser = require('body-parser');
var justify = require('justified');
var wordCount = require('word-count');
var verifyToken = require('./verifyToken');
var db = require('./database')
const app = express()
app.use(bodyParser.text());
app.use(express.json())

// used to create, sign, and verify tokens
var jwt = require('jsonwebtoken'); 
var bcrypt = require('bcryptjs');

// justifier un text passé en body (text/plain)
app.post('/api/justify',verifyToken, (req, res, next) => {
    var token = req.headers.authorization; //headers['x-access-token'];
    // verifies secret and checks exp
    /* supersecret est un code secret, je le met ici pour la rapidité*/
    var decoded = jwt.decode(token, {complete: true});
    console.log(decoded.payload);
    if(!db[decoded.payload.id])
        db[decoded.payload.id] = 80000;
    
    if(db[decoded.payload.id] <= wordCount(req.body))
        res.end('salina')
    else
        db[decoded.payload.id] = db[decoded.payload.id] - wordCount(req.body);
        console.log(db)
        res.end(justify(req.body, {width: 80}));

})

// authentification initiale
app.post('/api/token', (req, res) => {
    // if user is found and password is valid
    // create a token
    var token = jwt.sign({
        id: req.headers.email
    }, 'supersecret', {
        expiresIn: 86400 // expires in 24 hours
    });
    
    // return the information including token as JSON
    res.status(200).send({
        auth: true,
        token: token
    });
});

app.listen(3000)
