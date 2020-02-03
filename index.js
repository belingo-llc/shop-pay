const bodyParser = require('body-parser');
const path = require('path')
const models = require('./models');
const axios = require('axios')
const mongoose = require('mongoose');
var CronJob = require('cron').CronJob;

const config = require('./config');
const diskStorage = require('./utils/diskStorage');

const {google} = require('googleapis');
const fs = require('fs');
const readline = require('readline');

const Sharp = require('sharp');
const multer = require('multer');
const mkdirp = require('mkdirp');

const aws = require('aws-sdk');

const express = require('express');

// database
mongoose.Promise = global.Promise;
mongoose.set('debug', config.IS_PRODUCTION);
mongoose.connection
  .on('error', error => console.log(error))
  .on('close', () => console.log('Database connection closed.'))
  .once('open', () => {
    const info = mongoose.connections[0];
    console.log(`Connected to ${info.host}:${info.port}/${info.name}`);
  });
mongoose.connect(config.MONGO_URL); 

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(
    '/javascripts',
    express.static(path.join(__dirname, 'node_modules', 'jquery', 'dist'))
);
app.use(
  '/javascripts',
  express.static(path.join(__dirname, 'node_modules', 'inputmask', 'dist'))
);
app.use('/uploads', express.static(path.join(__dirname, config.DESTINATION)));

app.get('/', (req, res) => {

  res.sendFile(__dirname + '/page.html');

});

const S3_BUCKET = config.S3_BUCKET;

app.get('/deliveryinfo', (req, res) => res.sendFile(__dirname + '/delivery_info.html'));
app.get('/sucpayment', (req, res) => res.sendFile(__dirname + '/payment.html'));
app.get('/about/oferta', (req, res) => res.sendFile(__dirname + '/oferta.html'));
app.get('/contacts', (req, res) => res.sendFile(__dirname + '/contacts.html'));
app.get('/info', (req, res) => res.sendFile(__dirname + '/delivery_and_pay_info.html'));
app.get('/shopping', (req, res) => res.sendFile(__dirname + '/shopping.html'));
app.get('/admin', (req, res) => res.sendFile(__dirname + '/admin.html'));


var insertProduct = () => {
  const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
    const TOKEN_PATH = 'token.json';
    fs.readFile('credentials.json', (err, content) => {
      if (err) return console.log('Error loading client secret file:', err);

      authorize(JSON.parse(content), listMajors);
    });
    function authorize(credentials, callback) {
      const {client_secret, client_id, redirect_uris} = credentials.installed;
      const oAuth2Client = new google.auth.OAuth2(
          client_id, client_secret, redirect_uris[0]);
      fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getNewToken(oAuth2Client, callback);
        oAuth2Client.setCredentials(JSON.parse(token));
        callback(oAuth2Client);
      });
    }
    function getNewToken(oAuth2Client, callback) {
      const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
      });
      console.log('Authorize this app by visiting this url:', authUrl);
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
          if (err) return console.error('Error while trying to retrieve access token', err);
          oAuth2Client.setCredentials(token);
          // Store the token to disk for later program executions
          fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
            if (err) console.error(err);
            console.log('Token stored to', TOKEN_PATH);
          });
          callback(oAuth2Client);
        });
      });
    }
    async function listMajors(auth) {

      try{
        var datadb = await models.Products.find();
      } catch(e) {
        var datadb = [];
      }

      var arrDBName = [];
      var arrDBId = [];

      for (var i=0; i < datadb.length; i++){
        arrDBName.push(datadb[i].name);
        arrDBId.push(datadb[i]._id);
      }

      const sheets = google.sheets({version: 'v4', auth});
      var param = {
        spreadsheetId: '1Wx9YsMXflihNX-E_BeoCV0QOQtSo1qz7pM_LqtAoSYY',
        range: 'Data' + '!A3:I'
      }

      var data = await sheets.spreadsheets.values.get(param);
      var prod = data.data.values;

      var arrData = [];

      for (var i = 0; i < prod.length; i++){
        try{
          var numberArr = prod[i][3].split(',');
        } catch(e){
          var numberArr = [];
        }
        try{
          var sizeArr = prod[i][4].split(',');
        } catch(e){
          var sizeArr = [];
        }
        
        if (arrDBName.indexOf(prod[i][0]) == -1) {
          arrData.push({
            name: prod[i][0],
            price: prod[i][1],
            provider: prod[i][2],
            number: numberArr,
            size: sizeArr,
            composition: prod[i][5],
            code: prod[i][6],
            season: prod[i][7] || "",
            comment: prod[i][8],
            photo: [],
            status: "Нет фото"
          });
        } else {
          try {
            await models.Products.findByIdAndUpdate(arrDBId[arrDBName.indexOf(prod[i][0])], {
            price: prod[i][1],
            provider: prod[i][2],
            composition: prod[i][5],
            code: prod[i][6],
            season: prod[i][7] || "",
            comment: prod[i][8],
            });
          } catch(e) {
            console.log('Error');
          }
        }
      }

      models.Products.insertMany(arrData)
      .then(pr => {
        console.log("Продукты - успешно!");
      })
      .catch(err => {
        console.log('Продукты - ОШИБКА!!!');
      })

    }
}

app.post('/boxberryquery', async (req, res) => {
  const index = req.body.index;

  const code = await axios.post('http://api.boxberry.de/json.php?token=82247.rjpqadca&method=PointsByPostCode&zip='+ index);
  if (code.data.Code){
    try{
      const info = await axios.post(`http://api.boxberry.de/json.php?token=82247.rjpqadca&method=PointsDescription&code=${code.data.Code}&photo=0`);
      res.json({ok: true, data: info.data});
    } catch (e) {
      res.json({ok: false, text: 'По введенному Индексу точек доставки Box Berry не найдено!'});
    }
  } else {
    res.json({ok: false, text: 'По введенному Индексу точек доставки Box Berry не найдено!'});
  }


});
app.post('/preload', (req, res) => {

  models.SheetData.distinct('nik')
  .then(sh => {
    res.json({ok: true, data: sh});
  })
  .catch(err => {
    res.json({ok: false, err});
  });

});
app.post('/readdata', (req, res) => {

  const nik = req.body.nik;

  models.SheetData.find({nik, status: 'Не оплачено'})
  .then(sh => {

    var obj = {}

    for (var i=0; i < sh.length; i++){
      obj[sh[i].purchase] = {
        name: [],
        art: [],
        col: [],
        price: [],
        delivery: []
      }
    }

    sh.map(s => {
      obj[s.purchase].name.push(s.nameProduct);
      obj[s.purchase].art.push(s.venCode);
      obj[s.purchase].col.push(s.numberProduct);
      obj[s.purchase].price.push(s.amount);
      obj[s.purchase].delivery.push(s.sumDelivery);
    })

    res.json({ok: true, data: obj});
  })
  .catch(err => {
    res.json({ok: false, err});
  });

});
app.post('/saveshopandsberpay', async (req, res) => {
  const purchase = req.body.purchase;
  const nik = req.body.nik;
  const telephone = req.body.telephone;
  const fio = req.body.fio;
  const city = req.body.city;
  const index = req.body.index;
  const street = req.body.street;
  const home = req.body.home;
  const room = req.body.room;
  const delivery = req.body.delivery;
  const deliveryAddress = req.body.deliveryAddress;
  const comment = req.body.comment;
  const numOrder = parseInt(+new Date()/1000);
  const sumOrder = req.body.sumOrder;
  const sumDelivery = req.body.sumDelivery;
  const summ = req.body.summ;
  const status = 'Регистрация оплаты';
  const idProduct = req.body.sheet_products;

  var shop_one = await models.Shop.findOne({sumOrder, nik, purchase});
  if (!shop_one) {
    models.Shop.create({
      purchase,
      nik,
      telephone,
      fio,
      city,
      index,
      street,
      home,
      room,
      delivery,
      deliveryAddress,
      comment,
      numOrder,
      sumOrder,
      sumDelivery,
      summ,
      status,
      idProduct
    })
    .then(async sh => {
      const token = config.TOKEN_SBER;
      try{
        var amount = +summ*100;
        const sber = await axios.get(`https://securepayments.sberbank.ru/payment/rest/register.do?token=${token}&amount=${amount}&orderNumber=${numOrder}&returnUrl=http://marusik.shop/sucpayment/`);
        res.json({ok: true, data: sber.data, numOrder: numOrder}); 
      } catch (e){
        res.json({ok: false, text: "Ошибка, попробуйте позже!", numOrder: numOrder});
      }
    })
    .catch(err => {
      res.json({ok: false, text: 'Сервис временно недоступен, попробуйте позже...'});
    });
  } else {
    if (shop_one.status == 'Регистрация оплаты'){
      shop_one.numOrder = numOrder;
      shop_one.save()
      .then(async s => {
        const token = config.TOKEN_SBER;
        try{
          var amount = +summ*100;
          const sber = await axios.get(`https://securepayments.sberbank.ru/payment/rest/register.do?token=${token}&amount=${amount}&orderNumber=${numOrder}&returnUrl=http://marusik.shop/sucpayment/`);
          res.json({ok: true,data: sber.data, numOrder: numOrder});
        } catch (e){
          res.json({ok: false, text: "Ошибка, попробуйте позже!", numOrder: numOrder});
        }
      })
      .catch(ers => {
        res.json({ok: false, text: 'Сервис временно недоступен, попробуйте позже!'});
      })
    } else {
      res.json({ok: false, text: 'Выбранная закупка уже оплачена! Данные скоро обновятся...'});
    }
  }

});
app.post('/writedata', (req, res) => {
  const numberOrder = req.body.numberOrder;
  const status = req.body.type_page;

  if (status == "Pay-Instagramm") {
    models.Shop.findOneAndUpdate({numOrder: numberOrder}, {status: 'Оплачено - не записано'})
    .then(suc => {
      var data = suc.idProduct;
      Object.keys(data).map(async d => {
        var col = await models.Products.findById(id);
        var size = col.size;
        var col_pr = col.number;
        for (var x=0; x < size.length; x++){
          if (data.size == size[x]){
            col_pr[x] -= data.col;
          }
        }
        
        try{
          await models.Products.findByIdAndUpdate(d, {number: col_pr})
          res.json({ok: true});
        } catch(e) {
          res.json({ok: false});
        }

        })
    })
    .catch(err => {
      res.json({ok: false, text: 'Сервис временно не доступен, попробуйте позже!'});
    });
  } else {
    models.Basket.findOneAndUpdate({numOrder: numberOrder}, {status: 'Оплачено - не записано'})
    .then(suc => {
      res.json({ok: true});
    })
    .catch(err => {
      res.json({ok: false, text: 'Сервис временно не доступен, попробуйте позже!'});
    })
  }
});
app.post('/sberstatus', async (req, res) => {

  var order = req.body.orderId;
  const token = config.TOKEN_SBER;

  try{
    const sber = await axios.get(`https://securepayments.sberbank.ru/payment/rest/getOrderStatusExtended.do?token=${token}&orderId=${order}`);
    res.json({ok: true, data: sber.data});
  } catch (e){
    res.json({ok: false, text: "Ошибка, попробуйте позже!"});
  }


});
app.post('/adminproducts', (req, res) => {
  models.Products.find({}, {provider: 1, name: 1, number: 1, status: 1, price: 1})
  .then(pr => {
    res.json({ok: true, pr});
  })
  .catch(err => {
    res.json({ok: true, text: 'Error'});
  })
});
app.post('/productinfo', (req, res) => {
  const id = req.body.id;
  models.Products.findById(id)
  .then(pr => {
    res.json({ok: true, pr});
  })
  .catch(err => {
    res.json({ok: false, err});
  })
});
app.post('/allproducts', (req, res) => {
  models.Products.find({status: "Активно"})
  .then(pr => {
    res.json({ok: true, pr});
  })
  .catch(err => {
    res.json({ok: false, text: 'Сервер временно недоступен!'});
  })
})
app.post('/inbasket', (req, res) => {
  var data = req.body;

  var summ = 0;

  Object.keys(data).map(k => {
    summ += Number(data[k].price)*Number(data[k].col);
  });

  models.Basket.create({
    idProduct: data,
    sumProducts: summ,
    date: new Date(),
    nik: "",
    telephone: "",
    fio: "",
    adress: {},
    typeDelivery: "",
    comment: "",
    numOrder: "",
    sumDelivery: "",
    summ: "",
    status: "Бронь"
  })
  .then(oks => {
    res.json({ok: true, oks});
  })
  .catch(e => {
    console.log(e);
    res.json({ok: false, text: "Сервер временно недоступен! Попробуйте позже"});
  });

})
app.post('/saveproductsandsberpay', async (req, res) => {
  const id = req.body.ids;
  const nik = req.body.nik;
  const telephone = req.body.telephone;
  const fio = req.body.fio;
  const city = req.body.city;
  const index = req.body.index;
  const street = req.body.street;
  const home = req.body.home;
  const room = req.body.room;
  const delivery = req.body.delivery;
  const deliveryAddress = req.body.deliveryAddress;
  const comment = req.body.comment;
  const numOrder = parseInt(+new Date()/1000);
  const sumOrder = req.body.sumOrder;
  var sumDelivery = req.body.sumDelivery;
  const summ = req.body.summ;
  const status = 'Регистрация оплаты';

  var products = await models.Basket.findById(id);

  products.nik = nik;
  products.telephone = telephone;
  products.fio = fio;
  products.typeDelivery = delivery;
  products.comment = comment;
  products.numOrder = numOrder;
  products.sumDelivery = sumDelivery;
  products.summ = summ;
  products.status = status;
  products.adress = {
    index,
    city,
    street,
    home,
    room,
    adress: deliveryAddress
  };
  products.save()
  .then(async sh => {
    const token = config.TOKEN_SBER;
    try{
      var amount = +summ*100;
      const sber = await axios.get(`https://securepayments.sberbank.ru/payment/rest/register.do?token=${token}&amount=${amount}&orderNumber=${numOrder}&returnUrl=http://marusik.shop/sucpayment/`);
      res.json({ok: true, data: sber.data, numOrder: numOrder});
    } catch (e){
      res.json({ok: false, text: "Ошибка, попробуйте позже!", numOrder: numOrder});
    }
  })
  .catch(err => {
    res.json({ok: false, text: 'Сервис временно недоступен, попробуйте позже...'});
  });

});
app.post('/findproductfromprovider', (req, res) => {
  var provider = req.body.provider;

  if (provider != "Все поставщики"){
    var search = {
      status: "Активно", 
      provider: provider
    }
  } else {
    var search = {
      status: "Активно"
    }
  }

  models.Products.find(search)
  .then(pr => {
    res.json({ok: true, pr});
  })
  .catch(err => {
    res.json({ok: false, text: 'Сервер временно недоступен!'});
  })

})

const rs = () =>
  Math.random()
    .toString(36)
    .slice(-3);

const storage = diskStorage({
  destination: (req, file, cb) => {
    const dir = '/' + rs() + '/' + rs();
    req.dir = dir;

    mkdirp(config.DESTINATION + dir, err => cb(err, config.DESTINATION + dir));
    // cd(null, config.DESTINATION + dir);
  },
  filename: async (req, file, cb) => {
    const fileName = Date.now().toString(36) + path.extname(file.originalname);
    req.dir = req.dir + '/' + fileName;

    cb(null, fileName);
  },
  sharp: (req, file, cb) => {
    const resizer = Sharp()
      .resize(800, 800)
      .max()
      .withoutEnlargement()
      .toFormat('jpg')
      .jpeg({
        quality: 80,
        progressive: true
      });
    cb(null, resizer);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.jpg' && ext !== '.jpeg' && ext !== '.png' ) {
      const err = new Error('Extention');
      err.code = 'EXTENTION';
      return cb(err);
    }
    cb(null, true);
  }
}).single('file');
// SAVE IMAGE
app.post('/saveimage', (req, res) => {

  console.log(req.headers['content-type']);

  res.json({ok: true, data: req.headers});

  /*
  upload(req, res, err => {
    let error = '';
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        error = 'Картинка не более 2mb!';
      }
      if (err.code === 'EXTENTION') {
        error = 'Только jpeg и png!';
      }
    }

    res.json({
      ok: !error,
      error,
      path: req.dir
    });
  });
  */
});
app.get('/sign-s3', (req, res) => {

  var s3 = new aws.S3({ 
    accessKeyId: config.AWS_ACCESS_KEY_ID, 
    secretAccessKey: config.AWS_SECRET_ACCESS_KEY, 
    Bucket: config.S3_BUCKET, 
    signatureVersion: 'v4',
    region: 'eu-west-2'
  });

  const fileName = req.query['file-name'];
  const fileType = req.query['file-type'];
  const s3Params = {
    Bucket: S3_BUCKET,
    Key: fileName,
    ContentType: fileType,
    ACL: 'public-read'
  };

  s3.getSignedUrl('putObject', s3Params, (err, data) => {
    if(err){
      console.log(err);
      return res.end();
    }
    const returnData = {
      signedRequest: data,
      url: `https://${S3_BUCKET}.s3.amazonaws.com/${fileName}`
    };
    res.write(JSON.stringify(returnData));
    res.end();
  });

});
app.post('/savepathphoto', (req, res) => {
  const id = req.body.id;
  const path = req.body.path;

  models.Products.findByIdAndUpdate(id, {$push: { photo: path },status: "Активно" })
  .then(pr => {
    res.json({ok: true, text: 'Успешно!'});
  })
  .catch(err => {
    res.json({ok: false, text: 'Не удалось обновить данные в БД'});
  });

});

app.post('/saveedit', (req, res) => {
  const id = req.body.id;
  const provider = req.body.provider;
  const name = req.body.name;
  const code = req.body.code;
  const price = req.body.price;
  const size = req.body.size;
  const col = req.body.col;

  models.Products.findByIdAndUpdate(id, {
    name: name,
    provider: provider,
    number: col,
    size: size,
    price: price,
    code: code
  })
  .then(ok => {
    res.json({ok: true});
  })
  .catch(err => {
    res.json({ok: false});
  })

})
app.post('/removefoto', (req, res) => {
  const id = req.body.id;
  var img = req.body.img;

  var s3 = new aws.S3({ 
    accessKeyId: config.AWS_ACCESS_KEY_ID, 
    secretAccessKey: config.AWS_SECRET_ACCESS_KEY, 
    Bucket: config.S3_BUCKET, 
    signatureVersion: 'v4',
    region: 'eu-west-2'
  });

  var arrImg = img.split('/');
  var image = arrImg[arrImg.length-1];

  const s3Params = {
    Bucket: S3_BUCKET,
    Delete: {
      Objects: [
        {
          Key: image
        }
      ]
    }
  };

  models.Products.findByIdAndUpdate(id, {
    '$pull': { 'photo': img }
  })
  .then(ok => {
    s3.deleteObjects(s3Params, function(err, data) {
      if (err) res.json({ok: false});;
      res.json({ok: true});
    });
  })
  .catch(err => {
    console.log(err);
    res.json({ok: false});
  });

});
app.post('/editstatus', (req, res) => {
  const id = req.body.id;

  models.Products.findByIdAndUpdate(id, {
    status: "Нет фото"
  })
  .then(ok => {
    res.json({ok: true});
  })
  .catch(err => {
    res.json({ok: false});
  });

})

app.post('/deleteproducts', async (req, res) => {
  var provider = req.body.provider;

  try{
    var products = await models.Products.find({provider: provider})
  } catch (e) {
    res.json({ok: false});
  }

  for (var i=0; i < products.length; i++){
    var id = products[i]._id;
    await models.Products.findByIdAndDelete(id);
  }
  
  res.json({ok: true});


});
app.post('/insertproducts', async (req, res) => {
  try{
    await insertProduct();
  } catch(e) {
    res.json({ok: false});
  }

  res.json({ok: true});

})

var sucPayment = async () => {
  var start = new Date();
  var login = config.LOGIN_SBER;
  var pasw = config.PASSWORD_SBER;
  var data = await models.Shop.find({status: 'Регистрация оплаты'});
  var basket = await models.Basket.find({ status: 'Регистрация оплаты'});
  var count = 0;
  for (var i = 0; i < data.length; i++){
    var order = data[i].numOrder;
    var id = data[i]._id;
    var sberStatus = await axios.get(`https://securepayments.sberbank.ru/payment/rest/getOrderStatusExtended.do?userName=${login}&password=${pasw}&orderNumber=${order}`);
    if (sberStatus.data.orderStatus == 2){
      await models.Shop.findByIdAndUpdate(id, {status: 'Оплачено - не записано'});
    } else if (sberStatus.data.orderStatus == 6) {
      await models.Shop.findByIdAndRemove(id);
    }
  }

  for (var i = 0; i < basket.length; i++){
    var order = basket[i].numOrder;
    var id = basket[i]._id;
    var sberStatus = await axios.get(`https://securepayments.sberbank.ru/payment/rest/getOrderStatusExtended.do?userName=${login}&password=${pasw}&orderNumber=${order}`);
    if (sberStatus.data.orderStatus == 2){
      await models.Basket.findByIdAndUpdate(id, {status: 'Оплачено - не записано'});
    } else if (sberStatus.data.orderStatus == 6) {
      await models.Basket.findByIdAndRemove(id);
    }
  }

}


new CronJob('*/1 * * * *', () => {
  var now = new Date();
  if (now.getMinutes() % 2 == 0){
    // If modifying these scopes, delete token.json.
    const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
    const TOKEN_PATH = 'token.json';

    // Load client secrets from a local file.
    fs.readFile('credentials.json', (err, content) => {
      if (err) return console.log('Error loading client secret file:', err);
      // Authorize a client with credentials, then call the Google Sheets API.
      authorize(JSON.parse(content), listMajors);
    });
    function authorize(credentials, callback) {
      const {client_secret, client_id, redirect_uris} = credentials.installed;
      const oAuth2Client = new google.auth.OAuth2(
          client_id, client_secret, redirect_uris[0]);

      // Check if we have previously stored a token.
      fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getNewToken(oAuth2Client, callback);
        oAuth2Client.setCredentials(JSON.parse(token));
        callback(oAuth2Client);
      });
    }
    function getNewToken(oAuth2Client, callback) {
      const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
      });
      console.log('Authorize this app by visiting this url:', authUrl);
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
          if (err) return console.error('Error while trying to retrieve access token', err);
          oAuth2Client.setCredentials(token);
          // Store the token to disk for later program executions
          fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
            if (err) console.error(err);
            console.log('Token stored to', TOKEN_PATH);
          });
          callback(oAuth2Client);
        });
      });
    }
    function listMajors(auth) {
      const sheets = google.sheets({version: 'v4', auth});
      sheets.spreadsheets.get({spreadsheetId:'1HGsuKdWEIcYjqWib2a5ApI-txNtybNl8Z0oR6ZPR59U'})
      .then(async r => {
        var sheetName = r.data.sheets.map((sheet) => {
          return sheet.properties.title;
        });

        var arrData = [];

        for (var x = 0; x < sheetName.length; x++){
          if (sheetName[x] != "ОПЛАТА" && sheetName[x] != 'Оплата тест'){
            var param = {
              spreadsheetId: '1HGsuKdWEIcYjqWib2a5ApI-txNtybNl8Z0oR6ZPR59U',
              range: sheetName[x]+'!A2:H'
            }

            var dataSheet = await sheets.spreadsheets.values.get(param);

            if (dataSheet.data.values){
              for (var i=0; i < dataSheet.data.values.length; i++){
                arrData.push({
                  purchase: sheetName[x],
                  nik: dataSheet.data.values[i][0],
                  venCode: dataSheet.data.values[i][1],
                  nameProduct: dataSheet.data.values[i][2],
                  numberProduct: dataSheet.data.values[i][3],
                  amount: dataSheet.data.values[i][5],
                  status: dataSheet.data.values[i][6],
                  sumDelivery: dataSheet.data.values[i][7]
                });
              }
            }
          }
        }

        models.SheetData.remove()
        .catch(err => {
          console.log('Не удалось удалить SheetData');
        });

        models.SheetData.insertMany(arrData)
        .then(shd => {
          console.log('Запись массива прошла успешно! - ' + new Date());
        })
        .catch(err => {
          console.log('Ошибка записи в Таблицу SheetData - ' + err);
        })

      }).catch(err => {
        models.LogError.create({
          errorText: err
        })
        .then(log => {
          console.log('Ошибка записалась в Лог');
        })
        .catch(err => {
          console.log('Ошибка записи в Таблицу LogError - ' + err);
        })
      });
    }
  } else {

    sucPayment();

    // If modifying these scopes, delete token.json.
    const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
    const TOKEN_PATH = 'token.json';
    // Load client secrets from a local file.
    fs.readFile('credentials.json', (err, content) => {
      if (err) return console.log('Error loading client secret file:', err);
      // Authorize a client with credentials, then call the Google Sheets API.
      authorize(JSON.parse(content), listMajors);
    });
    function authorize(credentials, callback) {
      const {client_secret, client_id, redirect_uris} = credentials.installed;
      const oAuth2Client = new google.auth.OAuth2(
          client_id, client_secret, redirect_uris[0]);

      // Check if we have previously stored a token.
      fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getNewToken(oAuth2Client, callback);
        oAuth2Client.setCredentials(JSON.parse(token));
        callback(oAuth2Client);
      });
    }
    function getNewToken(oAuth2Client, callback) {
      const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
      });
      console.log('Authorize this app by visiting this url:', authUrl);
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
          if (err) return console.error('Error while trying to retrieve access token', err);
          oAuth2Client.setCredentials(token);
          // Store the token to disk for later program executions
          fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
            if (err) console.error(err);
            console.log('Token stored to', TOKEN_PATH);
          });
          callback(oAuth2Client);
        });
      });
    }
    async function listMajors(auth) {
      const sheets = google.sheets({version: 'v4', auth});

      var shop = await models.Shop.find({status: 'Оплачено - не записано'});

      var basket = await models.Basket.find({status: 'Оплачено - не записано'});

      if (basket.length > 0) {
        var values = [];
        var ids_b = [];

        for (var u=0; u < basket.length; u++){
          ids_b.push(basket[u]._id);
          var key = Object.keys(basket[u].idProduct);
          for (var m = 0; m < key.length; m++){
            values.push([
              basket[u].nik,
              basket[u].idProduct[key[m]].provider,
              basket[u].idProduct[key[m]].name,
              basket[u].idProduct[key[m]].code,
              basket[u].idProduct[key[m]].size,
              basket[u].idProduct[key[m]].col,
              basket[u].telephone,
              basket[u].fio,
              basket[u].adress.city,
              basket[u].adress.index,
              basket[u].adress.street,
              basket[u].adress.home,
              basket[u].adress.room,
              basket[u].typeDelivery,
              basket[u].adress.adress,
              basket[u].comment,
              basket[u].numOrder,
              basket[u].sumProducts,
              basket[u].sumDelivery,
              basket[u].summ
            ]);
          }

          const resource = {
            values,
          };
          sheets.spreadsheets.values.append({
            spreadsheetId: '1Wx9YsMXflihNX-E_BeoCV0QOQtSo1qz7pM_LqtAoSYY',
            range: `ЗАКАЗЫ!A:T`,
            valueInputOption: 'RAW',
            resource
          })
          .then(qw => {
            for (var x = 0; x < ids_b.length; x++){
              console.log('Ид - ' + ids_b[x]);
              var id = ids_b[x];
              models.Basket.findByIdAndUpdate(id, {status: 'Оплачено - записано'}, (err) => {
                if (err) console.log('ОШИБКА ОБНОВЛЕНИЯ!!! - Магазин');
              });
            }
          })
          .catch(errqw => {
            console.log(errqw);
            models.LogError.create({
              errorText: errqw
            })
            .then(t => {
              console.log('Ошибка записи данный в логе - Магазин');
            })
            .catch(e => {
              console.log('Лог недоступен! - Магазин');
            })
          })
        }
      } else {
        console.log('Нет данных для записи! - Магазин');
      }

      if (shop.length > 0) {

        var values = [];
        var ids = [];
        for (var u = 0; u < shop.length; u++){
          ids.push(shop[u]._id);
          values.push([
            shop[u].purchase,
            shop[u].nik,
            shop[u].telephone,
            shop[u].fio,
            shop[u].city,
            shop[u].index,
            shop[u].street,
            shop[u].home,
            shop[u].room,
            shop[u].delivery,
            shop[u].deliveryAddress,
            shop[u].comment,
            shop[u].numOrder,
            shop[u].sumOrder,
            shop[u].sumDelivery,
            shop[u].summ
          ]);
        }
        const resource = {
          values,
        };
        sheets.spreadsheets.values.append({
          spreadsheetId: '1HGsuKdWEIcYjqWib2a5ApI-txNtybNl8Z0oR6ZPR59U',
          range: `ОПЛАТА!A:P`,
          valueInputOption: 'RAW',
          resource
        })
        .then(qw => {
          for (var x = 0; x < ids.length; x++){
            console.log('Ид - ' + ids[x]);

            console.log(values[x].idProduct);

            // moysklad auth
            const headers = {
              'Content-Type': 'application/json',
              'Authorization': 'Admin@9645054848:marmar3587133mar'
            }

            //search counterparty
            var searchCounterParty = axios.get(
              'https://online.moysklad.ru/api/remap/1.1/entity/counterparty?search='+values[x].telephone,
              {
                headers: headers
              });

            // if counterparty not exists
            if(!searchCounterParty.rows[0]) {
              var createCounterPartyUrl = 'https://online.moysklad.ru/api/remap/1.1/entity/counterparty';
              var data = {
                "name": values[x].fio,
                "phone": values[x].telephone,
                "attributes": [
                  {
                    "id": "9d6ea88b-02aa-11e9-9ff4-3150002312fb",
                    "name": "Ник в Instagram",
                    "type": "string",
                    "value": values[x].nik
                  }
                ]
              }
              var counterparty = axios.post(createCounterPartyUrl, data, {
                headers: headers
              }).meta.href;
            }else{
              var counterparty = searchCounterParty.rows[0].meta.href;
            }

            //search product

            // create order in moysklad
            var createOrderUrl = 'https://online.moysklad.ru/api/remap/1.1/entity/customerorder';
            var data = {
              "name": values[x].numOrder,
              "organization": {
                "meta": {
                  "href": "https://online.moysklad.ru/api/remap/1.1/entity/organization/dd6d4915-caef-11e8-9109-f8fc0033f14f",
                  "type": "organization",
                  "mediaType": "application/json"
                }
              },
              "agent": {
                "meta": {
                  "href": counterparty,
                  "type": "counterparty",
                  "mediaType": "application/json"
                }
              },
              "state": {
                "meta": {
                  "href": "https://online.moysklad.ru/api/remap/1.1/entity/customerorder/metadata/states/dd8bc4ce-caef-11e8-9109-f8fc0033f16b",
                  "type": "state",
                  "mediaType": "application/json"
                }
              }
            }
            
            axios.post(createOrderUrl, data, {
              headers: headers
            });

            var id = ids[x];
            models.Shop.findByIdAndUpdate(id, {status: 'Оплачено - записано'}, (err) => {
              if (err) console.log('ОШИБКА ОБНОВЛЕНИЯ!!!');
            });
          }
        })
        .catch(errqw => {
          models.LogError.create({
            errorText: errqw
          })
          .then(t => {
            console.log('Ошибка записи данный в логе');
          })
          .catch(e => {
            console.log('Лог недоступен!');
          })
        })
      } else {
        console.log('Нет данных для записи!');
      }

    }
  }
}, null, true);
app.get('*', function(req, res){
  res.redirect('/');
});

app.listen(config.PORT, '0.0.0.0' , () =>
  console.log(`Example app listening on port ${config.PORT}!`)
);
