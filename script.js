


require('dotenv').config(); // Lägg till denna rad högst upp
const azureToken = process.env.AZURE_TOKEN;


// Funktion för att hämta autentiseringstoken
async function getToken() {
    try {
        const response = await fetch('http://localhost:3000/get-token', { method: 'POST' });
        const data = await response.json();
        return data.token;
    } catch (error) {
        console.error('❌ Fel vid hämtning av token:', error);
        return null;
    }
}

async function loadServices() {
    const token = await getToken();
    if (!token) return console.error("❌ Kunde inte hämta autentiseringstoken!");

    const listId = "55799431-5d9a-4e47-af8d-fb320dadc9ac";
    const siteId = "orkarallt2022.sharepoint.com,126de03e-7fc2-4e7e-af61-ed3790083184,179e2cf6-21eb-460b-b796-6baa607ffa53";

    try {
        const response = await fetch(
            `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/items?expand=fields`, 
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            }
        );

        if (!response.ok) throw new Error(await response.text());

        const data = await response.json();
       

        const serviceDropdown = document.getElementById("service");
        if (!serviceDropdown) {
            console.error("❌ Kunde inte hitta service-dropdown i DOM!");
            return;
        }

        serviceDropdown.innerHTML = '<option value="">Välj en tjänst...</option>';

        // Sortera tjänster efter SorteringsIndex
        const sortedServices = data.value
            .map(item => ({
                name: item.fields?.Tj_x00e4_nst,
                price: item.fields?.Pris,
                sortIndex: item.fields?.SorteringsIndex ?? 9999 // Standardvärde om ingen index finns
            }))
            .filter(service => service.name && service.price !== undefined)
            .sort((a, b) => a.sortIndex - b.sortIndex); // Sortera efter SorteringsIndex

        // Lägg till sorterade tjänster i dropdown
        sortedServices.forEach(({ name, price }) => {
            const option = document.createElement("option");
            option.value = name;
            option.dataset.price = price;
            option.textContent = `${name} - ${price} kr`;
            serviceDropdown.appendChild(option);
        });

    } catch (error) {
        console.error("❌ Fel vid hämtning av tjänster:", error);
    }
}

// Funktion för att uppdatera pris när en tjänst väljs
function updatePrice() {
    const serviceDropdown = document.getElementById('service');
    const selectedOption = serviceDropdown.options[serviceDropdown.selectedIndex];

    // Kontrollera om alternativet har ett pris
    const price = selectedOption.dataset.price ? selectedOption.dataset.price : '-';

    // Uppdatera priset i HTML
    document.getElementById('price').textContent = price;
}


// Funktion för att hämta LookupId för tjänsten
async function getServiceLookupId(serviceName) {
    const token = await getToken();
    if (!token) return null;

    try {
        const encodedServiceName = encodeURIComponent(serviceName.trim());
        const url = `https://graph.microsoft.com/v1.0/sites/orkarallt2022.sharepoint.com,126de03e-7fc2-4e7e-af61-ed3790083184,179e2cf6-21eb-460b-b796-6baa607ffa53/lists/55799431-5d9a-4e47-af8d-fb320dadc9ac/items?$search="${encodedServiceName}"&expand=fields`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) throw new Error(await response.text());

        const data = await response.json();
      

        const foundService = data.value.find(item => item.fields.Tj_x00e4_nst === serviceName);
        return foundService ? foundService.id : null;

    } catch (error) {
        console.error("❌ Fel vid hämtning av tjänst:", error);
        return null;
    }
}

document.getElementById('submit').addEventListener('click', async (event) => {
    event.preventDefault();  // Förhindrar formuläret från att skickas

    const firstname = document.getElementById('firstname').value;
    const email = document.getElementById('email').value;
    const regNumber = document.getElementById('regNumber').value;
    const phone = document.getElementById('phone').value;
    const service = document.getElementById('service').value;
    const datum = document.getElementById('bookingDate').value;
    const bookingTime = document.getElementById('bookingTime').value;

    if (!datum || !bookingTime) {
        alert("❌ Vänligen välj både datum och tid!");
        return;
    }

    // 🛑 Bekräfta bokningen innan den skickas
    const confirmation = confirm(
        `Är du säker på att du vill boka?\n\n📅 Datum: ${datum}\n🕒 Tid: ${bookingTime}\n🔧 Tjänst: ${service}\n👤 Namn: ${firstname}\n📧 E-post: ${email}`
    );

    if (!confirmation) {
        alert("📛 Bokning avbröts.");
        return;
    }

    // Skicka bokningen om användaren bekräftar
    await addBooking(firstname, email, regNumber, phone, service, datum, bookingTime);
});

    
async function addBooking(firstname, email, regNummer, phone, service, datum, bookingTime) {
    const token = await getToken();
    if (!token) return alert('❌ Kunde inte hämta autentiseringstoken!');

    const lookupId = await getServiceLookupId(service);
    if (!lookupId) return alert('❌ Tjänst kunde inte hittas.');

    const parsedPhone = Number(phone);  
    const parsedLookupId = Number(lookupId);

    if (!datum || !bookingTime) {
        console.error('❌ Ogiltigt datum eller tid:', datum, bookingTime);
        return alert('❌ Du måste välja både ett datum och en tid!');
    }

    const localDate = new Date(`${datum}T${bookingTime}:00`);

    if (isNaN(localDate.getTime())) {
        console.error('❌ Ogiltigt datum eller tid:', datum, bookingTime);
        return alert('❌ Ogiltigt datum eller tid!');
    }

    const localDateString = `${localDate.getFullYear()}-${(localDate.getMonth() + 1).toString().padStart(2, '0')}-${localDate.getDate().toString().padStart(2, '0')}T${localDate.getHours().toString().padStart(2, '0')}:${localDate.getMinutes().toString().padStart(2, '0')}:${localDate.getSeconds().toString().padStart(2, '0')}`;

    

    const bookingData = {
        "firstname": firstname,
        "postadress": email,  
        "regNummer": regNummer,
        "mobil": parsedPhone,
        "serviceLookupId": parsedLookupId, 
        "orderLookupId": parsedLookupId,
        "datum": localDateString,
    };

    console.log("📩 Skickar bokning:", JSON.stringify(bookingData, null, 2));

    try {
        const flowUrl = 'https://prod-04.northeurope.logic.azure.com:443/workflows/16d06e48745d4f0b9d7d05c1f7290bf7/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=dPWUnj2-Bam9T5TJSmovIkuvqEi2JDgn6MmkL9MKB2g';
        
        const response = await fetch(flowUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookingData),
        });

        console.log("💬 Server svarade med status:", response.status);

        // 🛑 Hantera fall där responsen inte är JSON
        let responseData;
        try {
            responseData = await response.json();
            console.log("📥 Svar från server:", responseData);
        } catch (jsonError) {
            console.warn("⚠️ Kunde inte tolka JSON från servern:", jsonError);
            responseData = null;
        }

        if (response.ok) {
            alert("✅ Bokning bekräftad!");
            resetForm();// 🔄 Återställ formuläret här!
        }
        
        
        else {
            console.error("❌ Fel vid bokning:", responseData);
            alert('❌ Bokningsfel: ' + (responseData?.message || 'Okänt fel'));
        }
    } catch (error) {
        console.error('❌ Fel vid bokning:', error);
        alert('❌ Ett oväntat fel inträffade vid bokningen.');
    }
}






async function updateTimes() {
    const dateInput = document.getElementById('bookingDate').value;
    const bookingTimeSelect = document.getElementById('bookingTime');

    if (!dateInput) return;

    const selectedDate = new Date(dateInput);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Nollställ tiden för jämförelse
    const oneYearLater = new Date();
    oneYearLater.setFullYear(today.getFullYear() + 1);

    if (selectedDate <= today) {
        alert("❌ Du kan inte boka samma dag eller bakåt i tiden. Välj ett framtida datum!");
        document.getElementById('bookingDate').value = "";
        bookingTimeSelect.innerHTML = '<option value="">Välj en tid...</option>';
        return;
    }

    if (selectedDate > oneYearLater) {
        alert("❌ Du kan endast boka upp till ett år framåt!");
        document.getElementById('bookingDate').value = "";
        bookingTimeSelect.innerHTML = '<option value="">Välj en tid...</option>';
        return;
    }

    // Rensa gamla tider från menyn
    bookingTimeSelect.innerHTML = '<option value="">Välj en tid...</option>';

    const dayOfWeek = selectedDate.getDay();
    let availableTimes = [];

    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        availableTimes = generateTimes('08:00', '17:00');
    } else if (dayOfWeek === 6) {
        availableTimes = generateTimes('09:00', '14:00');
    } else if (dayOfWeek === 0) {
        const option = document.createElement('option');
        option.value = 'stängt';
        option.textContent = 'Stängt på Söndag';
        option.style.color = 'red';
        option.disabled = true;
        bookingTimeSelect.appendChild(option);
        return;
    }

    // 🔄 Hämta bokade tider från SharePoint
    let bookedTimes = await fetchBookedTimes(); 
    

    if (!bookedTimes || bookedTimes.length === 0) {
        console.warn("⚠️ Inga bokningar hittades!");
    }

    let selectedDateStr = new Date(dateInput).toISOString().split("T")[0];

    availableTimes.forEach(time => {
        const option = document.createElement('option');
        option.value = time;
        option.textContent = time;
    
        // 🔴 Korrigerad jämförelse av bokade tider
        let isBooked = bookedTimes.some(booking => 
            booking.datum === selectedDateStr && normalizeTime(booking.tid) === normalizeTime(time)
        );
    
        if (isBooked) {
            option.style.color = 'red';
            option.textContent += " (Upptagen)";
            option.disabled = true;
        }
    
        bookingTimeSelect.appendChild(option);
    });
}



// Funktion för att generera tider mellan en starttid och en sluttid
function generateTimes(startTime, endTime) {
    const times = [];
    let current = new Date(`1970-01-01T${startTime}:00`);
    const end = new Date(`1970-01-01T${endTime}:00`);

    while (current <= end) {
        const hours = current.getHours().toString().padStart(2, '0');
        const minutes = current.getMinutes().toString().padStart(2, '0');
        times.push(`${hours}:${minutes}`);
        current.setMinutes(current.getMinutes() + 60); // Justera intervallet vid behov
    }

    return times;
}



// 🔄 Funktion för att säkerställa att tider har samma format
function normalizeTime(time) {
    if (!time) return "";
    let [hours, minutes] = time.split(":").map(Number);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

// 🔄 Funktion för att hämta bokade tider från SharePoint
async function fetchBookedTimes() {
    const token = await getToken();
    if (!token) return console.error("❌ Kunde inte hämta autentiseringstoken!");

    const listId = "98f87185-1827-4fca-bb1d-12869374fb7b";
    const siteId = "orkarallt2022.sharepoint.com,126de03e-7fc2-4e7e-af61-ed3790083184,179e2cf6-21eb-460b-b796-6baa607ffa53";

    try {
        const response = await fetch(
            `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/items?expand=fields`, 
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            }
        );

        if (!response.ok) throw new Error(await response.text());

        const data = await response.json();
       

        return data.value
            .map(item => {
                

                const fullDatum = item.fields?.datum || null;

                if (!fullDatum) {
                    console.warn("⚠️ Saknar datum i en bokning:", item);
                    return null; // Om datum saknas, returnera null
                }

                const datum = new Date(fullDatum);
                const datumStr = datum.toISOString().split("T")[0]; // Exempel: "2025-03-01"
                const tidStr = datum.toTimeString().split(" ")[0].slice(0, 5); // Exempel: "08:00"

                

                return { datum: datumStr, tid: tidStr };
            })
            .filter(item => item !== null); // Ta bort null-värden från listan
    } catch (error) {
        console.error("❌ Fel vid hämtning av bokningar:", error);
        return [];
    }
}








// Lista över bakgrundsbilder
const images = ['imegs/1.jpg', 'imegs/2.jpg', 'imegs/3.jpg', 'imegs/4.jpg', 'imegs/logo.png'];
let currentIndex = 0;

function changeBackground() {
    // Kolla om den aktuella bilden är 'logo.png'
    if (images[currentIndex] === 'logo.png') {
        // Gör så att 'logo.png' bakgrundsbilden blir mindre
        document.body.style.backgroundSize = '100%';  // Minska storleken på logo.png
    } else {
        // Sätt till normalt för andra bilder
        document.body.style.backgroundSize = 'cover';  // För alla andra bilder sätt "cover"
    }

    // Byt till nästa bild
    document.body.style.backgroundImage = `url('${images[currentIndex]}')`;

    // Flytta till nästa bild
    currentIndex = (currentIndex + 1) % images.length;
}

// Starta bildväxlingen
setInterval(changeBackground, 3000);

// Kör direkt så att första bilden syns vid start
changeBackground();


function resetForm() {
    document.getElementById("bookingForm").reset(); // Återställer hela formuläret
    document.getElementById("price").textContent = "-"; // Nollställ priset också om det visas någonstans
}

// 🔄 Se till att tider uppdateras när sidan laddas
document.addEventListener("DOMContentLoaded", async () => {
    await loadServices(); 
    await updateTimes(); 
    document.getElementById('bookingDate').addEventListener('change', updateTimes);
});

