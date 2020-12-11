const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zp3ic.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const ObjectId = require('mongodb').ObjectId;
const port = 5000;

app.use(bodyParser.json());
app.use(cors());
app.use(express.static('images'));
app.use(fileUpload());

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

client.connect((err) => {
  const carCollection = client
    .db(`${process.env.DB_NAME}`)
    .collection('carCollection');

  // Add New Car
  app.post('/addCar', (req, res) => {
    const file = req.files.file;
    const name = req.body.name;
    const model = req.body.model;
    const priceTotal = req.body.priceTotal;
    const priceFrom = req.body.priceFrom;
    const brandName = req.body.brandName;
    const newImg = file.data;
    const encImg = newImg.toString('base64');

    const image = {
      contentType: file.mimetype,
      size: file.size,
      img: Buffer.from(encImg, 'base64'),
    };

    carCollection
      .insertOne({ name, model, priceTotal, priceFrom, brandName, image })
      .then((result) => {
        res.send(result.insertedCount > 0);
      });
  });

  // get latest car details
  app.get('/latestCar', (req, res) => {
    carCollection
      .find({})
      .sort({ _id: -1 })
      .limit(1)
      .toArray((err, documents) => {
        res.send(documents[0]);
      });
  });
  // get all cars
  app.get('/cars', (req, res) => {
    const search = req.query.search;
    carCollection
      .find({ name: { $regex: search } })
      .toArray((err, documents) => {
        res.send(documents);
      });
  });

  // updating car Details
  app.patch('/update/:id', (req, res) => {
    carCollection
      .updateOne(
        { _id: ObjectId(req.params.id) },
        {
          $set: {
            name: req.body.name,
            model: req.body.model,
            priceTotal: req.body.priceTotal,
            priceFrom: req.body.priceFrom,
            brandName: req.body.brandName,
          },
        }
      )
      .then((result) => res.send(result.modifiedCount > 0));
  });

  // get Dynamic car Details
  app.get('/cars/:key', (req, res) => {
    carCollection
      .find({
        _id: ObjectId(req.params.key),
      })
      .toArray((err, docs) => {
        res.send(docs[0]);
      });
  });

  //Delete car
  app.delete('/deleteProduct/:id', (req, res) => {
    carCollection
      .deleteOne({
        _id: ObjectId(req.params.id),
      })
      .then((result) => {
        res.send(result.deletedCount > 0);
      });
  });
});

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(process.env.PORT || port);

// "start": "node index.js",
// "start:dev": "nodemon index.js",
