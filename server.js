const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin');
require('dotenv').config();
console.log(process.env.DB_USER);

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.afmg3.mongodb.net/burjAlArab?retryWrites=true&w=majority`;

const app = express();

// middleware
app.use(cors());
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());


app.get('/', (req, res) => {
    res.send('<h1>Home Page</h1>')
});

// firebase admin
var serviceAccount = require("./config/burj-alarab-firebase-adminsdk-iuk7e-fab4b2f3d0.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIRE_DB
});

// DB Connect 
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    const collection = client.db("burjAlArab").collection("bookings");

    app.post('/addBooking', (req, res) => {
        const newBooking = req.body;
        collection.insertOne(newBooking)
            .then(result => {
                res.send(result.insertedCount > 0)
            });
        console.log(newBooking);
    });

    app.get('/bookings', (req, res) => {
        // filter email
        // console.log(req.query.email)

        // console.log(req.headers.authorization);
        const bearer = req.headers.authorization;
        if (bearer && bearer.startsWith('Bearer ')) {
            const idToken = bearer.split(' ')[1];
            console.log({ idToken });
            // idToken comes from the client app
            admin.auth().verifyIdToken(idToken)
                .then(function (decodedToken) {
                    const tokenEmail = decodedToken.email;
                    const qureEmail = req.query.email;
                    console.log(tokenEmail, qureEmail);
                    if (tokenEmail === qureEmail) {
                        collection.find({ email: qureEmail })
                            .toArray((err, document) => {
                                res.status(200).send(document);
                            });
                    } else {
                        res.status(401).send('Un-authorized access');
                    }
                    // ...
                }).catch(function (error) {
                    // Handle error
                    res.status(401).send('Un-authorized access');
                });
        }

        else {
            res.status(401).send('Un-authorized access');
        }


    });
    console.log('DB Connect');
    //   client.close();
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running port ${PORT}`);
})