const dotenv = require('dotenv');
const path = require('path');

const root = path.join.bind(this, __dirname);
dotenv.config({ path: root('.env') });

module.exports = {
    PORT: process.env.PORT || 3000,
    //LOGIN_SBER: "marusik-api",
    //PASSWORD_SBER: "Summer2018!",
    //TOKEN_SBER: "ers1jrg6kuqu216cjn5m94ar1b",
    LOGIN_SBER: "marusik-11001-api",
    PASSWORD_SBER: "xZtA79hBB",
    TOKEN_SBER: "vqo693o0vkivb1719k2r81cq3",
    //MONGO_URL: 'mongodb://fedos:Asser220_@ds024778.mlab.com:24778/shopping',
    MONGO_URL: 'mongodb://fedos:asser220_@ds024778.mlab.com:24778/shopping'  
    IS_PRODUCTION: process.env.NODE_ENV === 'production',
    DESTINATION: 'uploads',
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    S3_BUCKET: process.env.S3_BUCKET
  };