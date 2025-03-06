
// // Importera nödvändiga bibliotek
// const express = require('express');
// const bodyParser = require('body-parser');
// const axios = require('axios');
// const cors = require('cors');

// // Skapa Express app
// const app = express();

// // Middleware
// app.use(bodyParser.json());
// app.use(cors());

// // Ditt Azure AD Client ID, Tenant ID och Client Secret
// const clientId = 'c2ee67a5-df65-40ba-8788-f7609fec6ac4'; // Ersätt med ditt Client ID från Azure
// const tenantId = 'd8270c95-3840-4d86-b8d3-8f2988525b2a'; // Ersätt med ditt Tenant ID från Azure
// const clientSecret = 'OdQ8Q~vv66B7zk4c3-XsIVIHfDf.qrnzGNyKua_h'; // Ersätt med ditt Client Secret från Azure

// // Endpoint för att hämta token
// app.post('/get-token', async (req, res) => {
//     try {
//         const response = await axios.post(
//             `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
//             new URLSearchParams({
//                 client_id: clientId,
//                 scope: 'https://graph.microsoft.com/.default',
//                 client_secret: clientSecret,
//                 grant_type: 'client_credentials',
//             })
//         );

//         // 🔴 LÄGG TILL DENNA RAD FÖR ATT SE TOKEN I KONSOLET 🔴
//         console.log("Token mottagen:", response.data.access_token);  

//         // Skicka tillbaka token till frontend
//         res.json({ token: response.data.access_token });
//     } catch (error) {
//         console.error('Fel vid hämtning av token:', error.response ? error.response.data : error.message);
//         res.status(500).json({ error: 'Kunde inte hämta token' });
//     }
// });






// // Kör servern på port 3000
// app.listen(3000, () => {
//     console.log('Backend körs på http://localhost:3000');
// });










// Importera nödvändiga bibliotek
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors');

// Skapa Express app
const app = express();

// Middleware
app.use(bodyParser.json());

// CORS-konfiguration för att tillåta endast förfrågningar från en specifik URL
const corsOptions = {
    origin: '*', // Tillåt alla domäner för test
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};
app.use(cors(corsOptions));


// Ditt Azure AD Client ID, Tenant ID och Client Secret
const clientId = 'c2ee67a5-df65-40ba-8788-f7609fec6ac4'; // Ersätt med ditt Client ID från Azure
const tenantId = 'd8270c95-3840-4d86-b8d3-8f2988525b2a'; // Ersätt med ditt Tenant ID från Azure
const clientSecret = 'OdQ8Q~vv66B7zk4c3-XsIVIHfDf.qrnzGNyKua_h'; // Ersätt med ditt Client Secret från Azure

// Endpoint för att hämta token
app.options('*', cors(corsOptions));  // För att hantera preflight-förfrågningar

// Ditt vanliga POST-endpoint
app.post('/get-token', async (req, res) => {
    try {
        const response = await axios.post(
            `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
            new URLSearchParams({
                client_id: clientId,
                scope: 'https://graph.microsoft.com/.default',
                client_secret: clientSecret,
                grant_type: 'client_credentials',
            })
        );

        console.log("Token skapad:", response.data.access_token);  // Lägg till denna logg
        res.json({ token: response.data.access_token });
    } catch (error) {
        console.error('❌ Fel vid hämtning av token:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Kunde inte hämta token' });
    }
});

// Kör servern på port 3000
app.listen(3000, '0.0.0.0', () => {
    console.log('Backend körs på http://0.0.0.0:3000');
});
