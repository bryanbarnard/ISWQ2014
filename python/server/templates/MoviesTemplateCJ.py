class MoviesTemplateCJ(object):
    """simple movies template"""

    @staticmethod
    def create():
        return [
            {
                "required": "true",
                "prompt": "description of movie",
                "name": "description",
                "value": ""
            },
            {
                "required": "true",
                "prompt": "date movie was published",
                "name": "datePublished",
                "value": ""
            },
            {
                "required": "true",
                "prompt": "title of the movie",
                "name": "name",
                "value": ""
            },
            {
                "required": "true",
                "prompt": "short description of this item",
                "name": "about",
                "value": ""
            },
            {
                "required": "true",
                "prompt": "movie genre",
                "name": "genre",
                "value": ""
            },
            {
                "required": "true",
                "prompt": "version of this release",
                "name": "version",
                "value": ""
            },
            {
                "required": "true",
                "prompt": "time required to view this movie also known as duration",
                "name": "timeRequired",
                "value": ""
            },
            {
                "required": "true",
                "prompt": "rating of the movie (1-5)",
                "name": "contentRating",
                "value": ""
            }
        ]
