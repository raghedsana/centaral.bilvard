# Använd en officiell Node.js-bild som bas
FROM node:16

# Sätt arbetskatalogen
WORKDIR /app

# Kopiera package.json och package-lock.json först (för att optimera byggningen)
COPY package*.json ./

# Installera beroenden
RUN npm install

# Kopiera övriga filer
COPY . .

# Bygg applikationen
RUN npm run build

# Använd en lättviktsserver för frontend
CMD ["npx", "serve", "-s", "build"]

# Exponera porten (ändra om du har en annan port)
EXPOSE 3000
