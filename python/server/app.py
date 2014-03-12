"""
BottlePy API Implementation for ISWQ2014
"""
import logging

logging.basicConfig(format='%(asctime)s %(message)s')

LOGGER = logging.getLogger('app')
LOGGER.setLevel('INFO')

import json
from bottle import *
from models.Movie import *
from templates.LinkCJ import LinkCJ
from templates.ErrorCJ import ErrorCJ
from templates.MoviesTemplateCJ import MoviesTemplateCJ
from templates.MovieItemCJ import MovieItemCJ
from templates.MoviesCollectionTemplateCJ import MoviesCollectionTemplateCJ
import mongoengine
import datetime
import uuid


HOST = 'localhost'
PORT = 1337
PATH = '/api/'
BASE = 'http://'
ROOT = BASE + HOST + ':' + str(PORT) + PATH
DATETIMESTAMP = datetime.datetime.utcnow().isoformat() + 'Z'


# application setting
app = default_app();
app.config['autojson'] = False


# setup response Content-Type
def determine_response_content_type(accept_header):
    if accept_header and 'application/vnd.collection+json' in accept_header:
        return 'application/vnd.collection+json'
    else:
        return 'application/json'


# routes
# default
@app.route('/')
def callback():
    LOGGER.info('ROUTE: /')
    abort(404, "not found")


# billboard route - '^\/api$'
@app.route(path='/api/', method='GET')
def callback():
    LOGGER.info('Logging Request: METHOD: ' + request.method + ' => ROUTE: /api/')
    response.set_header('Date', DATETIMESTAMP)

    try:
        # check accepts and content type
        # content_type = request.headers.get('Content-Type')
        accept = request.headers.get('Accept')
        response.set_header('Content-Type', determine_response_content_type(accept))
        response.status = 200

        collection = dict()
        links = list()

        link = LinkCJ(ROOT + 'movies-alps.xml', 'profile', 'profile')
        links.append(link.to_dict())

        link = LinkCJ(ROOT + 'movies', 'Movies Collection', 'movies')
        links.append(link.to_dict())

        link = LinkCJ(ROOT + 'persons', 'Persons Collection', 'persons')
        links.append(link.to_dict())

        link = LinkCJ(ROOT + 'docs', 'API Documentation', 'documentation')
        links.append(link.to_dict())

        collection['version'] = '1.0'
        collection['href'] = ROOT
        collection['links'] = links

        response_body = {
            'collection': collection,
        }

        return json.dumps(response_body)
    except Exception as e:
        LOGGER.error('Unexpected exception ' + str(e))
        response.status = 500
        response_body = ErrorCJ(ROOT, 'Error Title', 500, str(e))
        return response_body.to_json()


# movies collection route - '^\/api\/movies$'
@app.route(path='/api/movies', method='GET')
def callback():
    LOGGER.info('Logging Request: METHOD: ' + request.method + ' => ROUTE: /api/movies')
    response.set_header('Date', DATETIMESTAMP)

    try:
        accept = request.headers.get('Accept')
        response.set_header('Content-Type', determine_response_content_type(accept))

        # connect to mongodb
        mongoengine.connect('api')

        movie_collection = MoviesCollectionTemplateCJ(ROOT)

        limit = 5
        for movie in Movie.objects[:limit]:
            movie_item = MovieItemCJ(ROOT, movie)
            movie_collection.items.append(movie_item.to_dict())

        response.status = 200
        response_body = movie_collection.to_json()
        return response_body

    except Exception as e:
        LOGGER.error('Unexpected exception ' + str(e))
        response.status = 500
        response_body = ErrorCJ(ROOT, 'Error Title', 500, str(e))
        return response_body.to_json()


# movie item route - '^\/api\/movies\/.*'
@app.route(path='/api/movies/<mid:re:.+>', method='GET')
def callback(mid):
    LOGGER.info('Logging Request: METHOD: ' + request.method + ' => ROUTE: /api/movies/' + mid)
    response.set_header('Date', DATETIMESTAMP)

    try:
        accept = request.headers.get('Accept')
        response.set_header('Content-Type', determine_response_content_type(accept))

        # connect to mongodb and lookup movie with matching sysid
        mongoengine.connect('api')
        movie = Movie.objects.get(sysid=mid)
        movie_item = MovieItemCJ(ROOT, movie)
        movie_collection = MoviesCollectionTemplateCJ(ROOT)
        movie_collection.items.append(movie_item.to_dict())

        response.status = 200
        response_body = movie_collection.to_json()
        return response_body

    except DoesNotExist:
        LOGGER.warning('Does not exist warning, cannot find movie with sysid: ' + mid)
        response.status = 204
        return

    except Exception as e:
        LOGGER.error('Unexpected exception ' + str(e))
        response.status = 500
        response_body = ErrorCJ(ROOT, 'Error Title', 500, str(e))
        return response_body.to_json()


# movie item route - '^\/api\/movies$'
@app.route(path='/api/movies', method='POST')
def callback():
    LOGGER.info('Logging Request: METHOD: ' + request.method + ' => ROUTE: /api/movies')
    response.set_header('Date', DATETIMESTAMP)

    try:
        accept = request.headers.get('Accept')
        response.set_header('Content-Type', determine_response_content_type(accept))

        if 'application/json' not in request.headers.get(
                'Content-Type') and 'application/vnd.collection+json' not in request.headers.get('Content-Type'):

            LOGGER.error('Unsupported media type sent')
            response.status = 415
            response_body = ErrorCJ(ROOT, 'Invalid Content-Type', 415, 'application/json and application/vnd.collection+json supported')
            return response_body.to_json()


        request_json = json_loads(request._get_body_string())
        if request_json:
            # connect to mongodb and lookup movie with matching sysid
            mongoengine.connect('api')
            movie = Movie()
            movie.sysid = str(uuid.uuid4()).replace("-", "")
            movie.name = "bob"
            movie.about = "new movie"
            movie.contentRating = "r"
            movie.datePublished = "1993-03-28T21:51:08.406Z"
            movie.description = "a really good movie"
            movie.director = "sam samson"
            movie.genre = "comedy"
            movie.timeRequired = "PT120M"
            movie.created_on = datetime.datetime.now
            movie.updated_on = datetime.datetime.now
            movie.version = "1.0"
            movie.save()

            print request_json
            print len(request_json["template"]["data"])

        movie_dict = dict()
        for item in request_json["template"]["data"]:
            print item["name"] + " - " + item["value"]
            movie_dict[item["name"]] = item["value"]

        # print request_json["template"]["data"][0]["name"] + ' - ' + request_json["template"]["data"][0]["value"]
        # print request_json["template"]["data"][1]["name"] + ' - ' + request_json["template"]["data"][1]["value"]
        # print request_json["template"]["data"][2]["name"] + ' - ' + request_json["template"]["data"][2]["value"]
        # print request_json["template"]["data"][3]["name"] + ' - ' + request_json["template"]["data"][3]["value"]
        # print request_json["template"]["data"][4]["name"] + ' - ' + request_json["template"]["data"][4]["value"]
        # print request_json["template"]["data"][5]["name"] + ' - ' + request_json["template"]["data"][5]["value"]
        # print request_json["template"]["data"][6]["name"] + ' - ' + request_json["template"]["data"][6]["value"]

        response.set_header('Location', request.url + '/1234')
        response.status = 201
        return

    except Exception as e:
        LOGGER.error('Unexpected exception ' + str(e))
        response.status = 500
        response_body = ErrorCJ(ROOT, 'Error Title', 500, str(e))
        return response_body.to_json()


# movie item route - '^\/api\/movies\/.*'
@app.route(path='/api/movies/<id:re:.+>', method='PUT')
def callback(mid):
    LOGGER.info('Logging Request: METHOD: ' + request.method + ' => ROUTE: /api/movies/' + mid)
    response.set_header('Date', DATETIMESTAMP)

    try:
        accept = request.headers.get('Accept')
        response.set_header('Content-Type', determine_response_content_type(accept))
        response.status = 200

        with open('movie_item.json') as json_data:
            response_body = json.load(json_data)
            json_data.close()
        return json.dumps(response_body)

    except Exception as e:
        LOGGER.error('Unexpected exception ' + str(e))
        response.status = 500
        response_body = ErrorCJ(ROOT, 'Error Title', 500, str(e))
        return response_body.to_json()


# movie item route - '^\/api\/movies\/.*'
@app.route(path='/api/movies/<mid:re:.+>', method='DELETE')
def callback(mid):
    LOGGER.info('Logging Request: METHOD: ' + request.method + ' => ROUTE: /api/movies/' + mid)
    response.set_header('Date', DATETIMESTAMP)

    try:
        accept = request.headers.get('Accept')
        response.set_header('Content-Type', determine_response_content_type(accept))

        # connect to mongodb and delete movie with matching sysid
        mongoengine.connect('api')

        # make sure we are only deleting one record
        movies = Movie.objects(sysid=mid)[:1]
        movies.delete()
        response.status = 204
        return

    except Exception as e:
        LOGGER.error('Unexpected exception ' + str(e))
        response.status = 500
        response_body = ErrorCJ(ROOT, 'Error Title', 500, str(e))
        return response_body.to_json()

# main
run(app, host=HOST, port=PORT, debug=True)
