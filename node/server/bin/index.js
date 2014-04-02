//imports
var http = require('http');
var url = require('url');
var crypto = require('crypto');
var uuid = require('node-uuid');
var querystring = require('querystring');
var mongoose = require('mongoose');
var bunyan = require('bunyan');
var fs = require('fs');
var logentries = require('node-logentries');

//variables
var port =  1337;
var root = '';
var path = '';
var base = '/';
var contentType = '';
var responseCj = {};
var responseBody = '';
var responseHeaders = null;
var responseStatus = null;
var queryData = null;
var requestBody = null;
var log = bunyan.createLogger({name: "api"});
var logger = logentries.logger({
    token:'03ac1839-5c2f-41f7-bd78-5c13727cd60c'
});


/**
 * Setup DB Connection
 */

// Connect to mongodb
var connect = function () {
    var options = { server: { socketOptions: { keepAlive: 1 } } };
    mongoose.connect('mongodb://localhost/api', options);
};
connect();


// Error handler
mongoose.connection.on('error', function (err) {
    log.info(err);
});


// Reconnect when closed
mongoose.connection.on('disconnected', function () {
    connect();
});


// On Connection
mongoose.connection.once('open', function callback() {
    log.info('mongodb connected successfully');
});


// load mongoose models
fs.readdirSync('../models').forEach(function (file) {
    if (~file.indexOf('.js')) {
        require('../models/' + file);
    }
});


/**
 * Route Patterns
 */
var reAPIBillboard = new RegExp('^\/api\/$', 'i');
var reAPIListMovies = new RegExp('^\/api\/movies$', 'i');
var reAPIListMoviesParams = new RegExp('^\/api\/movies\\?.*', 'i');
var reAPIItemMovies = new RegExp('^\/api\/movies\/.*', 'i');


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
    for (i = 0, x = segments.length; i < x; i++) {
        if (segments[i] !== '') {
            parts.push(segments[i]);
        }
    }

    flg = false;
//    root = 'http://' + req.headers.host + ':' + port;
    root = 'http://' + req.headers.host;
    base = root + '/api/';
    path = url.parse(req.url).pathname;
    queryData = url.parse(req.url, true).query;


    //billboard route - RegExp('^\/api\/$','i')
    if (reAPIBillboard.test(req.url)) {
        flg = true;
        log.info('request handler route => ' + req.method + ':reAPIBillboard');
        logger.info('request handler route => ' + req.method + ':reAPIBillboard');

        switch (req.method) {
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
        log.info('request handler route => ' + req.method + ':reAPIListMovies');
        logger.info('request handler route => ' + req.method + ':reAPIListMovies');

        switch (req.method) {
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


    //movies collection route - RegExp('^\/api\/movies?.*','i')
    if (flg === false && reAPIListMoviesParams.test(req.url)) {
        flg = true;
        log.info('request handler route => ' + req.method + ':reAPIListMoviesParams');
        logger.info('request handler route => ' + req.method + ':reAPIListMoviesParams');

        switch (req.method) {
            case 'GET':
                sendListResponseMovies(req, res);
                break;
            default:
                sendErrorResponse(req, res, 'Method Not Allowed', 405);
                break;
        }
    }

    //movie item route - RegExp('^\/api\/movies\/.*','i')
    if (flg === false && reAPIItemMovies.test(req.url)) {
        flg = true;
        log.info('request handler route => ' + req.method + ':reAPIItemMovies');
        logger.info('request handler route => ' + req.method + ':reAPIItemMovies');

        switch (req.method) {
            case 'GET':
                sendItemResponseMovies(req, res, parts[2]);
                break;
            case 'PUT':
                sendItemUpdateResponseMovies(req, res, parts[2]);
                break;
            case 'DELETE':
                sendDeleteResponse(req, res, parts[2]);
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


/**
 * Send Billboard Response - API Starting Point
 */
var sendBillboardResponse = function (req, res) {
    try {
        responseCj = {};
        renderBillboardCollection();
        responseBody = JSON.stringify(responseCj);
        responseHeaders = {
            'Content-Type': contentType,
            'Content-Length': Buffer.byteLength(responseBody)
        };
        responseStatus = 200;

        sendResponse(req, res, responseStatus, responseHeaders, responseBody);
    } catch (ex) {
        sendErrorResponseHelper(req, res, 'Server Error', 500);
    }
};


/**
 *  Create a new Movie Resource
 */
var sendAddMovieResponse = function (req, res) {
    requestBody = '';
    req.on('data', function (chunk) {
        requestBody += chunk;
    });

    req.on('end', function () {
        try {
            var requestMsg = JSON.parse(requestBody);
            var movie = {};

            for (var i = 0; i < requestMsg.template.data.length; i++) {
                movie[requestMsg.template.data[i].name] = requestMsg.template.data[i].value;
            }

            //add default attributes
            if (movie) {
                movie.sysid = genId();
                movie.created_on = new Date();
                movie.updated_on = new Date();
            }

            var movieInstance = new mongoose.models.Movie(movie);

            movieInstance.save(function (err, movieInstance) {
                if (err) {
                    log.error(err);
                    logger.error(err);
                    sendErrorResponseHelper(req, res, 'Server Error', 500);
                }
                responseBody = '';
                responseStatus = 201;
                responseHeaders = { 'Location': base + 'movies/' + movie.sysid };
                sendResponse(req, res, responseStatus, responseHeaders, responseBody);
            });

        } catch (ex) {
            sendErrorResponseHelper(req, res, 'Server Error', 500);
        }
    });
};

/**
 * DELETE an existing movie resource
 * @param movieId
 */
var sendDeleteResponse = function (req, res, movieId) {
    try {
        mongoose.models.Movie.findOneAndRemove({sysid: movieId}, function (err, movie) {
            if (err) {
                log.error(err);
                logger.error(err);
                sendErrorResponseHelper(req, res, 'Server Error', 500);
            }
            log.info('movie ' + movieId + ' - ' + movie.name + ' deleted from db');
            logger.info('movie ' + movieId + ' - ' + movie.name + ' deleted from db');
        });

        responseBody = '';
        responseHeaders = {};
        responseStatus = 204;
        sendResponse(req, res, responseStatus, responseHeaders, responseBody);
    } catch (ex) {
        sendErrorResponseHelper(req, res, 'Server Error', 500);
    }
};

/**
 * GET collection movie resources
 */
var sendListResponseMovies = function (req, res) {
    var movies = null;
    var offset = null;
    var limit = null;
    var pagestart = null;
    var pageend = null;
    responseCj = {}; //default template

    try {

        limit = 5; // default limit
        if (queryData.limit) {
            limit = parseInt(queryData.limit);
        }

        offset = 0; // default offset
        if (queryData.offset) {
            offset = parseInt(queryData.offset);
        }

        pagestart = offset;
        pageend = offset + limit;

        //define query
        if (queryData.name) {
            movies = mongoose.models.Movie.find({name: new RegExp(queryData.name, 'i')}).sort('-created_on');
        } else {
            movies = mongoose.models.Movie.find().sort('-created_on');
        }

        createResponseCjTemplate();
        renderMovieCollectionLinks();
        renderMovieCollectionQueries();
        renderMovieCollectionTemplate();

        //execute query and handle response
        movies.exec(function (err, movies) {
            if (err) {
                log.error(err);
                logger.error(err);
                sendErrorResponseHelper(req, res, 'Server Error', 500);
            }


            if (movies && movies.length > 0) {
                renderMovieCollectionItems(movies.slice(pagestart, pageend));
            } else {
                responseCj.collection.items = [];
            }

            if (queryData.name) {

                //href
                responseCj.collection.href = base + 'movies?name=' + queryData.name + '&offset=' + offset.toString() +
                    '&limit=' + limit.toString();

                // first page of movies
                var link = {};
                link.href = base + 'movies?name=' + queryData.name;
                link.rel = 'first';
                link.prompt = 'first page of results';
                responseCj.collection.links.push(link);

                // next page of movies
                if(pageend < movies.length) {
                    link = {};
                    link.href = base + 'movies?name=' + queryData.name + '&offset=' + (offset + limit).toString() +
                        '&limit=' + limit.toString();
                    link.rel = 'next';
                    link.prompt = 'immediate next page results';
                    responseCj.collection.links.push(link);
                }

                // prev page of movies
                    link = {};
                if (offset < limit) {
                    link.href = base + 'movies?name=' + queryData.name;
                } else {
                    link.href = base + 'movies?name=' + queryData.name + '&offset=' + (offset - limit).toString() +
                        '&limit=' + limit.toString();
                }

                link.rel = 'previous';
                link.prompt = 'immediate previous page results';
                responseCj.collection.links.push(link);

                //last
                link = {};
                link.href = base + 'movies?name=' + queryData.name + '&offset=' + (movies.length - limit).toString() +
                    '&limit=' + limit.toString();
                link.rel = 'last';
                link.prompt = 'last page of results';
                responseCj.collection.links.push(link);

            } else {

                //href
                responseCj.collection.href = base + 'movies?offset=' + offset.toString() +
                    '&limit=' + limit.toString();

                // first page of movies
                var link = {};
                link.href = base + 'movies';
                link.rel = 'first';
                link.prompt = 'first page of results';
                responseCj.collection.links.push(link);

                // next page of movies
                if(pageend < movies.length) {
                    link = {};
                    link.href = base + 'movies?offset=' + (offset + limit).toString() +
                        '&limit=' + limit.toString();
                    link.rel = 'next';
                    link.prompt = 'immediate next page results';
                    responseCj.collection.links.push(link);
                }

                // prev page of movies
                link = {};
                if (offset < limit) {
                    link.href = base + 'movies';
                } else {
                    link.href = base + 'movies?offset=' + (offset - limit).toString() +
                        '&limit=' + limit.toString();
                }
                link.rel = 'previous';
                link.prompt = 'immediate previous page results';
                responseCj.collection.links.push(link);

                //last
                link = {};
                link.href = base + 'movies?offset=' + (movies.length - limit).toString() +
                    '&limit=' + limit.toString();
                link.rel = 'last';
                link.prompt = 'last page of results';
                responseCj.collection.links.push(link);
            }

            responseBody = JSON.stringify(responseCj);
            responseHeaders = {
                'Content-Type': contentType,
                'Content-Length': Buffer.byteLength(responseBody)
            };
            responseStatus = 200;
            sendResponse(req, res, responseStatus, responseHeaders, responseBody);
        });
    } catch (ex) {
        sendErrorResponseHelper(req, res, 'Server Error', 500);
    }
};


/**
 * PUT (update) existing movie
 */
var sendItemUpdateResponseMovies = function (req, res, movieId) {
    requestBody = '';
    req.on('data', function (chunk) {
        requestBody += chunk;
    });

    req.on('end', function () {
        try {
            var requestMsg = JSON.parse(requestBody);
            log.info({requestMsg: requestMsg}, "log incoming movie put");
            logger.info({requestMsg: requestMsg}, "log incoming movie put");

            var movie = {};
            for (var i = 0; i < requestMsg.template.data.length; i++) {
                movie[requestMsg.template.data[i].name] = requestMsg.template.data[i].value;
            }

            var movieInstance = new mongoose.models.Movie(movie);
            movieInstance.validate(function (err) {
                if (err) {
                    log.error(err);
                    logger.error(err);
                    sendErrorResponseHelper(req, res, 'missing required parameter', 500);
                }

                mongoose.models.Movie.findOne({'sysid': movieId}, function (err, existingMovie) {
                    if (err) {
                        log.error(err);
                        logger.error(err);
                        sendErrorResponseHelper(req, res, 'Movie not found for updating, check ID', 500);
                    }

                    existingMovie.name = movie.name;
                    existingMovie.description = movie.description;
                    existingMovie.datePublished = movie.datePublished;
                    existingMovie.about = movie.about;
                    existingMovie.genre = movie.genre;
                    existingMovie.version = movie.version;
                    existingMovie.timeRequired = movie.timeRequired;
                    existingMovie.contentRating = movie.contentRating;
                    existingMovie.updated_on = new Date();

                    existingMovie.save(function (err) {
                        if (err) {
                            sendErrorResponseHelper(req, res, 'Failed updating movie', 500);
                        }
                        sendItemResponseMovies(req, res, movieId);
                    });
                });
            });
        } catch (ex) {
            sendErrorResponseHelper(req, res, 'Server Error', 500);
        }
    });
};

/**
 *  GET movie individual movie resource
 */
var sendItemResponseMovies = function (req, res, movieId) {
    try {
        responseCj = {};
        mongoose.models.Movie.findOne({'sysid': movieId}, function (err, movie) {
            if (err) {
                log.error(err);
                logger.error(err);
                sendErrorResponseHelper(req, res, 'Error, Invalid ID', 204);
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
                };
                responseStatus = 200;
                sendResponse(req, res, responseStatus, responseHeaders, responseBody);
            } else {
                responseBody = null;
                responseHeaders = {
                    'Content-Type': contentType
                };
                responseStatus = 404;
                sendResponse(req, res, responseStatus, responseHeaders, responseBody);
            }
        });
    } catch (ex) {
        sendErrorResponseHelper(req, res, 'Server Error', 500);
    }
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
        title: title,
        code: code
    };

    responseBody = JSON.stringify(responseCj);
    responseHeaders = {
        'Content-Type': contentType,
        'Content-Length': Buffer.byteLength(responseBody)
    };
    responseStatus = code;

    sendResponse(req, res, responseStatus, responseHeaders, responseBody);
};


/**
 * send the http response to client
 */
var sendResponse = function (req, res, responseStatus, responseHeaders, responseBody) {
    var now = new Date();

    responseHeaders["Cache-Control"] = "no-cache, no-store, must-revalidate";
    responseHeaders["Connection"] = "Close";
    responseHeaders["Date"] = now.toISOString();
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
    item.prompt = 'version of this release';
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
    query.href = base + 'movies';
    query.rel = 'search';
    query.rt = 'movie';
    query.prompt = 'Movie-Search By Name';
    query.name = 'movie-search';
    query.data = {'name': 'name', 'value': '', 'prompt': 'Name'};
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
            item.href = base + 'movies/' + coll[i].sysid;
            item.rel = 'item';
            item.rt = 'movie';
            item.data = [];
            item.links = [];

            //conditional linkItem
            if (coll[i].director) {
                linkItem = {};
                linkItem.name = coll[i].director;
                linkItem.rel = 'director';
                linkItem.prompt = 'director of the movie';
                linkItem.href = base + 'persons/1234';
                linkItem.render = 'link';
                item.links.push(linkItem);
            }

            linkItem = {};
            linkItem.rel = 'type';
            linkItem.href = 'https://rawgithub.com/bryanbarnard/ISWQ2014/master/docs/movies.xml#movie';
            item.links.push(linkItem);

            //data
            dataItem = {};
            dataItem.name = 'name';
            dataItem.value = coll[i].name;
            dataItem.prompt = 'title of the movie';
            item.data.push(dataItem);

            dataItem = {};
            dataItem.name = 'description';
            dataItem.value = coll[i].description;
            dataItem.prompt = 'description of movie';
            item.data.push(dataItem);

            dataItem = {};
            dataItem.name = 'datePublished';
            dataItem.value = coll[i].datePublished;
            dataItem.prompt = 'date movie was published';
            item.data.push(dataItem);

            dataItem = {};
            dataItem.name = 'about';
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

            dataItem = {};
            dataItem.name = 'created';
            dataItem.value = coll[i].created_on.toISOString();
            dataItem.prompt = 'record created';
            item.data.push(dataItem);

            dataItem = {};
            dataItem.name = 'updated';
            dataItem.value = coll[i].updated_on.toISOString();
            dataItem.prompt = 'record last updated';
            item.data.push(dataItem);

            responseCj.collection.items.push(item);
        }
    }
};


/**
 * Build and render Default MovieCollection Links
 */
var renderMovieCollectionLinks = function () {
    var link = {};

    link = {};
    link.href = 'https://rawgithub.com/bryanbarnard/ISWQ2014/master/docs/movies.xml';
    link.rel = 'profile';
    responseCj.collection.links.push(link);

    link = {};
    link.href = 'https://rawgithub.com/bryanbarnard/ISWQ2014/master/docs/movies.xml#movie';
    link.rel = 'type';
    responseCj.collection.links.push(link);
};


/**
 *  Render Billboard Response
 */
var renderBillboardCollection = function () {
    var links, linkItem;
    links = [];

    responseCj = {};
    responseCj.collection = {};
    responseCj.collection.version = "1.0";
    responseCj.collection.href = base;

    linkItem = {};
    linkItem.href = 'https://rawgithub.com/bryanbarnard/ISWQ2014/master/docs/movies.xml';
    linkItem.prompt = "profile";
    linkItem.rel = "profile";
    links.push(linkItem);

    linkItem = {};
    linkItem.href = base + "movies";
    linkItem.prompt = "Movies Collection";
    linkItem.rel = "movies";
    links.push(linkItem);

    linkItem = {};
    linkItem.href = "http://bryanbarnard.github.io/ISWQ2014/";
    linkItem.prompt = "API Documentation";
    linkItem.rel = "help";
    links.push(linkItem);

    responseCj.collection.links = links;
};


/**
 * Gen ID Helper Method
 */
var genId = function () {
    var id = uuid();
    id = id.replace(/-/g, '');
    return id;
};


/**
 * Create Collection JSON Response Template
 */
var createResponseCjTemplate = function () {
    responseCj.collection = {};
    responseCj.collection.version = "1.0";
    responseCj.collection.href = base;
    responseCj.collection.links = [];
    responseCj.collection.items = [];
    responseCj.collection.queries = [];
    responseCj.collection.template = {};
};


//main
http.createServer(handler).listen(port);
log.info('http server listening http://localhost:' + port + '/api/');
logger.info('http server listening http://localhost:' + port + '/api/');

/**
 * Sample CURL Requests
 */
//curl -X POST -v -H "Content-Type: application/vnd.collection+json" -H "Connection: close" -H "Cache-Control: no-cache" -d '{"template":{"data":[{"name":"text","value":"testing"},{"name":"junk","value":""}]}}' http://localhost:8080/api/
