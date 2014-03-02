from bottle import Bottle, run, route, abort, redirect, request, response
import json

# application
app = Bottle()

# routes
# default
@app.route('/')
def default_route():
    abort(404, "not found")

# billboard route
@app.route('/api')
def billboard_route():
    # check accepts and content type
    # content_type = request.headers.get('Content-Type')
    accept = request.headers.get('Accept')

    if 'application/vnd.collection+json' in accept:
        response.set_header('Content-Type', 'application/vnd.collection+json')
    else:
        response.set_header('Content-Type', 'application/json')

    with open('billboard.json') as json_data:
        d = json.load(json_data)
        json_data.close()

    return d

# main
run(app, host='localhost', port=1337, debug=True)
