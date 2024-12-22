// Fixed import path for Supabase client

import { createClient } from "@/lib/supabase"; // Corrected import path
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey || !GEMINI_API_KEY) {
  console.error("Missing necessary environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

/**
 * Generates an embedding for the given text using the Gemini API.
 * @param text The input text to generate an embedding for.
 * @returns The embedding array.
 */
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await fetch("https://api.gemini.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GEMINI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gemini-embedding-model", // Ensure this matches the model name as per Gemini API
        input: text,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error.message || "Failed to generate embedding.");
    }

    const data = await response.json();

    if (!data.embedding || !Array.isArray(data.embedding)) {
      throw new Error("Invalid embedding format received from Gemini API.");
    }

    return data.embedding;
  } catch (error: any) {
    console.error(`Error generating embedding for text "${text}":`, error.message || error);
    throw error;
  }
}

/**
 * Fetches all images with null embeddings from Supabase.
 * @returns An array of image objects.
 */
async function fetchImagesWithoutEmbeddings() {
  const { data, error } = await supabase
    .from("images")
    .select("id, description, tags")
    .is("embedding", null);

  if (error) {
    console.error("Error fetching images without embeddings:", error.message || error);
    throw error;
  }

  return data as Array<{ id: string; description?: string; tags?: string }>;
}

/**
 * Updates the embedding for a specific image in Supabase.
 * @param id The ID of the image.
 * @param embedding The embedding array to update.
 */
async function updateImageEmbedding(id: string, embedding: number[]) {
  const { error } = await supabase
    .from("images")
    .update({ embedding })
    .eq("id", id);

  if (error) {
    console.error(`Error updating embedding for image ID ${id}:`, error.message || error);
    throw error;
  }

  console.log(`Successfully updated embedding for image ID ${id}.`);
}

/**
 * Main function to populate embeddings for all images lacking them.
 */
async function populateEmbeddings() {
  try {
    const images = await fetchImagesWithoutEmbeddings();

    if (images.length === 0) {
      console.log("All images already have embeddings. No action needed.");
      return;
    }

    console.log(`Found ${images.length} images without embeddings. Starting the update process...`);

    for (const image of images) {
      const { id, description, tags } = image;
      const text = description || tags || "";

      if (!text.trim()) {
        console.warn(`Image ID ${id} has no description or tags. Skipping embedding generation.`);
        continue;
      }

      try {
        const embedding = await generateEmbedding(text);
        await updateImageEmbedding(id, embedding);
      } catch (error) {
        console.error(`Failed to process image ID ${id}:`, error.message || error);
      }
    }

    console.log("Embedding population process completed.");
  } catch (error) {
    console.error("An error occurred during the embedding population process:", error.message || error);
  }
}

populateEmbeddings();