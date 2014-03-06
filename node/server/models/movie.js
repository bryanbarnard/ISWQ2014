/**
 * Module dependencies
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

/**
 * movie schema
 */
var MovieSchema = new Schema({
    id: { type: String, default: '' },
    name: { type: String, default: '' },
    description: { type: String, default: '' },
    datePublished: { type: String, default: '' },
    about: { type: String, default: '' },
    genre: { type: String, default: '' },
    version: { type: String, default: '' },
    timeRequired: { type: String, default: '' },
    contentRating: { type: String, default: '' },
    director: { type: String, default: '' },
    director_id: { type: String, default: '' }
});

/**
 * Methods
 */
MovieSchema.method({

});

/**
 * Statics
 */
MovieSchema.static({

});


/**
 * Register
 */
mongoose.model('Movie', MovieSchema)
