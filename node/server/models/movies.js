/**
 * Module dependencies
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

/**
 * movie schema
 */
var MovieSchema = new Schema({
    name: { type: String, default: '' }
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
