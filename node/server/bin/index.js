//entry point
var restify = require('../node_modules/restify');
var env_port = 3000;

restify.defaultResponseHeaders = false; // disable default headers altogether

//[GET, HEAD]
var respondDefault = function (req, res, next) {

    if (req.is('text/plain')) {
        res.contentType = 'text/plain';
        res.status(200);
        res.send('we accept content type text/plain');
        //curl -is http://localhost:3000 -X GET -H 'connection: close' -H 'Content-Type: text/plain; charset=utf-8'
    } else {
        //curl -is http://localhost:3000 -X GET -H 'connection: close' -H 'Content-Type: application/json; charset=utf-8'
        res.contentType = 'text/plain';
        res.status(407);
        res.send('we only accept content type text/plain');
    }
}

//[GET]
var respondMovies = function (req, res, next) {
    res.contentType = 'application/json';
    res.status(200);
    res.send({movie: 'world'});
}

//[GET]
var respondActors = function (req, res, next) {
    res.contentType = 'application/json';
    res.status(200);
    res.send({actors: 'world'});
}

//* RESPOND NOT FOUND
var respondNotFound = function (req, res, next) {
    res.contentType = 'text/plain';
    res.status(404);
    res.send('invalid url requested');
}

var server = restify.createServer();

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
