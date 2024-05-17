require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const dns = require('dns')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const isUrlHttp = require('is-url-http')

//Connect to Database

async function connectDatabase(){
  try{
   await mongoose.connect('mongodb+srv://abdultariq21:xxDgcQlsKqwHSfbe@cluster0.80jik5e.mongodb.net/URL_Database?retryWrites=true&w=majority&appName=Cluster0')
   console.log("Successfully connected to database")
  } catch{
    console.log("Error connecting to database")
  }
}

connectDatabase()

const urlSchema = new mongoose.Schema({
  original_url : String,
  short_url: Number
})

const Url = mongoose.model('Url', urlSchema)
Url.createCollection()
// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

const urlChecker = (req,res,next)=>{
  let checkHttp = isUrlHttp(req.body.url)
  if(checkHttp != true){
    res.json({error: 'invalid url'})
  } else{
    let url = new URL(req.body.url).hostname
    dns.lookup(url, 0, (err)=>{
      if(err){
       return res.json({error: "invalid hostname"})
      }else{
        next()
      }
    })
  }

}



app.post('/api/shorturl',urlChecker, (req,res)=>{
  let createUrl = async ()=>{
    let existingUrl = await Url.findOne({original_url: req.body.url})
    if(existingUrl != null){
      res.json({original_url: existingUrl.original_url, short_url: existingUrl.short_url})
    } else{
    let newCode = 1
    let highestCode = await Url.findOne().sort({short_url: -1}).limit(1)
    if(highestCode){
      newCode = highestCode.short_url + 1
    }
    await Url.create({original_url: req.body.url, short_url: newCode})
    res.json({original_url: req.body.url, short_url: newCode})
  }
}
 createUrl()
})


app.get('/api/shorturl/:shorturl', (req,res)=>{
let parsedParam = parseInt(req.params.shorturl)
let showUser = async () =>{
  let checkCode = await Url.findOne({short_url: parsedParam})
  if(checkCode == null){
    res.json({error: "No short URL found for the given input"})
  }else{
    res.redirect(checkCode.original_url)
  }
}
showUser()
})





