/**
 * Module dependencies
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

/**
 * person schema
 */
var PersonSchema = new Schema({
    name: { type: String, default: '' }
});

/**
 * Methods
 */
PersonSchema.method({

});

/**
 * Statics
 */
PersonSchema.static({

});


/**
 * Register
 */
mongoose.model('Person', PersonSchema)
