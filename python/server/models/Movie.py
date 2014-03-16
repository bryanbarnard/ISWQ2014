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
    created_on = DateTimeField(required=True)
    updated_on = DateTimeField(required=True)
    version_key = IntField(default=0)
    meta = {
        'collection': 'movies',
        'ordering': ['-created_on']
    }

    def decode(self, movie_dict):
        """
        :param self:
        :param movie_dict: dictionary representation of movie
        """

        movie_fields = [
            'name',
            'description',
            'director',
            'director_id',
            'contentRating',
            'timeRequired',
            'version',
            'genre',
            'about',
            'datePublished'
        ]

        # dict to object
        for field in movie_fields:
            if field in movie_dict:
                self[field] = movie_dict.get(field)