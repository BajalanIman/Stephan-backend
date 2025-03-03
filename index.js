import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const app = express();

// CORS Configuration
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",") // Support multiple origins
  : ["https://adapt-wald-holz-chatbot.netlify.app"]; // Add the correct frontend URL here.

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.includes("*") ||
        allowedOrigins.includes(origin)
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type"],
    credentials: true, // Allow credentials if needed
  })
);

app.options("*", cors()); // Handle preflight requests

app.use(express.static("public"));
app.use(express.json());

// -------------------------------------------------------------------------

app.get("/", (req, res) => {
  res.json("Hello, this is the backend!");
});

// GET /users ----------------------------------------------------------------
app.get("/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    return res.json(users);
  } catch (err) {
    console.log(err);
    return res.json(err);
  }
});

// POST /users ----------------------------------------------------------------
app.post("/users", async (req, res) => {
  const {
    created_at,
    date_of_birth,
    email,
    first_name,
    last_login_at,
    last_name,
    password,
    user_config_id,
    username,
  } = req.body;

  try {
    const newUser = await prisma.user.create({
      data: {
        created_at,
        date_of_birth,
        email,
        first_name,
        last_login_at,
        last_name,
        password,
        user_config_id,
        username,
      },
    });

    const userId = newUser.user_id;

    return res
      .status(201)
      .json({ message: "Record inserted successfully", user_id: userId });
  } catch (err) {
    console.error("Error inserting record:", err);
    return res.status(500).json({ error: "Error inserting record" });
  }
});

// POST /check-user ---------------------------------------------------------
app.post("/check-user", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findFirst({
      where: {
        email,
        password,
      },
    });
    if (user) {
      return res.status(200).json({ exists: true, user });
    } else {
      return res.status(404).json({ exists: false, message: "User not found" });
    }
  } catch (err) {
    console.error("Error querying database:", err);
    return res.status(500).json({ error: "Database query error" });
  }
});

// PUT /users/:id ------------------------------------------------------------
app.put("/users/:id", async (req, res) => {
  const { id } = req.params;
  const {
    created_at,
    date_of_birth,
    email,
    first_name,
    last_login_at,
    last_name,
    password,
    user_config_id,
    username,
  } = req.body;

  try {
    await prisma.user.update({
      where: { user_id: Number(id) },
      data: {
        created_at,
        date_of_birth,
        email,
        first_name,
        last_login_at,
        last_name,
        password,
        user_config_id,
        username,
      },
    });
    return res.status(200).json({ message: "Record updated successfully" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Error updating record" });
  }
});

// DELETE /users/:id ---------------------------------------------------------
app.delete("/users/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.user.delete({
      where: { user_id: Number(id) },
    });
    return res.status(200).json({ message: "Record deleted successfully" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Error deleting record" });
  }
});

// GET /conversations --------------------------------------------------------
app.get("/conversations", async (req, res) => {
  try {
    const conversations = await prisma.conversation.findMany({
      include: {
        messages: true,
      },
      orderBy: {
        created_at: "desc",
      },
    });
    return res.status(200).json(conversations);
  } catch (err) {
    console.error("Error fetching conversations:", err);
    return res.status(500).json({ error: "Error fetching conversations" });
  }
});

// POST /conversations -------------------------------------------------------
app.post("/conversations", async (req, res) => {
  const { user_id, title } = req.body;

  if (!user_id || !title) {
    return res.status(400).json({ error: "user_id and title are required" });
  }

  try {
    const conversation = await prisma.conversation.create({
      data: {
        user_id,
        title,
      },
    });
    return res.status(201).json({
      message: "Conversation created successfully",
      id: conversation.conversation_id,
    });
  } catch (err) {
    console.error("Error creating conversation:", err);
    return res.status(500).json({ error: "Error creating conversation" });
  }
});

//  DELETE /conversations/:id ------------------------------------------------------------
// app.delete("/conversations/:id", async (req, res) => {
//   const { id } = req.params;

//   try {
//     await prisma.message.deleteMany({
//       where: { conversation_id: Number(id) },
//     });

//     await prisma.conversation.delete({
//       where: { conversation_id: Number(id) },
//     });

//     return res
//       .status(200)
//       .json({ message: "Conversation deleted successfully" });
//   } catch (err) {
//     console.error("Error deleting conversation:", err);
//     return res.status(500).json({ error: "Error deleting conversation" });
//   }
// });

// POST /messages ------------------------------------------------------------
app.post("/messages", async (req, res) => {
  const { conversation_id, user_id, question, answer } = req.body;

  try {
    const message = await prisma.message.create({
      data: {
        conversation_id,
        user_id,
        question,
        answer,
      },
    });
    return res.status(201).json({
      message: "Message saved successfully",
      message_id: message.message_id,
    });
  } catch (err) {
    console.error("Error saving message:", err);
    return res.status(500).json({ error: "Error saving message" });
  }
});

// GET /messages -------------------------------------------------------------
app.get("/messages", async (req, res) => {
  try {
    const messages = await prisma.message.findMany();
    return res.status(200).json(messages);
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ error: "Error fetching messages" });
  }
});

const PORT = process.env.PORT || 8800;
app.listen(PORT, () => {
  console.log(`Backend is running on port ${PORT}.`);
});

// app.listen(8800, () => {
//   console.log("Backend is running on port 8800.");
// });
