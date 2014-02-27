/**
 * Module dependencies
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

/**
 * person schema
 */
var PersonSchema = new Schema({
    name: { type: String, default: '' },
    additionalName: { type: String, default: '' },
    birthDate: { type: String, default: '' },
    familyName: { type: String, default: '' },
    givenName: { type: String, default: '' },
    gender : { type: String, default: '' },
    deathDate: { type: String, default: '' }
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
