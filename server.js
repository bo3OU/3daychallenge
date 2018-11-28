const express = require('express')
const bodyParser = require('body-parser');
var justify = require('justified');
var verifyToken = require('./verifyToken');

const app = express()
app.use(bodyParser.text());
app.use(express.json())

// used to create, sign, and verify tokens
var jwt = require('jsonwebtoken'); 
var bcrypt = require('bcryptjs');

// justifier un text passé en body (text/plain)
app.post('/api/justify',verifyToken, (req, res, next) => {
    var token = req.headers.authorization //headers['x-access-token'];
    // verifies secret and checks exp
    /* supersecret est un code secret, je le met ici pour la rapidité*/
    var decoded = jwt.decode(token, {complete: true});
    console.log(decoded.payload)
    res.end(justify(req.body, {width: 80}))
})

// authentification initiale
app.post('/api/token', (req, res) => {
    // if user is found and password is valid
    // create a token
    var token = jwt.sign({
        id: req.body.email,
        length : 80000
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