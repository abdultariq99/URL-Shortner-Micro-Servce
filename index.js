require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const dns = require('dns')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')

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
  orignal_url : String,
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

app.post('/',(req,res,next)=>{
  const urlMaker = (url) => {
    let index = url.indexOf("www")
    if(index >= 0){
      let modifiedUrl = url.substring(index + 4, url.length)
      return modifiedUrl
    } else{
      modifiedUrl = url
      return modifiedUrl
    }
  }
  let newUrl = urlMaker(req.body.url)
  dns.lookup(newUrl, 0, (err, address, family)=>{
    if(err){
      res.json({error: "Invalid Hostname"})
    }else{
      next()
    }
  })
})

app.post('/', (req,res,next)=>{
  let url = req.body.url
  let regex = /^https?:\/\/www\.[a-zA-Z0-9-]+(\.[a-zA-Z]{2,})(\/[a-zA-Z0-9\-\/]*)?$/
  let urlMatch =regex.test(url)
  if(urlMatch == false){
    res.json({error: "invalid url"})
  }else{
    next()
  }
})


app.post('/api/shorturl', (req,res)=>{
 const generateCode = () =>  {
 let code =  Math.floor(Math.random() * (9999-1 + 1) + 1)
 return code
}

 let createUrl = async ()=>{
  let existingUrl = await Url.findOne({orignal_url: req.body.url})
  if(existingUrl != null){
    res.json({orignal_url: existingUrl.orignal_url, short_url: existingUrl.short_url})
  } else{
    let newCode = generateCode()
    let createCode = await Url.findOne({short_url: newCode})
    while(createCode != null){
      newCode = generateCode()
    }
    await Url.create({orignal_url: req.body.url, short_url: newCode})
    res.json({orignal_url: req.body.url, short_url: newCode})
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
    res.redirect(checkCode.orignal_url)
  }
}
showUser()
})


