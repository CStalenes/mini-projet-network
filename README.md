Objectif:

Ce projet montre comment utiliser Docker pour créer deux conteneurs :

Un conteneur MySQL pour la base de données.

Un conteneur Node.js qui s'y connecte via un réseau Docker.

1️⃣ Cree Dokerfile et package json :
  Premièrment on va décrire dans notre Dockerfile le setup pour cree notre application node d'apres une image officiel node. 
  Puis on va cree notre package json et mettre les dépendances.
  
2️⃣ Créer le fichier docker-setup.sh :
  Ensuite pour simplifier la création des conteneur on va cree un script qui va cree et demarrer notre conteneur  par étape en mode bash : 
    * Cree le réseau Docker personnalisé pour la communication inter-conteneurs
    * Configurer l'utilisateur, mot de passe et la base de donnée mysql de notre conteneur
    * Mappage des ports pour accès externe 
    * Construire l'image de notre application node
    * Demarrer le conteneur de l'application
  
3️⃣ Sécurisation des fichiers sensibles:
   Pour plus de sécurité on a cree un dockerignore pour mettre nos fichier sensible afin qu'il ne soit pas visible. On y aussi cree un .env afin 
   de protéger nos variables d'environnement.

4️⃣ Création du template:
  Pour avoir un visuel de notre application on a créer un dossier public pour créer notre todolist


✅ Vérification

Accéder à http://localhost:3000 pour voir l'application fonctionner.

Vérifier la connexion MySQL avec docker logs mysql_container.

📌 Commande sur les conteneurs:
      docker stop app mysql-container
      docker rm app mysql-container
      docker network rm app-network

📌 Nettoyer les conteneurs:
    docker-compose down
    

