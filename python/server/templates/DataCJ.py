class DataCJ(object):
    """simple class representing data element in Items array"""


    @staticmethod
    def create(name, value, prompt):
        return {
            "name": name,
            "value": value,
            "prompt": prompt,
        }