import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Initialize Google GenAI client for server-side API calls
const getGenAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY process variable is missing");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// API Endpoint for AI Motion Intro Generator
app.post("/api/ai-generate-intro", async (req, res) => {
  try {
    const { prompt, aspectRatio = "16:9", style = "cyberpunk" } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const ai = getGenAI();

    const systemInstruction = `You are a professional After Effects motion graphics director and SVG expert.
Generate a structured JSON configuration for a video intro animation based on the user's prompt.
The output MUST be raw valid JSON strictly adhering to the schema below without markdown formatting or code blocks.

Aspect ratio: ${aspectRatio}
Style: ${style}

Output JSON schema format:
{
  "title": "Intro Title",
  "duration": 5.0,
  "backgroundColor": "#0d0f17",
  "backgroundGradient": "radial-gradient(circle, #1a1e2e 0%, #08090d 100%)",
  "layers": [
    {
      "id": "unique-string",
      "name": "Layer Name",
      "type": "shape" | "text" | "path" | "particles",
      "shapeKind": "circle" | "rect" | "polygon" | "star" | "badge" | "wave" | "burst",
      "text": "TEXT IF TYPE IS TEXT",
      "fontFamily": "Inter, sans-serif",
      "fontSize": 48,
      "fontWeight": "bold",
      "svgPath": "M 0 0 ... IF TYPE IS PATH OR CUSTOM SHAPE",
      "glowColor": "#00f0ff",
      "shadowBlur": 15,
      "zIndex": 1,
      "keyframes": [
        {
          "time": 0,
          "x": 0,
          "y": 0,
          "scaleX": 0.1,
          "scaleY": 0.1,
          "rotation": -45,
          "opacity": 0,
          "fill": "#00f0ff",
          "stroke": "#ffffff",
          "strokeWidth": 2,
          "trimStart": 0,
          "trimEnd": 0,
          "blur": 10,
          "easing": "elastic"
        },
        {
          "time": 1.5,
          "x": 0,
          "y": 0,
          "scaleX": 1,
          "scaleY": 1,
          "rotation": 0,
          "opacity": 1,
          "fill": "#00f0ff",
          "stroke": "#ffffff",
          "strokeWidth": 2,
          "trimStart": 0,
          "trimEnd": 1,
          "blur": 0,
          "easing": "easeInOut"
        },
        {
          "time": 4.5,
          "x": 0,
          "y": 0,
          "scaleX": 1.05,
          "scaleY": 1.05,
          "rotation": 5,
          "opacity": 1,
          "fill": "#00f0ff",
          "stroke": "#ffffff",
          "strokeWidth": 2,
          "trimStart": 0,
          "trimEnd": 1,
          "blur": 0,
          "easing": "easeOut"
        }
      ]
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: `Create an animated SVG motion intro for: ${prompt}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });

    const jsonText = response.text || "{}";
    const projectData = JSON.parse(jsonText);
    return res.json({ success: true, project: projectData });
  } catch (error: any) {
    console.error("AI Intro Generation Error:", error);
    return res.status(500).json({
      error: error?.message || "Failed to generate AI intro animation",
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
