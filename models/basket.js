const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    idProduct: {
        type: Object
    },
    sumProducts: {
        type: String
    },
    date: {
        type: String
    },
    nik: {
        type: String
    },
    telephone: {
        type: String
    },
    fio: {
        type: String
    },
    adress:{
        type: Object
    },
    typeDelivery:{
        type: String
    },
    comment: {
        type: String
    },
    numOrder: {
        type: String
    },
    sumDelivery: {
        type: String
    },
    summ: {
        type: String
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

module.exports = mongoose.model('Basket', schema);