const express = require("express");
const app = express();
const session = require('express-session');
const bcrypt = require('bcrypt');
const mysql = require('mysql'); 

app.set('view engine', 'ejs');
app.use(express.static("public"));

app.use(session ({
    secret: "top secret!",
    resave: true,
    saveUninitialized: true 
})); 

app.use(express.urlencoded({extended: true}));

//routes
app.get("/", function(req, res) {
    res.render("index");
}); 

app.post("/", async function(req, res){
    
    let username = req.body.username;
    let password = req.body.password;
    
    let result = await checkUsername(username);
    console.dir(result);
    let hashedPwd = "";
    
    if (result.length > 0) {
        hashedPwd = result[0].password;
    } 
    
    let passwordMatch = await checkPassword(password, hashedPwd);
    console.log("passwordMatch:" + passwordMatch);
    
    if (passwordMatch) {
        req.session.userLogged = username;
        res.render("welcome");
    } else {
        res.render("index", {"loginError":true});
    }

});

app.get("/myAccount", isAuthenticated, function(req, res) {
    res.render("account");
});

//check a passord against the hash received from the database
function checkPassword(password, hashedValue){
    return new Promise( function(resolve, reject){
        bcrypt.compare(password, hashedValue, function(err, result) {
            console.log("Result: " + result);
            resolve(result);
        });
    });
}

//check to see if any user is logged on 
function isAuthenticated(req, res, next) {
    if (typeof(req.session.userLogged) == "undefined"){
        res.redirect("/");
    }else{
        next();
    }
}

//destroy the current session if the user logs out    
app.get("/logout", function(req, res){
    req.session.destroy();
    res.redirect("/");
})

function createDBConnection() {
    var conn  = mysql.createPool({
        connectionLimit: 15,
        host: "aqx5w9yc5brambgl.cbetxkdyhwsb.us-east-1.rds.amazonaws.com",
        user: "hs5myapojoylquun",
        password: "txdmdvhmkxtssfrf",
        database: "bepuy5ijvb0xwfel"
    });
    return conn;
}

//verify that a username is in the database    
function checkUsername(username){
    let sql = "SELECT * FROM users WHERE username = ?";
    return new Promise(function(resolve, reject){
        let conn = createDBConnection();
        conn.query(sql, [username], function (err, rows, fields){
            if (err) throw err;
            console.log("Rows found: " + rows.length);
            resolve(rows);
        }); //query
    }); //promise
}

//hash a password in order to add it to the database
function hashPassword(password){
    return new Promise(function(resolve, reject){
        bcrypt.hash(password, saltRounds, function(err, hash) {
            console.log("Hash: " + hash);
            resolve(hash);
        });
    })
}

//listener
app.listen(8080, "0.0.0.0", function() {
    console.log("Running Express Server...");
}); 
