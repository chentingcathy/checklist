/*eslint-env node*/

//------------------------------------------------------------------------------
// node.js starter application for Bluemix
//------------------------------------------------------------------------------

// This application uses express as its web server
// for more info, see: http://expressjs.com
var express = require('express');
var session = require('express-session');
var passport = require('passport');
var cookieParser = require('cookie-parser');
var fs = require('fs');
var https = require('https');
var bodyParser = require('body-parser');

// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');

// work around intermediate CA issue
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// create a new express server
var app = express();

// serve the files out of ./public as our main files
app.use(express.static(__dirname + ''));
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.set('view engine', 'ejs');

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();
global.vcapServices = (process.env.VCAP_SERVICES) ?
    JSON.parse(process.env.VCAP_SERVICES) : JSON.parse(process.env.COBOL_MIGRATION_ASSISTANT_DB);
global.blueID = JSON.parse(process.env.COBOL_MIGRATION_ASSISTANT_BLUEID);

// set env NODE_ENV=production for deploying in production
if (process.env.NODE_ENV !== 'production') {
    app.locals.pretty = true;
    if (process.env.NODE_ENV === 'localhost') {
        require("console-stamp")(console, {
            pattern: "dd/mm/yyyy HH:MM:ss.l"
        });
        blueID.callback_url = "https://localhost:6002/sso/redirect";
    } else {
        blueID.callback_url = "https://cobol-migration-assistant.stage1.mybluemix.net/sso/redirect";
    }
} else {
    blueID.callback_url = "https://cobol-migration-assistant.mybluemix.net/sso/redirect";
}

// =======================================================
// Define the strategy to be used by passport

// express-session
var session_opts = {
    name: 'migrationAssistant.sid',
    resave: true,
    saveUninitialized: false,
    secret: 'kakvevknakddfdssfoelmv983rnvasdjhjksdv',
    unset: 'destroy',
    cookie: {
        httpOnly: true, //don't ever let browser javascript access cookies
        maxAge: 1800000 // 30 mins
    }
};

app.use(cookieParser());
/*
app.use(session({
    resave: 'true',
    saveUninitialized: 'true',
    secret: 'keyboard cat'
}));
*/
app.use(session(session_opts));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (obj, done) {
    done(null, obj);
});

var OpenIDConnectStrategy = require('passport-idaas-openidconnect').IDaaSOIDCStrategy;
var Strategy = new OpenIDConnectStrategy({
        authorizationURL: blueID.authorization_url,
        tokenURL: blueID.token_url,
        clientID: blueID.client_id,
        scope: 'openid',
        response_type: 'code',
        clientSecret: blueID.client_secret,
        callbackURL: blueID.callback_url,
        skipUserProfile: true,
        issuer: blueID.issuer_id
    },
    function (iss, sub, profile, accessToken, refreshToken, params, done) {
        process.nextTick(function () {
            profile.accessToken = accessToken;
            profile.refreshToken = refreshToken;
            done(null, profile);
        })
    });

passport.use(Strategy);

// end of passort strategy
// =======================================================

// =======================================================
// cloudantNoSQL 
var dbCredentials = {
    dbName: 'migration_progress'
        // dbName: 'migration_progress'
};
var cloudant;
var db;

function initDBConnection() {
    dbCredentials.host = vcapServices.cloudantNoSQLDB[0].credentials.host;
    dbCredentials.port = vcapServices.cloudantNoSQLDB[0].credentials.port;
    dbCredentials.user = vcapServices.cloudantNoSQLDB[0].credentials.username;
    dbCredentials.password = vcapServices.cloudantNoSQLDB[0].credentials.password;
    dbCredentials.url = vcapServices.cloudantNoSQLDB[0].credentials.url;

    cloudant = require('cloudant')(dbCredentials.url);

    // check if DB exists if not create
    cloudant.db.create(dbCredentials.dbName, function (err, res) {
        if (err) {
            console.log('Could not create db, %s: ', dbCredentials.dbName, err);
        }
    });

    db = cloudant.use(dbCredentials.dbName);

    if (db == null) {
        console.warn('Could not find Cloudant credentials in VCAP_SERVICES environment variable - data will be unavailable to the UI');
    }
}

initDBConnection();

db.update = function (obj, key, callback) {
    var db = this;
    db.get(key, function (error, existing) {
        if (!error) obj._rev = existing._rev;
        db.insert(obj, key, callback);
    });
}

app.post('/cloudant/saveprogress', function (req, res, next) {
    console.log("saving progress for %s ..... ", req.user.id);
    //    console.log("req.body: ", req.body);

    //need to check if it already exists, if yes, update else insert 
    db.update({
        'id': req.user.id,
        'email': req.user._json.email,
        'progress': req.body.progress
    }, req.user._json.uniqueSecurityName, function (err, res) {
        if (err) {
            console.log('No update!');
        } else {
            console.log('Updated!');
        }
    });
    res.json({
        "status": "success"
    });
});

app.delete('/cloudant/deleteprogress', function (req, res, next) {
    // retreive from db based on user uniqueSercurityName
    console.log("Delete Invoked..");
    var id = req.user._json.uniqueSecurityName;
    console.log("Removing document of ID: ", id);

    db.get(id, {
        revs_info: true
    }, function (err, doc) {
        if (!err) {
            db.destroy(doc._id, doc._rev, function (err, result) {
                // Handle response
                if (err) {
                    console.log(err);
                    res.sendStatus(500);
                } else {
                    res.sendStatus(200);
                }
            });
        }
    });
});


app.get('/cloudant/getprogress', function (req, res, next) {
    console.log("user: ", req.user);
    // retreive from db based on user uniqueSercurityName
    if (req.user) {
        db.get(req.user._json.uniqueSecurityName, function (err, results) {
            res.send(err ? '0' : results);
            res.end();
        });
    }
});


// end of cloudantNoSQL
// =======================================================


// =======================================================
// route to test if the user is logged in or not
// if logged in return user info
/*
var sample_id = {
    "id": "lei@ca.ibm.com",
    "displayName": "Lei Huang",
    "tenantId": "......",
    "_json": {
        "iss": "https://prepiam.toronto.ca.ibm.com",
        "ext": "{\"tenantId\":\"prepiam.toronto.ca.ibm.com\"}",
        "at_hash": "......-G2Q",
        "sub": "lei@ca.ibm.com",
        "email_verified": "true",
        "realmName": "www.ibm.com",
        "uniqueSecurityName": "51A9KM5UV2",
        "preferred_username": "lei@ca.ibm.com",
        "given_name": "Lei",
        "aud": ".....",
        "groupIds": [
            "allUsers",
            "blueidUsers"
        ],
        "name": "Lei Huang",
        "exp": ".....",
        "iat": ".....",
        "family_name": "Huang",
        "email": "lei@ca.ibm.com"
    },
    "accessToken": "......",
    "refreshToken": "......."
};
*/
app.get('/check_login', function (req, res, next) {
    //    console.log("cking if logged in:", req.user);
    res.send(req.isAuthenticated() ? req.user : '0');
});

// route to login
app.get('/sso/login', passport.authenticate('openidconnect', {}));

// handle callback, if authentication succeeds redirect to
// original requested url, otherwise go to /failure
app.get('/sso/redirect', function (req, res, next) {
    var redirect_url = '/#/redirect';
    passport.authenticate('openidconnect', {
        successRedirect: redirect_url,
        failureRedirect: '/failure',
    })(req, res, next);
});

// route to logout
app.get('/sso/logout', function (req, res) {
    console.log("loggingout")

    req.session.destroy();
    req.logout();
    res.sendStatus(200);
    res.end();
});

app.all('/*', function (req, res, next) {
    // Just send the index.html for other files to support HTML5Mode
    res.sendFile('index.html', {
        root: __dirname
    });
});

// Add headers
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    //    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    //    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});


// =======================================================
//console.log("appEnv : ", appEnv);
//console.log("process.env:", process.env);
console.log("using services: ", vcapServices.cloudantNoSQLDB[0].credentials);
if (process.env.VCAP_SERVICES) {
    console.log("VCAP_SERVICES: ", process.env.VCAP_SERVICES);
}

if (process.env.NODE_ENV === 'localhost') {
    // Uncomment the following section if running locally
    https.createServer({
        key: fs.readFileSync('./conf/key.pem'),
        cert: fs.readFileSync('./conf/cert.pem')
    }, app).listen(6002, function () {
        console.log("server starting on https://localhost:6002/");
    });
} else {
    // start server on the specified port and binding host
    app.listen(appEnv.port, function () {
        // print a message when the server starts listening
        console.log("server starting on " + appEnv.url);
    });
}
