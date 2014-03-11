from mongoengine import *


class Movie(Document):
    name = StringField(required=True)
    description = StringField(required=True)
    sysid = StringField(required=True)
    director = StringField()
    director_id = StringField()
    contentRating = StringField(required=True)
    timeRequired = StringField(required=True)
    version = StringField(required=True)
    genre = StringField(required=True)
    about = StringField(required=True)
    datePublished = StringField(required=True)
    created_on = StringField()
    updated_on = StringField()
    meta = {'collection': 'movies'}
