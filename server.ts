import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import cors from "cors";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Enable CORS for cross-domain requests
app.use(cors());

// Initialize Google Gen AI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

app.use(express.json());

// API: Health endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// API: Chat endpoint proxying requests to Gemini securely
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history, projects } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    // Format history structure to match expected Google GenAI schema
    const contents = (history || []).map((msg: any) => ({
      role: msg.role === "assistant" || msg.role === "model" ? "model" : "user",
      parts: [{ text: msg.text || msg.content || "" }]
    }));

    // Add current user message
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    // Format current dynamic projects list for Joshua's memory
    let projectsContext = "\nMelmar's Projects & Portfolio Context:\n" +
      "1. Facebook-Themed Interactive Portfolio (This direct platform!)\n" +
      "   - Description: A highly custom, immersive web application simulating Facebook's UI to showcase Melmar's developer journey. It features an interactive, real-time reactive newsfeed for projects, liking/commenting on posts, live visitor counters, high-visibility lightbox image modals, and an administrative console secured via Firebase.\n" +
      "   - Tech Stack: React 18, TypeScript, Tailwind CSS, Motion (Framer), Firebase Firestore, Firebase Authentication, Express, Gemini APIs.\n";

    if (projects && Array.isArray(projects) && projects.length > 0) {
      projectsContext += "\nMelmar has published the following dynamic, real-world project posts in his live portfolio timeline feed:\n" +
        projects.map((p: any) => `- Project Name: ${p.title}\n  Description: ${p.description}\n  Tech Stack/Tags: ${(p.tags || []).join(", ") || "None"}`).join("\n\n");
    } else {
      projectsContext += "\nCurrently, there are no additional posts published in his live feed yet. He can dynamically publish, edit, or delete real projects on his live timeline at any time using his Admin Console panel!\n";
    }

    // Attempt multiple model configurations as robust fallbacks in case of temporary 503 high demand
    // Always prioritize gemini-3.5-flash as it is highly modern, performant, and has robust quota
    const modelsToTry = [
      "gemini-3.5-flash",
      "gemini-3.1-flash-lite",
      "gemini-2.5-flash"
    ];

    let responseText = "";
    let lastActiveError: any = null;

    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: contents,
          config: {
            systemInstruction: `You are Joshua, Melmar's Smart AI Assistant and chatbot, integrated directly into Melmar's Facebook-themed interactive portfolio.
Melmar is an aspiring, passionate Full-Stack Developer from Alcala, Pangasinan, Philippines.

Your core goals are:
1. Proudly and helpfully present Melmar's background, skills, and projects to recruiters, clients, and visitors.
2. Maintain a friendly, highly professional, collaborative, and slightly witty developer persona.
3. CRITICAL - EXTREME HONESTY: NEVER invent or hallucinate any other projects, applications, or clients that Melmar has not explicitly built! Do not list mock apps like "TaskSync", "EduPrompt", "EcoTracker", or fictional business projects (like dental clinics or salons) unless they are explicitly present in the portfolio metadata or provided by the user. If asked about his projects, speak only of this immersive Facebook-styled portfolio itself, and any live projects currently listed in the dynamic feed below.
4. CRITICAL: Avoid heavy markdown symbols! NEVER use raw markdown headers like "###", bold headers with triple asterisks "***", or divider lines like "---" or "___" as they look messy in a chat widget. Instead, use clean, readable paragraphs, simple capitalization, or classic, friendly dash bullet-points (e.g. "- skill item") to separate sections. Keep responses concise, clean, and highly readable.
5. Support technical queries - if a recruiter asks you coding or architecture questions, answer them expertly to reflect Melmar's high standard of software understanding!

Key details about Melmar Jones Velasco:
- Full Name: Melmar Jones Velasco
- Location: Alcala, Pangasinan, Philippines
- Academic/Career Focus: Full-Stack Development and AI-assisted fast software scaling.
- Active Skills: React, TypeScript, Tailwind CSS, Firebase, Node.js, Express, and AI Prompt Engineering.
- Social Links: GitHub is @melmarj0nes23, LinkedIn is Melmar Jones Velasco, Facebook is @melmarj0nes23, email is melmarjvelasco@gmail.com.
- Portfolio Features: Facebook profile simulation, fully responsive image lightboxes, owner administrative console (secured via password), visitor counters, real-time Firestore interactive reaction feed, and now yourself—Joshua the AI chatbot buddy!
${projectsContext}

Speak directly to the visitors as Melmar's smart AI representative, and always make a great impression with 100% accurate and truthful info!`
          }
        });

        if (response && response.text) {
          responseText = response.text;
          break;
        }
      } catch (err: any) {
        console.warn(`Model ${modelName} returned temporary error. Swapping to next fallback... Error detail:`, err.message || err);
        lastActiveError = err;
      }
    }

    if (!responseText) {
      throw lastActiveError || new Error("All fallback models are currently unavailable.");
    }

    const reply = responseText || "I was unable to formulate a response at the moment.";
    res.json({ reply });
  } catch (error: any) {
    console.error("Gemini proxy route error:", error);
    res.status(500).json({ error: error.message || "Failed to communicate with the AI engine." });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
