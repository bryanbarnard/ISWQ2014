from DataCJ import DataCJ


class MovieItemCJ:
    """simple template to represent Collection+JSON items"""

    def __init__(self, root, movie):
        self.href = root + 'movies/' + str(movie.sysid)
        self.rel = 'item'
        self.rt = 'movie'

        self.data = list()
        self.data.append(DataCJ.create("name", movie.name, "title of movie"))
        self.data.append(DataCJ.create("description", movie.description, "description of movie"))
        self.data.append(DataCJ.create("datePublished", movie.datePublished, "date movie was published"))
        self.data.append(DataCJ.create("about", movie.about, "short description of this item"))
        self.data.append(DataCJ.create("genre", movie.genre, "movie genre"))
        self.data.append(DataCJ.create("version", movie.version, "version of this release"))
        self.data.append(
            DataCJ.create("timeRequired", movie.timeRequired, "time required to view this movie, aka duration"))
        self.data.append(DataCJ.create("contentRating", movie.contentRating, "rating of the movie"))
        self.data.append(DataCJ.create("created", str(movie.created_on), "record created"))
        self.data.append(DataCJ.create("updated", str(movie.updated_on), "record last updated"))

        self.links = list()

        link = {
            'href': "https://rawgithub.com/bryanbarnard/iswq2014/master/docs/movies.xml#movie",
            'rel': 'type',
        }
        self.links.append(link)


        if movie.director:
            link = {
                'href': root + 'persons/1234',
                'prompt': 'director of the movies',
                'name': movie.director,
                'rel': 'director',
                'render': 'link'
            }
            self.links.append(link)

    def to_dict(self):
        return {
            'href': self.href,
            'rel': self.rel,
            'rt': self.rt,
            'data': self.data,
            'links': self.links
        }
