
const express = require('express')
const { MongoClient } = require('mongodb');
const admin = require("firebase-admin");
const app = express()
require("dotenv").config();
const cors = require('cors');
const port = process.env.PORT || 5000

//doctors-portal-firebase-adminsk.json
// const serviceAccount = require("./doctors-portal-firebase-adminsk.json");
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({
	credential: admin.credential.cert(serviceAccount)
});

// middlewire

app.use(cors())
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ch3vz.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function verifyToken(req, res, next) {
	if (req.headers?.authorization?.startsWith('Bearer ')) {
		const token = req.headers.authorization.split(' ')[1];
		try {
			const decodedUser = await admin.auth().verifyIdToken(token);
			req.decodedEmail = decodedUser.email;

		}
		catch {

		}
	}
	next();
}



// console.log(uri)

async function run() {
	try {
		await client.connect();
		const database = client.db('doctors_portal');
		const appointmentsCollection = database.collection('appointments');
		const usersCollection = database.collection('users');


		app.get('/appointments', verifyToken, async (req, res) => {
			const email = req.query.email;
			const date = new Date(req.query.date).toLocaleDateString();
			// console.log(date)
			const query = { email: email, date: date };
			const cursor = appointmentsCollection.find(query);
			const appointments = await cursor.toArray();
			res.json(appointments);
		})

		app.get('/users/:email', async (req, res) => {
			const email = req.params.email;
			const query = { email: email };
			const user = await usersCollection.findOne(query);
			let isAdmin = false;
			if (user?.role === 'admin') {
				isAdmin = true;
			}
			res.json({ admin: isAdmin })
		})

		app.post('/appointments', async (req, res) => {
			const appoiontment = req.body;
			const result = await appointmentsCollection.insertOne(appoiontment);
			console.log(appoiontment);
			res.json(result)
		});

		app.post('/users', async (req, res) => {
			const user = req.body;
			const result = await usersCollection.insertOne(user);
			console.log(result)
			console.log(result);
		})

		app.put('/users', async (req, res) => {
			const user = req.body;
			const filter = { email: user.email };
			const opitons = { upsert: true };
			const updateDoc = { $set: user };
			const result = await usersCollection.updateOne(filter, updateDoc, opitons);
			console.log(result);
			res.json(result);
		});

		app.put('/users/admin', verifyToken, async (req, res) => {
			const user = req.body;
			const requester = req.decodedEmail;
			if (requester) {
				const requesterAccout = await usersCollection.findOne({ email: requester });
				if (requesterAccout.role === 'admin') {
					const filter = { email: user.email };
					const updateDoc = { $set: { role: 'admin' } };
					const result = await usersCollection.updateOne(filter, updateDoc);
					res.json(result);
				}

			}
			else {
				res.status(403).json({message: 'you do not have acces to make admin'})
			}


		})

	}
	finally {
		// await client.close();
	}

}

run().catch(console.dir)






app.get('/', (req, res) => {
	res.send('Hello Doctors Portal!')
})

app.listen(port, () => {
	console.log(`Example app listening at http://localhost:${port}`)
})





// app.get('/users')
// app.post('/users')
// app.get('/users/:id')
// app.put('/users/:id')
// users: get
// users: post