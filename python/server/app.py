

from bottle import Bottle, run, route, abort, redirect, request, response

# application
app = Bottle()

# routes

# default
@app.route('/')
def default():
    abort(404, "not found")


# billboard route
@app.route('/api')
def billboard():
    # check accepts and content type
    # content_type = request.headers.get('Content-Type')
    accept = request.headers.get('Accept')

    if 'application/vnd.collection+json' in accept:
        response.set_header('Content-Type', 'application/vnd.collection+json')
    else:
        response.set_header('Content-Type', 'application/json')
    return "billboard"

# billboard route
@app.route('/api')
def billboard():
    # check accepts and content type
    # content_type = request.headers.get('Content-Type')
    accept = request.headers.get('Accept')

    if 'application/vnd.collection+json' in accept:
        response.set_header('Content-Type', 'application/vnd.collection+json')
    else:
        response.set_header('Content-Type', 'application/json')
    return "billboard"

# main
run(app, host='localhost', port=8080, debug=True)
