const express = require('express');
const exphbs = require('express-handlebars');
var hbs = require('hbs');

const path = require('path');
var paypal = require('paypal-rest-sdk');
var proxy = require('http-proxy-middleware')
var mongoose = require('mongoose');

var bodyParser = require('body-parser');
var os = require("os")

var localStorage;
if (typeof localStorage === "undefined" || localStorage === null) {
  var LocalStorage = require('node-localstorage').LocalStorage;
  localStorage = new LocalStorage('./scratch');
}

const app = express();

const index = require('./routes/index');

app.use(express.static(path.join(__dirname, 'public')));

var admin = localStorage.getItem("admin")

//Express handlebars Middleware

app.engine('handlebars', exphbs({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');
app.use(bodyParser());

app.locals.admin = function(){
  var admin = localStorage.getItem("admin")
  return admin == null ? false : true
}

app.engine('.hbs', exphbs({defaultLayout: 'layout', extname: '.hbs'}));

app.use('/', index)

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  var hostname = os.hostname();

  // sandbox credentials
  var mode = "sandbox";
  var client_id = "<sandbox client_id>";
  var client_secret = "<sandbox client secret>";

  //production credentials
  if(hostname == "production") {
    mode = "live"
    client_id = "<live client_id>";
    client_secret = "<live client_secret>";
  }

  paypal.configure({
    'mode': mode, //sandbox or live
    'client_id': client_id,
    'client_secret': client_secret,
  });
})
