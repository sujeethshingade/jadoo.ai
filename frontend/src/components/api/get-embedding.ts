// Ensure the API endpoint correctly handles and returns embeddings as arrays compatible with pgvector

import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ message: "Text is required" });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: "Gemini API key not configured" });
    }

    const apiResponse = await fetch("https://api.gemini.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gemini-embedding-model", // Ensure this matches Gemini API's model name
        input: text,
      }),
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      throw new Error(errorData.error.message || "Failed to generate embedding");
    }

    const data = await apiResponse.json();
    const embedding = data.embedding;

    if (!embedding || !Array.isArray(embedding)) {
      throw new Error("Invalid embedding received from Gemini API");
    }

    res.status(200).json({ embedding });
  } catch (error: any) {
    console.error("Error generating embedding:", error.message || error);
    res.status(500).json({ message: error.message || "Internal Server Error" });
  }
}