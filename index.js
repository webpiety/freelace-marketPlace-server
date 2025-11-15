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
    app.post("/myTasks", async (req, res) => {
      try {
        const newTask = req.body;

        // Find the job
        const matchingJob = await jobsCollection.findOne({
          _id: new ObjectId(newTask.jobApplyId),
        });

        if (!matchingJob) {
          return res.status(404).send("Job not found");
        }

        // Prevent user from applying to their own job
        if (matchingJob.userEmail === newTask.user_email) {
          return res.status(400).send("You can't apply to your own job");
        }

        // Prevent applying to the same job twice
        const exists = await myJobsCollection.findOne({
          user_email: newTask.user_email,
          jobApplyId: newTask.jobApplyId,
        });

        if (exists) {
          return res.status(400).send("You already applied to this job");
        }

        // Insert the new task
        const result = await myJobsCollection.insertOne(newTask);
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: error.message });
      }
    });

    //my task get api
    app.get("/myTasks", async (req, res) => {
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
    app.get("/jobs", async (req, res) => {
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
    app.get("/jobs/:id", async (req, res) => {
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
