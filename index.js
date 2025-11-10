const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 2173;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ng2yszq.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server id running fine");
});

async function run() {
  try {
    await client.connect();
    const db = client.db("freelance_db");
    const userCollection = db.collection("users");
    const jobsCollection = db.collection("jobs");
    const myJobsCollection = db.collection("myJobs");
    const myTasksCollection = db.collection("myTasks");

    //  Get all jobs
    app.get("/jobs", async (req, res) => {
      const cursor = jobsCollection.find();
      const result = await cursor.toArray(cursor);
      res.send(result);
    });
    // My added jobs
    app.get("/myAddedJobs", (req, res) => {
      const email = req.query.email;
      const query = {};
      if (email) {
        query.userEmail = email;
      }
      const cursor = jobsCollection.find(query);
      const result = cursor.toArray();
      res.send(result);
    });

    // my-accepted-tasks
    app.get("/my-accepted-tasks", (req, res) => {
      const email = req.query.email;
      const status = req.query.status;
      const query = {};
      if (email) {
        query.userEmail = email;
      }
      if (status) {
        query.status = "done";
      }
      const cursor = jobsCollection.find(query);
      const result = cursor.toArray();
      res.send(result);
    });

    // Update job
    app.patch("/jobs", async (req, res) => {
      const id = req.params.id;
      const updateJob = req.body;
      const query = { _id: new ObjectId(id) };
      const update = {
        $set: {
          title: updateUser.title,
          postedBy: updateUser.postedBy,
          category: updateUser.category,
          summary: updateUser.summary,
          coverImage: updateUser.coverImage,
          userEmail: updateUser.userEmail,
        },
      };
      const result = jobsCollection.updateOne(query, update);
      res.send(result);
    });

    //  Get a single job details
    app.get("/jobs:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobsCollection.findOne(query);
      res.send(result);
    });

    // Add a jobs
    app.post("/jobs", async (req, res) => {
      const newJob = req.body;
      const result = await jobsCollection.insertOne(newJob);
      res.send(result);
    });

    // Delete job
    app.delete("/delete", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = jobsCollection.deleteOne(query);
      res.send(result);
    });

    //Get all users API
    app.get("/users", async (req, res) => {
      const cursor = userCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // Post API for users
    app.post("/users", async (req, res) => {
      const newUser = req.body;
      console.log("user", newUser);
      const result = await userCollection.insertOne(newUser);
      res.send(result);
    });

    // Update user
    app.patch("/users/:id", async (req, res) => {
      const id = req.params.id;
      const updateUser = req.body;
      const query = { _id: new ObjectId(id) };
      const update = {
        $set: {
          name: updateUser.name,
          email: updateUser.email,
        },
      };
      const options = {};
      const result = await userCollection.updateOne(query, update, options);
      res.send(result);
    });

    // Delete user
    app.delete("/users/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await userCollection.deleteOne(query);
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log("Successfully connected to MongoDB");
  } finally {
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
