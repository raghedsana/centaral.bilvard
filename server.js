

const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(bodyParser.json());
app.use(cors({
    origin: '*',  // Tillåt alla domäner (För produktion, specificera en domän här)
    methods: ['GET', 'POST'], 
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Serva statiska filer från 'front-end'-mappen (inklusive bilder i 'imegs' mappen)
app.use(express.static(path.join(__dirname, 'front-end'))); // Serva statiska filer från front-end

// Token-endpoint för att hämta autentiseringstoken
app.post('/get-token', async (req, res) => {
    try {
        const response = await axios.post(
            `https://login.microsoftonline.com/${process.env.TENANT_ID}/oauth2/v2.0/token`,
            new URLSearchParams({
                client_id: process.env.CLIENT_ID,
                scope: 'https://graph.microsoft.com/.default',
                client_secret: process.env.CLIENT_SECRET,
                grant_type: 'client_credentials',
            })
        );

        console.log("Token mottagen:", response.data.access_token);
        res.json({ token: response.data.access_token });
    } catch (error) {
        console.error('Fel vid hämtning av token:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Kunde inte hämta token' });
    }
});

// Skicka index.html för alla GET-förfrågningar (SPA-stöd)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'front-end', 'index.html'));
});

// Starta servern
app.listen(port, () => {
    console.log(`✅ Servern körs på http://localhost:${port}`);
});
