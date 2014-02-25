//imports
var http = require('http');
var url = require('url');
var crypto = require('crypto');
var uuid = require('node-uuid');
var querystring = require('querystring');
var movieCollection = require('./movie_collection.json');
var movieItem = require('./movie_item.json');
//var items = require('./data.js').friends;
var billboardResponse = require('./billboard.json');

//variables
var port = (process.env.PORT || 1337);
var root = '';
var path = '';
var base = 'http://localhost:1337/api/';
var contentType = ''
var responseCj = {};
var responseBody = '';
var responseHeaders = null;
var responseStatus = null;
var requestBody = null;
var reAPIBillboard = new RegExp('^\/api\/$','i');
var reAPIListMovies = new RegExp('^\/api\/movies$','i');
var reAPIItemMovies = new RegExp('^\/api\/movies\/.*','i');

var handler = function (req, res) {

    //simple content negotiation
    if (req.headers.accept && req.headers.accept.indexOf('application/vnd.collection+json') != -1) {
        contentType = 'application/vnd.collection+json';
    } else {
        contentType = 'application/json';
    }

    var flg = false;
    root = 'http://' + req.headers.host;
    path = url.parse(req.url).pathname;

    //capture request body
    requestBody = '';
    req.on('data', function (chunk) {
        requestBody += chunk;
    });

    //branch billboard
    if (reAPIBillboard.test(req.url)) {
        flg = true;
        console.log('reAPIBillboard true');

        switch(req.method) {
            case 'GET':
                sendBillboardResponse(req, res);
                break;
            default:
                break;
        }
    }

    //branch movies
    if (flg === false && reAPIListMovies.test(req.url)) {
        flg = true;
        console.log('reAPIListMovies true');

        switch(req.method) {
            case 'GET':
                sendListResponseMovies(req, res);
                break;
            case 'POST':
                sendAddMovieResponse(req, res);
                break;
            case 'DELETE':
                sendDeleteResponse(req, res);
                break;
            default:
                break;
        }
    }

    //branch movie
    if (flg === false && reAPIItemMovies.test(req.url)) {
        flg = true;
        console.log('reAPIItemMovies true');

        switch(req.method) {
            case 'GET':
                sendItemResponseMovies(req, res);
                break;
            case 'POST':
                //sendNotAcceptedResponse
            case 'PUT':
                //sendItemUpdateResponseMovies(req, res);
                break;
            case 'DELETE':
                sendDeleteResponse(req, res);
                break;
            default:
                break;
        }
    }


    //not found
    if (flg === false) {
        console.log('send not found');
        sendNotFoundResponse(req, res);
    }
};

var sendAddMovieResponse = function (req, res) {
    req.on('end', function () {

        //TODO: add validation and add functionality


        //build response
        var id = uuid();
        id = id.replace(/-/g,'');

        //responseCj = billboardResponse;
        responseBody = '';
        responseHeaders = {
            'Location': base + 'movies/' + id
        }
        responseStatus = 201;

        sendResponse(req, res, responseStatus, responseHeaders, responseBody);
    });
};

var sendBillboardResponse = function (req, res) {
    req.on('end', function () {
        //build response

        responseCj = billboardResponse;
        responseBody = JSON.stringify(responseCj);
        responseHeaders = {
            'Content-Type': contentType,
            'Content-Length': Buffer.byteLength(responseBody)
        }
        responseStatus = 200;

        sendResponse(req, res, responseStatus, responseHeaders, responseBody);
    });
};


var sendDeleteResponse = function (req, res) {
    responseBody = '';
    responseHeaders = {};
    responseStatus = 204;
    sendResponse(req, res, responseStatus, responseHeaders, responseBody);
};

var sendNotFoundResponse = function (req, res) {
    responseBody = '';
    responseHeaders = {};
    responseStatus = 404;
    sendResponse(req, res, responseStatus, responseHeaders, responseBody);
};

var sendListResponseMovies = function (req, res) {
    req.on('end', function () {
        //build response

        responseCj = movieCollection;
        responseBody = JSON.stringify(responseCj);
        responseHeaders = {
            'Content-Type': contentType,
            'Content-Length': Buffer.byteLength(responseBody)
        }
        responseStatus = 200;

        sendResponse(req, res, responseStatus, responseHeaders, responseBody);
    });
};

var sendItemResponseMovies = function (req, res) {
    req.on('end', function () {
        //build response

        responseCj = movieItem;
        responseBody = JSON.stringify(responseCj);
        responseHeaders = {
            'Content-Type': contentType,
            'Content-Length': Buffer.byteLength(responseBody)
        }
        responseStatus = 200;

        sendResponse(req, res, responseStatus, responseHeaders, responseBody);
    });
};

var sendResponse = function (req, res, responseStatus, responseHeaders, responseBody) {
    res.writeHead(responseStatus, responseHeaders);
    res.end(responseBody);
};


//main
http.createServer(handler).listen(port);

var cjTemplate = {
    "collection":
    {
        "version":"0.1",
        "href": base,
        "links":[
            base + "/movies",
            base + "/actors"
        ],
        "items":[],
        "queries":[],
        "template":{},
        "error":{}
    }
};

/*
 var server = http.createServer(function(request, response) {
 var body = '';

 request.on('data', function (chunk) {
 body += chunk;
 });

 request.on('end', function () {
 var now = new Date();
 var msg = '';

 console.log('request received: ' + now.toISOString());
 console.log('request.method: ' + request.method);
 console.log('request.url: ' + request.url);
 console.log('request.httpVersion: ' + request.httpVersion);
 console.log('request.headers:');

 //log headers
 for (var header in request.headers) {
 console.log('  ' + header + ': ' + request.headers[header]);
 }

 console.log('request.body:');
 //console.log('  ' + body);

 try {
 msg = JSON.parse(body);
 console.log(JSON.stringify(msg, null, 4)); //4 is the spacer arg
 }
 catch(ex) {
 console.log('error parsing body as JSON');
 }

 console.log(); //insert line break
 response.writeHead(200);
 response.end();
 });
 }).listen(port, 'localhost');
 console.log('server listening at http://localhost:8080');
 */

/**
 * Sample Requests
 */
//curl -X POST -v -H "Content-Type: application/vnd.collection+json" -H "Connection: close" -H "Cache-Control: no-cache" -d '{"template":{"data":[{"name":"text","value":"testing"},{"name":"junk","value":""}]}}' http://localhost:8080/api/