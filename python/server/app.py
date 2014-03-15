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
def callback_default():
    LOGGER.info('ROUTE: /')
    abort(404, "not found")


# billboard route - '^\/api$'
@app.route(path='/api/', method='GET')
def callback_get_billboard():
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
def callback_get_movies():
    LOGGER.info('Logging Request: METHOD: ' + request.method + ' => ROUTE: /api/movies')
    response.set_header('Date', DATETIMESTAMP)

    # todo use querystring for query
    LOGGER.info('query_string:' + ' ' + request.query_string + ' ' + str(len(request.query)))

    try:
        accept = request.headers.get('Accept')
        response.set_header('Content-Type', determine_response_content_type(accept))

        # connect to mongodb
        mongoengine.connect('api')


        # handle querystring parameters
        limit = 5  # default
        if request.query.limit:
            limit = int(request.query.limit)

        offset = 0  # default
        if request.query.offset:
            offset = int(request.query.offset)

        page_start = offset
        page_end = offset + limit

        # LOGGER.info('page_start:' + str(page_start) + ' ' + 'page_end:' + str(page_end))

        movie_collection = MoviesCollectionTemplateCJ(ROOT)
        for movie in Movie.objects[page_start:page_end].order_by('-created_on'):
            movie_item = MovieItemCJ(ROOT, movie)
            movie_collection.items.append(movie_item.to_dict())

        movie_collection.href = ROOT + 'movies?offset=' + str(offset) + '&limit=' + str(limit)

        # first page of movies
        link = LinkCJ(ROOT + 'movies', 'first', 'first')
        movie_collection.links.append(link.to_dict())

        #next page of movies
        link = LinkCJ(ROOT + 'movies?offset=' + str(offset + limit) + '&limit=' + str(limit), 'next', 'next')
        movie_collection.links.append(link.to_dict())

        #prev page of movies
        if offset < limit:
            link = LinkCJ(ROOT + 'movies', 'prev', 'prev')
            movie_collection.links.append(link.to_dict())
        else:
            link = LinkCJ(ROOT + 'movies?offset=' + str(offset - limit) + '&limit=' + str(limit), 'prev', 'prev')
            movie_collection.links.append(link.to_dict())

        #last page
        link = LinkCJ(ROOT + 'movies?offset=' + str(len(Movie.objects) - limit) + '&limit=' + str(limit), 'last', 'last')
        movie_collection.links.append(link.to_dict())

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
def callback_get_movie(mid):
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
def callback_post():
    LOGGER.info('Logging Request: METHOD: ' + request.method + ' => ROUTE: /api/movies')
    response.set_header('Date', DATETIMESTAMP)

    try:
        accept = request.headers.get('Accept')
        response.set_header('Content-Type', determine_response_content_type(accept))

        if 'application/json' not in request.headers.get(
                'Content-Type') and 'application/vnd.collection+json' not in request.headers.get('Content-Type'):
            LOGGER.error('Unsupported media type sent')
            response.status = 415
            response_body = ErrorCJ(ROOT, 'Invalid Content-Type', 415,
                                    'application/json and application/vnd.collection+json supported')
            return response_body.to_json()

        request_json = json_loads(request._get_body_string())
        if not request_json:
            raise Exception

        # debug
        # print request_json

        # connect to mongodb
        mongoengine.connect('api')

        # TODO Need to note that we are only expecting a single item to be
        # TODO created at any time
        movie_dict = dict()
        for item in request_json["template"]["data"]:
            movie_dict[item["name"]] = item["value"]

        # new movie
        movie = Movie()
        movie.sysid = str(uuid.uuid4()).replace("-", "")
        movie.created_on = datetime.datetime.now
        movie.updated_on = datetime.datetime.now
        movie.decode(movie_dict)
        movie.save()

        # send the response
        response.set_header('Location', ROOT + 'movies/' + movie.sysid)
        response.status = 201
        movie = None
        return

    except Exception as e:
        LOGGER.error('Unexpected exception ' + str(e))
        response.status = 500
        response_body = ErrorCJ(ROOT, 'Error Title', 500, str(e))
        return response_body.to_json()


# movie item route - '^\/api\/movies\/.*'
@app.route(path='/api/movies/<mid:re:.+>', method='PUT')
def callback_put(mid):
    LOGGER.info('Logging Request: METHOD: ' + request.method + ' => ROUTE: /api/movies/' + mid)
    response.set_header('Date', DATETIMESTAMP)

    try:
        accept = request.headers.get('Accept')
        response.set_header('Content-Type', determine_response_content_type(accept))

        if 'application/json' not in request.headers.get(
                'Content-Type') and 'application/vnd.collection+json' not in request.headers.get('Content-Type'):
            LOGGER.error('Unsupported media type sent')
            response.status = 415
            response_body = ErrorCJ(ROOT, 'Invalid Content-Type', 415,
                                    'application/json and application/vnd.collection+json supported')
            return response_body.to_json()

        request_json = json_loads(request._get_body_string())
        if not request_json:
            raise Exception

        # debug
        # print request_json

        # connect to mongodb
        mongoengine.connect('api')

        movie = Movie.objects.get(sysid=mid)

        # if we don't find a movie with this id
        if not movie:
            LOGGER.warn('movie.sysid' + mid + ' not found, unable to update')
            response.status = 204
            return

        # TODO Cleanup
        if "data" not in request_json["template"]:
            print 'error data not found'

        movie_dict = dict()
        for item in request_json["template"]["data"]:
            movie_dict[item["name"]] = item["value"]

        movie.updated_on = datetime.datetime.now
        movie.decode(movie_dict)
        movie.save()

        # testing
        movie_item = MovieItemCJ(ROOT, movie)
        movie_collection = MoviesCollectionTemplateCJ(ROOT)
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
@app.route(path='/api/movies/<mid:re:.+>', method='DELETE')
def callback_delete(mid):
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
