/**
 * Module dependencies
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

/**
 * movie schema
 */
var MovieSchema = new Schema({
    //attributes
    sysid: { type: String, unique: true, default: '' },
    name: { type: String, required: true, default: '' },
    description: { type: String, required: true, default: '' },
    datePublished: { type: String, required: true, default: '' },
    about: { type: String, required: true, default: '' },
    genre: { type: String, required: true, default: '' },
    version: { type: String, required: true, default: '' },
    timeRequired: { type: String, required: true, default: '' },
    contentRating: { type: String, required: true, default: '' },
    director: { type: String, default: '' },
    director_id: { type: String, default: '' },
    created_on: { type: Date },
    updated_on: { type: Date }
    },
    //options
    { versionKey: 'version_key' },
    { collection: 'movies' }
);

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
