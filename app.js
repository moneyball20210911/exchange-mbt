require('dotenv').config()
const PORT = process.env.DEV_PORT || 8080;
const express = require("express");
const cors = require("cors");
// const request = require('request')
const app = express();
// This is a sample test API key. Sign in to see examples pre-filled with your key.

// const txs = [];
// app.use(express.static("public"));

app.use(cors());

app.use(express.json());  

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true })); 

const db = require("./app/models");
db.mongoose.connect(db.url, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }).then(() => {
    console.log("Connected to the database!");
  }).catch(err => {
    console.log("Cannot connect to the database!", err);
    process.exit();
  });

  app.use(express.static(__dirname+"/build"));

  app.get('/*', function(req, res) {
    res.sendFile(__dirname + '/build/index.html', function(err) {
      if (err) {
        res.status(500).send(err)
      }
    })
  })


app.use(require('./app/controllers/api'));

// const scrapDepositHistory = async () => {
//   const result = await new Promise(resolve=>{
//     request('https://api.bscscan.com/api?module=account&action=txlist&address='+process.env.TARGETADDRESS+'&startblock=0&endblock=99999999&page=1&offset=10000&sort=asc&apikey=' + process.env.BSCSCAN_KEY, (err,res,body) => {
//       for(let v of res) {
//         txs.push(v);
//       }
//       resolve()  
//     })
//   })
//   setTimeout(()=>scrapDepositHistory, 5000)
// 


app.listen(PORT, () => {
  console.log(`Node server listening on port  ${PORT}`)
  // scrapDepositHistory();
});
