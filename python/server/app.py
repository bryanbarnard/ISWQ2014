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

HOST = 'localhost'
PORT = 1337
PATH = '/api/'
BASE = 'http://'
ROOT = BASE + HOST + ':' + str(PORT) + PATH


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

    try:
        accept = request.headers.get('Accept')
        response.set_header('Content-Type', determine_response_content_type(accept))
        movie_collection = MoviesCollectionTemplateCJ(ROOT)

        # connect to mongodb
        mongoengine.connect('api')

        limit = 5
        for movie in Movie.objects[:limit]:
            print movie.name
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


# movies collection route - '^\/api\/movies$'
@app.route(path='/api/movies', method='POST')
def callback():
    LOGGER.info('Logging Request: METHOD: ' + request.method + ' => ROUTE: /api/movies')

    try:
        accept = request.headers.get('Accept')
        response.set_header('Content-Type', determine_response_content_type(accept))
        response.set_header('Location', request.url + '/1234')
        response.status = 201

    except Exception as e:
        LOGGER.error('Unexpected exception ' + str(e))
        response.status = 500
        response_body = ErrorCJ(ROOT, 'Error Title', 500, str(e))
        return response_body.to_json()


# movie item route - '^\/api\/movies\/.*'
@app.route(path='/api/movies/<mid:re:.*>', method='GET')
def callback(mid):
    LOGGER.info('Logging Request: METHOD: ' + request.method + ' => ROUTE: /api/movies/' + mid)

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
@app.route(path='/api/movies/<id:re:.*>', method='PUT')
def callback(mid):
    LOGGER.info('Logging Request: METHOD: ' + request.method + ' => ROUTE: /api/movies/' + mid)

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
@app.route(path='/api/movies/<id:re:.*>', method='DELETE')
def callback(mid):
    LOGGER.info('Logging Request: METHOD: ' + request.method + ' => ROUTE: /api/movies/' + mid)

    try:
        accept = request.headers.get('Accept')
        response.set_header('Content-Type', determine_response_content_type(accept))
        response.status = 200
        response_body = {}
        return json.dumps(response_body)

    except Exception as e:
        LOGGER.error('Unexpected exception ' + str(e))
        response.status = 500
        response_body = ErrorCJ(ROOT, 'Error Title', 500, str(e))
        return response_body.to_json()

# main
run(app, host=HOST, port=PORT, debug=True)
