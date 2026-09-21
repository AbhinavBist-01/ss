// Document -> text extraction -> chunking
import fs from "fs/promises";
import path from "path";

// Load documents from documents folder
async function loadDocuments(folderPath = "./documents") {
  const files = await fs.readdir(folderPath);
  const documents = [];

  for (const file of files) {
    const filePath = path.join(folderPath, file);
    const stat = await fs.stat(filePath);

    if (stat.isFile()) {
      const content = await fs.readFile(filePath, "utf-8");
      documents.push({
        name: file,
        path: filePath,
        content,
      });
    }
  }

  return documents;
}

// Chunk documents into smaller pieces

async function chunkDocuments(documents, chunkSize = 1000) {
  const chunks = [];
  for (const doc of documents) {
    const content = doc.content;
    for (let i = 0; i < content.length; i += chunkSize) {
      chunks.push({
        content: content.slice(i, i + chunkSize),
        metadata: {
          name: doc.name,
          path: doc.path,
        },
      });
    }
  }
  return chunks;
}

// Attach metadata to each chunk

function attachMetadata(chunks) {
  return chunks.map((chunk) => ({
    ...chunk,
    metadata: {
      ...chunk.metadata,
    },
  }));
}
