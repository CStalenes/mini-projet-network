#!/bin/bash

# Créer un réseau Docker
docker network create todo-app-network

# Créer et démarrer le conteneur MySQL
echo "Démarrage du conteneur MySQL..."
docker run -d \
  --name mysql-todo-db \
  --network todo-app-network \
  -e MYSQL_ROOT_PASSWORD=1234 \
  -e MYSQL_DATABASE=tododb \
  -p 3306:3306 \
  mysql:8.0

# Attendre que MySQL soit prêt
echo "Attente que MySQL soit prêt..."
sleep 15

# Vérifier si MySQL est en cours d'exécution
if ! docker ps | grep -q mysql-todo-db; then
    echo "Erreur: Le conteneur MySQL n'a pas démarré correctement"
    docker logs mysql-todo-db
    exit 1
fi

# Vérifier si MySQL est accessible
echo "Vérification de l'accès à MySQL..."
if ! docker exec mysql-todo-db mysqladmin ping -h"localhost" -P"3306" -u"root" -p"1234" --silent; then
    echo "Erreur: MySQL n'est pas accessible"
    docker logs mysql-todo-db
    exit 1
fi

# Construire l'image de l'application
echo "Construction de l'image de l'application..."
docker build -t todo-app2 .

# Démarrer le conteneur de l'application
echo "Démarrage de l'application..."
docker run -d --name todo-srv2 --network todo-app-network -p 3008:3004 todo-app2



# Vérifier si l'application est en cours d'exécution
if ! docker ps | grep -q todo-srv2; then
    echo "Erreur: L'application n'a pas démarré correctement"
    docker logs todo-srv2
    exit 1
fi

echo "Configuration terminée avec succès !"
echo "L'application est accessible sur http://localhost:3008"