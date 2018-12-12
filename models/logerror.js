const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    errorText: {
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

module.exports = mongoose.model('LogError', schema);