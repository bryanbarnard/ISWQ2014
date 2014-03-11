from DataCJ import DataCJ


class MovieItemCJ:
    """simple template to represent Collection+JSON items"""

    def __init__(self, root, movie):
        self.href = root + 'movies/' + str(movie.id)

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

        self.links = list()

        link = {
            'href': root + 'persons/1234567774454545',
            'prompt': 'director of the movies',
            'rel': 'director',
            'render': 'link'
        }
        self.links.append(link)

    def to_dict(self):
        return {
            'href': self.href,
            'data': self.data
            # 'links': self.links
        }
