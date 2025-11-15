const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
require("dotenv").config();
const admin = require("firebase-admin");
const port = process.env.PORT || 2173;

const serviceAccount = require("./freelance-firebase-adminsdk.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

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

// Middleware
const logger = (req, res, next) => {
  next();
};

const verifyFirebaseToken = async (req, res, next) => {
  console.log("in the verify middleware", req.headers.authorization);
  if (!req.headers.authorization) {
    return res.status(401).send({ message: "Unauthorized Access" });
  }
  const token = req.headers.authorization.split(" ")[1];
  if (!token) {
    return res.status(401).send({ message: "Unauthorized Access" });
  }
  try {
    const userInfo = await admin.auth().verifyIdToken(token);
    console.log("After token verify", userInfo);
    next();
  } catch {
    return res.status(401).send({ message: "Unauthorized Access" });
  }
};

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
    const bannerCollection = db.collection("banner");

    //patch task api
    app.patch("/myTasks/:id", async (req, res) => {
      const id = req.params.id;
      const updateTask = req.body;
      const query = { _id: new ObjectId(id) };
      const update = {
        $set: {
          status: updateTask.status,
        },
      };
      const result = await myJobsCollection.updateOne(query, update);
      res.send(result);
    });

    //myTask post Api
    app.post("/myTasks", logger, verifyFirebaseToken, async (req, res) => {
      try {
        const newTask = req.body;
        const matchingJob = await jobsCollection.findOne({
          _id: new ObjectId(newTask.jobApplyId),
        });

        if (!matchingJob) {
          return res.status(404).send("Job not found");
        }
        if (matchingJob.userEmail === newTask.user_email) {
          return res.status(400).send("You can't apply to your own job");
        }

        const exists = await myJobsCollection.findOne({
          user_email: newTask.user_email,
          jobApplyId: newTask.jobApplyId,
        });

        if (exists) {
          return res.status(400).send("You already applied to this job");
        }

        const result = await myJobsCollection.insertOne(newTask);
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: error.message });
      }
    });

    //my task get api
    app.get("/myTasks", logger, verifyFirebaseToken, async (req, res) => {
      const cursor = myJobsCollection.find();
      const result = await cursor.toArray(cursor);
      res.send(result);
    });

    // myTask delete api
    app.delete("/myTasks/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await myJobsCollection.deleteOne(query);

        if (result.deletedCount === 1) {
          res.status(200).json({
            message: "Task deleted successfully",
            deletedCount: 1,
          });
        } else {
          res.status(404).json({ message: "Task not found", deletedCount: 0 });
        }
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
      }
    });

    // Banner Api
    app.get("/banner", async (req, res) => {
      const cursor = bannerCollection.find();
      const result = await cursor.toArray(cursor);
      res.send(result);
    });
    //  Get all jobs
    app.get("/jobs", logger, verifyFirebaseToken, async (req, res) => {
      console.log("Header", req.headers);
      const cursor = jobsCollection.find();
      const result = await cursor.toArray(cursor);
      res.send(result);
    });
    // latest jobs
    app.get("/jobs/latest", async (req, res) => {
      const cursor = jobsCollection.find().sort({ createdDate: -1 }).limit(6);
      const result = await cursor.toArray(cursor);
      res.send(result);
    });
    // My added jobs
    app.get("/myAddedJobs", logger, verifyFirebaseToken, (req, res) => {
      const email = req.query.email;
      const query = {};
      if (email) {
        query.userEmail = email;
      }
      const cursor = jobsCollection.find(query);
      const result = cursor.toArray();
      res.send(result);
    });

    // Update job
    app.patch("/jobs/:id", async (req, res) => {
      const id = req.params.id;
      const updateJob = req.body;

      const query = { _id: new ObjectId(id) };
      const update = {
        $set: {
          title: updateJob.title,
          category: updateJob.category,
          summary: updateJob.summary,
          coverImage: updateJob.coverImage,
        },
      };
      const result = await jobsCollection.updateOne(query, update);
      res.send(result);
    });

    //  Get a single job details
    app.get("/jobs/:id", logger, verifyFirebaseToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobsCollection.findOne(query);
      res.send(result);
    });

    // Add a jobs
    app.post("/jobs", logger, verifyFirebaseToken, async (req, res) => {
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

    await client.db("admin").command({ ping: 1 });
    console.log("Successfully connected to MongoDB");
  } finally {
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
