import "dotenv/config";
import OpenAI from "openai";
import { finalChunks } from "./ingestion.js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Convert text chunks into embeddings
const createEmbeddings = async (chunks) => {
  const embeddings = [];
  for (const chunk of chunks) {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: chunk.content,
    });
    embeddings.push({
      embedding: response.data[0].embedding,
      content: chunk.content,
      metadata: chunk.metadata,
    });
  }
  return embeddings;
};

// Implement cosine similarity function to compare embeddings

const cosineSimilarity = (vecA, vecB) => {
  const dotProduct = vecA.reduce((acc, val, i) => acc + val * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((acc, val) => acc + val * val, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((acc, val) => acc + val * val, 0));

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }
  return dotProduct / (magnitudeA * magnitudeB);
};

// retrieve top-k

const retrieveTopK = (queryEmbedding, embeddings, k, filters = {}) => {
  // 1. Metadata filtering
  const filtered = embeddings.filter((item) => {
    return Object.entries(filters).every(([key, value]) => {
      return item.metadata[key] === value;
    });
  });

  // 2. Calculate similarity
  const similarities = filtered.map((item) => ({
    ...item,
    similarity: cosineSimilarity(queryEmbedding, item.embedding),
  }));

  // 3. Sort highest similarity first
  similarities.sort((a, b) => b.similarity - a.similarity);

  // 4. Return top-k
  return similarities.slice(0, k);
};

const main = async () => {
  // Create embeddings for the final chunks
  const embeddings = await createEmbeddings(finalChunks);
  const query = "What is the main topic of the document?";
  const queryEmbeddingResponse = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: query,
  });
  const queryEmbedding = queryEmbeddingResponse.data[0].embedding;

  // Retrieve top-k relevant chunks based on the query embedding
  const topK = retrieveTopK(queryEmbedding, embeddings, 3);
  console.log("Top-k relevant chunks:", topK);
};

main();
