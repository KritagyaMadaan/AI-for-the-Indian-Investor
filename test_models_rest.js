import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("No API Key found");
    process.exit(1);
}

async function listModels() {
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const response = await axios.get(url);
        console.log(JSON.stringify(response.data.models.map(m => m.name), null, 2));
    } catch (e) {
        console.error("ListModels failed:", e.message);
        if (e.response && e.response.data) {
            console.error(JSON.stringify(e.response.data, null, 2));
        }
    }
}

listModels();
