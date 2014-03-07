//imports
var http = require('http');
var url = require('url');
var crypto = require('crypto');
var uuid = require('node-uuid');
var querystring = require('querystring');
var mongoose = require('mongoose');
var fs = require('fs');
var bunyan = require('bunyan');
//var movieCollectionStatic = require('./movie_collection.json');
//var movieItemStatic = require('./movie_item.json');
//var billboardResponseStatic = require('./billboard.json');

//variables
var port = (process.env.PORT || 1337);
var root = '';
var path = '';
var base = '/';
var contentType = '';
var responseCj = {};
var responseBody = '';
var responseHeaders = null;
var responseStatus = null;
var requestBody = null;
var log = bunyan.createLogger({name: "api"});


/**
 * Setup DB Connection
 */

// Connect to mongodb
var connect = function () {
    var options = { server: { socketOptions: { keepAlive: 1 } } }
    mongoose.connect('mongodb://localhost/api', options)
}
connect();


// Error handler
mongoose.connection.on('error', function (err) {
    log.info(err)
});


// Reconnect when closed
mongoose.connection.on('disconnected', function () {
    connect()
});


// On Connection
mongoose.connection.once('open', function callback () {
    log.info('mongodb connected successfully');
});


// Bootstrap models
fs.readdirSync('../models').forEach(function (file) {
    if (~file.indexOf('.js')) {
      require('../models/' + file);
    }
});


/**
 * Lets Run Some Tests with Mongoose
 */

// create and save movie
/*
var instance = new mongoose.models.Movie({ name: 'Red Dawn'});
log.info('instance.name: ' + instance.name);
*/

//instance.save(function (err, instance) {
//    if (err) {
//        return console.error(err);
//    }
//    console.log('instance.name: ' + instance.name + ' saved');
//});

//get movies from DB
/*
mongoose.models.Movie.find(function (err, movies) {
    if (err) {
        log.error(err);
        return console.error(err);
    }

    if (movies && movies.length > 0) {
        log.info({movies: movies});
    }
});
*/


/**
 * Route Patterns
 */
var reAPIBillboard = new RegExp('^\/api\/$','i');
var reAPIListMovies = new RegExp('^\/api\/movies$','i');
var reAPIItemMovies = new RegExp('^\/api\/movies\/.*','i');

/**
 * Create Collection JSON Response Template
 */
var createResponseCjTemplate = function() {
    responseCj.collection = {};
    responseCj.collection.version = "1.0";
    responseCj.collection.href = base;
    responseCj.collection.links = [];
    responseCj.collection.items = [];
    responseCj.collection.queries = [];
    responseCj.collection.template = {};
};

/**
 * Handle incoming requests
 */
var handler = function (req, res) {
    var segments, i, x, parts, flg;


    //some simple content negotiation
    if (req.headers.accept && req.headers.accept.indexOf('application/vnd.collection+json') != -1) {
        contentType = 'application/vnd.collection+json';
    } else {
        contentType = 'application/json';
    }

    // parse incoming request URL
    parts = [];
    segments = req.url.split('/');
    for(i=0, x=segments.length; i<x; i++) {
        if(segments[i]!=='') {
            parts.push(segments[i]);
        }
    }

    flg = false;
    root = 'http://' + req.headers.host;
    base = root + '/api/';
    path = url.parse(req.url).pathname;

    //capture request body
    requestBody = '';
    req.on('data', function (chunk) {
        requestBody += chunk;
    });

    //billboard route - RegExp('^\/api\/$','i')
    if (reAPIBillboard.test(req.url)) {
        flg = true;
        log.info('request handler route => reAPIBillboard');

        switch(req.method) {
            case 'GET':
                sendBillboardResponse(req, res);
                break;
            default:
                sendErrorResponse(req, res, 'Method Not Allowed', 405);
                break;
        }
    }

    //movies collection route - RegExp('^\/api\/movies$','i')
    if (flg === false && reAPIListMovies.test(req.url)) {
        flg = true;
        log.info('request handler route => reAPIListMovies');

        switch(req.method) {
            case 'GET':
                sendListResponseMovies(req, res);
                break;
            case 'POST':
                sendAddMovieResponse(req, res);
                break;
            default:
                sendErrorResponse(req, res, 'Method Not Allowed', 405);
                break;
        }
    }

    //movie item route - RegExp('^\/api\/movies\/.*','i')
    if (flg === false && reAPIItemMovies.test(req.url)) {
        flg = true;
        log.info('request handler route => reAPIItemMovies');

        switch(req.method) {
            case 'GET':
                sendItemResponseMovies(req, res, parts[2]);
                break;
            case 'PUT':
                //sendItemUpdateResponseMovies(req, res);
                break;
            case 'DELETE':
                sendDeleteResponse(req, res);
                break;
            default:
                sendErrorResponse(req, res, 'Method Not Allowed', 405);
                break;
        }
    }

    //not found
    if (flg === false) {
        log.info('request handler route not found. URL: ' + req.url);
        sendErrorResponse(req, res, 'Resource Not Found', 404);
    }
};


var sendAddMovieResponse = function (req, res) {
    req.on('end', function () {
        try {
            //TODO: add validation and add functionality

            //build response
            var id = uuid();
            id = id.replace(/-/g,'');

            //responseCj = billboardResponseStatic;
            responseBody = '';
            responseHeaders = {
                'Location': base + 'movies/' + id
            }

            responseStatus = 201;
            sendResponse(req, res, responseStatus, responseHeaders, responseBody);

        } catch (ex) {
            sendErrorResponseHelper(req, res, 'Server Error', 500);
        }
    });
};


var sendBillboardResponse = function (req, res) {
    req.on('end', function () {
        try {
            responseCj = {};
            renderBillboardCollection();
            responseBody = JSON.stringify(responseCj);
            responseHeaders = {
                'Content-Type': contentType,
                'Content-Length': Buffer.byteLength(responseBody)
            }
            responseStatus = 200;

            sendResponse(req, res, responseStatus, responseHeaders, responseBody);
        } catch (ex) {
            sendErrorResponseHelper(req, res, 'Server Error', 500);
        }
    });
};


var sendDeleteResponse = function (req, res) {
    req.on('end', function () {
        try {
            responseBody = '';
            responseHeaders = {};
            responseStatus = 204;

            sendResponse(req, res, responseStatus, responseHeaders, responseBody);
        } catch (ex) {
            sendErrorResponseHelper(req, res, 'Server Error', 500);
        }
    });
};


var sendListResponseMovies = function (req, res) {
    req.on('end', function () {
        try {
            responseCj = {};
            mongoose.models.Movie.find(function (err, movies) {
                if (err) {
                    log.error(err);
                    return console.error(err);
                }

                if (movies && movies.length > 0) {
                    createResponseCjTemplate();
                    renderMovieCollectionLinks();
                    renderMovieCollectionItems(movies);
                    renderMovieCollectionQueries();
                    renderMovieCollectionTemplate();

                    responseBody = JSON.stringify(responseCj);
                    responseHeaders = {
                        'Content-Type': contentType,
                        'Content-Length': Buffer.byteLength(responseBody)
                    }
                    responseStatus = 200;
                    sendResponse(req, res, responseStatus, responseHeaders, responseBody);
                }
            });
        } catch (ex) {
            sendErrorResponseHelper(req, res, 'Server Error', 500);
        }
    });
};


var sendItemResponseMovies = function (req, res, movieId) {
    req.on('end', function () {
        try {
            responseCj = {};
            mongoose.models.Movie.findOne({'id': movieId}, function (err, movie) {
                if (err) {
                    log.error(err);
                    return console.error(err);
                }

                if (movie) {
                    createResponseCjTemplate();
                    renderMovieCollectionLinks();
                    renderMovieCollectionItems([movie]);
                    renderMovieCollectionQueries();
                    renderMovieCollectionTemplate();

                    responseBody = JSON.stringify(responseCj);
                    responseHeaders = {
                        'Content-Type': contentType,
                        'Content-Length': Buffer.byteLength(responseBody)
                    }
                    responseStatus = 200;
                    sendResponse(req, res, responseStatus, responseHeaders, responseBody);
                } else {
                    responseBody = null;
                    responseHeaders = {
                        'Content-Type': contentType
                    }
                    responseStatus = 404;
                    sendResponse(req, res, responseStatus, responseHeaders, responseBody);
                }
            });
        } catch (ex) {
            sendErrorResponseHelper(req, res, 'Server Error', 500);
        }
    });
};

var sendErrorResponse = function (req, res, title, code) {
    req.on('end', function () {
       sendErrorResponseHelper(req, res, title, code);
    });
};

var sendErrorResponseHelper = function (req, res, title, code) {
    responseCj = {};
    responseCj.collection = {};
    responseCj.collection.version = "1.0";
    responseCj.collection.href = base;
    responseCj.error = {
        title : title,
        code: code
    };

    responseBody = JSON.stringify(responseCj);
    responseHeaders = {
        'Content-Type': contentType,
        'Content-Length': Buffer.byteLength(responseBody)
    }
    responseStatus = code;

    sendResponse(req, res, responseStatus, responseHeaders, responseBody);
};


/**
 * send the http response to client
 */
var sendResponse = function (req, res, responseStatus, responseHeaders, responseBody) {
    res.writeHead(responseStatus, responseHeaders);
    res.end(responseBody);
};

/**
 * Render Movie Write Template (POST, PUT)
 */
var renderMovieCollectionTemplate = function () {
    var template = {};
    var item = {};

    template.data = [];

    item = {};
    item.name = 'name';
    item.value = '';
    item.prompt = 'title of movie';
    item.required = 'true';
    template.data.push(item);

    item = {};
    item.name = 'description';
    item.value = '';
    item.prompt = 'description of movie';
    item.required = 'true';
    template.data.push(item);

    item = {};
    item.name = 'datePublished';
    item.value = '';
    item.prompt = 'date movie was published';
    item.required = 'true';
    template.data.push(item);

    item = {};
    item.name = 'about';
    item.value = '';
    item.prompt = 'short description of film';
    item.required = 'true';
    template.data.push(item);

    item = {};
    item.name = 'genre';
    item.value = '';
    item.prompt = 'movie genre';
    item.required = 'true';
    template.data.push(item);

    item = {};
    item.name = 'version';
    item.value = '';
    item.prompt = 'version of thie release';
    item.required = 'true';
    template.data.push(item);

    item = {};
    item.name = 'timeRequired';
    item.value = '';
    item.prompt = 'time required to view this movie aka duration';
    item.required = 'true';
    template.data.push(item);

    item = {};
    item.name = 'contentRating';
    item.value = '';
    item.prompt = 'movie content rating';
    item.required = 'true';
    template.data.push(item);

    responseCj.collection.template = template;
};

/**
 * Render movie collection queries
 */
var renderMovieCollectionQueries = function () {
    var query = {};

    query = {};
    query.rel = 'collection sort';
    query.prompt = 'Sort by Name';
    query.href = base + '/movies/sortbyname';
    responseCj.collection.queries.push(query);
};

/**
 * Render movie collection items
 */
var renderMovieCollectionItems = function (coll) {

    var item, dataItem, linkItem;
    responseCj.collection.items = [];

    //iterate coll
    if (coll && coll.length > 0) {
        for (var i = 0; i < coll.length; i++) {

            //item
            item = {};
            item.links = [];
            item.data = [];
            item.href = base + 'movies/' + coll[i].id;

            //data
            dataItem = {};
            dataItem.name = 'description';
            dataItem.value = coll[i].description;
            dataItem.prompt = 'description of movie';
            item.data.push(dataItem);

            dataItem = {};
            dataItem.name = 'datePublished'
            dataItem.value = coll[i].datePublished;
            dataItem.prompt = 'date movie was published';
            item.data.push(dataItem);

            dataItem = {};
            dataItem.name = 'name'
            dataItem.value = coll[i].name;
            dataItem.prompt = 'title of the movie';
            item.data.push(dataItem);

            dataItem = {};
            dataItem.name = 'about'
            dataItem.value = coll[i].about;
            dataItem.prompt = 'short description of this item';
            item.data.push(dataItem);

            dataItem = {};
            dataItem.name = 'genre';
            dataItem.value = coll[i].genre;
            dataItem.prompt = 'movie genre';
            item.data.push(dataItem);

            dataItem = {};
            dataItem.name = 'version';
            dataItem.value = coll[i].version;
            dataItem.prompt = 'version of this release';
            item.data.push(dataItem);

            dataItem = {};
            dataItem.name = 'timeRequired';
            dataItem.value = coll[i].timeRequired;
            dataItem.prompt = 'time required to view this movie, aka duration';
            item.data.push(dataItem);

            dataItem = {};
            dataItem.name = 'contentRating';
            dataItem.value = coll[i].contentRating;
            dataItem.prompt = 'rating of the movie';
            item.data.push(dataItem);

            linkItem = {};
            linkItem.name = coll[i].director;
            linkItem.rel = 'director';
            linkItem.prompt = 'director of the movie';
            linkItem.href = base + 'persons/' + coll[i].director_id;
            linkItem.render = 'link';
            item.links.push(linkItem);

            responseCj.collection.items.push(item);
        }
    }
};

/**
 * Build and render MovieCollection Links
 */
var renderMovieCollectionLinks = function () {

    var link = {};

    link = {};
    link.href = base + 'movies';
    link.rel = 'home';
    responseCj.collection.links.push(link);

    link = {};
    link.href = base + 'movie-alps.xml';
    link.rel = 'profile';
    responseCj.collection.links.push(link);
};

var renderBillboardCollection = function () {
    var links, linkItem;
    links = [];

    responseCj = {};
    responseCj.collection = {};
    responseCj.collection.version = 1.0;
    responseCj.href = base;

    linkItem = {};
    linkItem.href = base + "movie-apls.xml";
    linkItem.rel = "profile";
    links.push(linkItem);

    linkItem = {};
    linkItem.href = base + "movies";
    linkItem.prompt = "Movies Collection"
    linkItem.rel = "movies";
    links.push(linkItem);

    linkItem = {};
    linkItem.href = base + "persons";
    linkItem.prompt = "Persons Collection"
    linkItem.rel = "persons";
    links.push(linkItem);

    linkItem = {};
    linkItem.href = base + "docs";
    linkItem.prompt = "API Documentation"
    linkItem.rel = "documentation";
    links.push(linkItem);

    responseCj.links = links;
};


//main
http.createServer(handler).listen(port);
log.info('http server listening http://localhost:' + port + '/api/');

/**
 * Sample Requests
 */
//curl -X POST -v -H "Content-Type: application/vnd.collection+json" -H "Connection: close" -H "Cache-Control: no-cache" -d '{"template":{"data":[{"name":"text","value":"testing"},{"name":"junk","value":""}]}}' http://localhost:8080/api/
