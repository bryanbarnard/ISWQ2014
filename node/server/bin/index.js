//entry point
var util = require('util')
var restify = require('../node_modules/restify');
var items = require('./data.js').friends;
var env_port = 3000;
var path = '';
var base = '';
var mType = 'application/vnd.collection+json';
var cj = {};
var URI = "http://localhost:3000";

restify.defaultResponseHeaders = false; // disable default headers altogether

var sendInvalidRequestError = function (req, res, next) {
    res.contentType = 'text/plain';
    res.status(401);
    res.send('we only accept content type ' + mType);
};

var renderCJ = function () {
    cj = {
        "collection":
        {
            "version":"0.1",
            "href":URI,
            "links":[
                URI + "/movies",
                URI + "/actors"
            ],
            "items":[],
            "queries":[],
            "template":{},
            "error":{}
        }
    };
};

//[GET, HEAD]
var respondDefault = function (req, res, next) {
    if (req.accepts(mType)) {
        renderCJ();
        var body = JSON.stringify(cj, null, '\t');
        res.writeHead(200, {
            'Content-Length': Buffer.byteLength(body),
            'Content-Type': mType
        });
        res.end(body);
    } else {
        sendInvalidRequestError(req, res, next);
    }
};

//[GET]
var respondMovies = function (req, res, next) {
    req.accepts(mType);
    res.contentType = 'application/json';
    res.status(200);
    res.send({movie: 'world'});
};

//[GET]
var respondActors = function (req, res, next) {
    req.accepts(mType);
    res.contentType = 'application/json';
    res.status(200);
    res.send({actors: 'world'});
};

//* RESPOND NOT FOUND
var respondNotFound = function (req, res, next) {
    req.accepts(mType);
    res.contentType = 'text/plain';
    res.status(404);
    res.send('invalid url requested');
};

//declare server
var server = restify.createServer({

    //add formatter
    formatters: {
        'application/vnd.collection+json; q=0.9': function formatCJ(req, res, body) {
            if (body instanceof Error)
                return body.stack;

            if (Buffer.isBuffer(body))
                return body.toString('base64');

            var data = JSON.stringify(body);
            res.setHeader('Content-Length', Buffer.byteLength(data));
            return util.inspect(body);
        }
    }
});


//routes
server.get('/', respondDefault);
server.head('/', respondDefault);
server.get('/movies', respondMovies) ;
server.get('/actors', respondActors);
server.on('NotFound', respondNotFound);

//server properties
server.name = 'node_restify';

//start server
server.listen(env_port, function() {
    console.log('%s listening at %s', server.name, server.url);
});


// sample collection object
/*
 {
 "collection" :
 {
 "version" : "1.0",
 "href" : URI,
 "links" : [ARRAY],
 "items" : [ARRAY],
 "queries" : [ARRAY],
 "template" : {OBJECT},
 "error" : {OBJECT}
 }
 }
 */
