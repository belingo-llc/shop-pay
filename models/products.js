const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    name: {
        type: String
    },
    price: {
        type: String
    },
    provider: {
        type: String
    },
    number: {
        type: Array
    },
    size: {
        type: Array
    },
    composition: {
        type: String
    },
    code: {
        type: String
    },
    season: {
        type: String
    },
    comment: {
        type: String
    },
    photo:{
        type: Array
    },
    status: {
        type: String
    }
  },
  {
        timestamps: true
  }
);

schema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('Products', schema);