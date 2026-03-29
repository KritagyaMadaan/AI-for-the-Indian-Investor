import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("No API Key found");
    process.exit(1);
}

const genAI = new GoogleGenAI(apiKey);

async function listModels() {
    try {
        const result = await genAI.listModels();
        console.log(JSON.stringify(result, null, 2));
    } catch (e) {
        console.error("ListModels failed:", e.message);
    }
}

listModels();
