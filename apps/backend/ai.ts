import { Pinecone } from "@pinecone-database/pinecone";
import dotenv from "dotenv";
import { ai_config } from "@repo/common";
import { chunkText } from "./controllers/chunk";

dotenv.config({ path: "../../.env" });

const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });

async function checkIfIndexExists(indexName: string): Promise<void> {
  try {
    console.log(`Checking if Pinecone index exists: ${indexName}`);

    const listIndexes = await pinecone.listIndexes();
    console.log({ listIndexes });

    const indexExists = listIndexes.indexes?.some(
      (index) => index.name === indexName
    );

    if (indexExists) {
      console.log(`✅ Index ${indexName} already exists`);
      return;
    }

    console.log(`Index ${indexName} does not exist, creating...`);

    await pinecone.createIndexForModel({
      name: indexName,
      cloud: "aws",
      region: ai_config.region,
      embed: {
        model: "llama-text-embed-v2",
        fieldMap: { text: "content" },
      },
      waitUntilReady: true,
    });

    console.log(`✅ Successfully created index: ${indexName}`);
  } catch (error: any) {
    console.error(
      `❌ Error checking/creating Pinecone index ${indexName}:`,
      error
    );
    throw new Error(
      `Failed to check/create Pinecone index ${indexName}: ${error.message}`
    );
  }
}

export const embedCompanyDoc = async ({
  companyId,
  filedata,
  fileId,
}: {
  companyId: string;
  filedata: string;
  fileId: string;
}) => {
  try {
    const namespace = `company:${companyId}:docs`;
    const indexName =
      process.env.NODE_ENV === "PRODUCTION"
        ? ai_config.prod_index
        : ai_config.dev_index;

    await checkIfIndexExists(indexName);

    console.log(namespace);
    const index = pinecone.index(indexName).namespace(namespace);
    console.log(index, "current index dataaaaaaaaa");
    // await index.deleteAll();
    console.log(`Cleared existing records in namespace ${namespace}`);

    // Chunk the text
    const chunks = chunkText(filedata, 500);
    const records = [];

    // Prepare records for upserting
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      records.push({
        id: `${fileId}-${i}`,
        content: chunk || "",
      });
    }

    console.log(chunks);

    console.log(`Prepared ${records.length} chunks for file ${fileId}`);

    const upsertResult = await index.upsertRecords(records);
    console.log(
      { upsertResult },
      `Upsert result for file ${fileId} in ${namespace}`
    );

    const stats = await index.describeIndexStats();
    console.log(
      { stats },
      `Index stats for namespace ${namespace} after upsert`
    );

    return { success: true, chunksEmbedded: records.length };
  } catch (err: any) {
    console.error("Embedding failed:", err.message);
    throw err;
  }
};
