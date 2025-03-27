# Utiliser une image Node.js officielle
FROM node:16

# Créer un répertoire de travail
WORKDIR /usr/src/app

# Copier package.json et package-lock.json
COPY package*.json ./

# Installer les dépendances
RUN npm install

#Copier le fichier .env
COPY .env ./

# Copier le reste des fichiers de l'application
COPY . .

# Exposer le port
EXPOSE 3004

# Commande pour démarrer l'application
CMD ["node", "server.js"]