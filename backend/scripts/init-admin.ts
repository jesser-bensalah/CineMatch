import * as admin from 'firebase-admin';
import * as bcrypt from 'bcryptjs';
import * as path from 'path';
import * as fs from 'fs';


const serviceAccountPath = path.join(__dirname, '..', 'firebase-service-account.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('Fichier firebase-service-account.json non trouvé');
  console.log(' Placez le fichier dans le dossier backend/');
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
});

const db = admin.firestore();

async function initializeAdmin() {
  try {
    console.log(' Initialisation de l\'administrateur par défaut...');

    
    const adminSnapshot = await db.collection('users')
      .where('email', '==', 'admin@cinematch.com')
      .get();

    if (!adminSnapshot.empty) {
      console.log(' Administrateur existe déjà');
      return;
    }

   
    const hashedPassword = await bcrypt.hash('Admin123!', 12);

    // Créer l'admin
    const adminData = {
      nom: 'Système',
      prenom: 'Admin',
      age: 25,
      email: 'admin@cinematch.com',
      password: hashedPassword,
      photoUrl: '',
      isActive: true,
      role: 'admin',
      favorites: []
    };

    const adminRef = await db.collection('users').add(adminData);
    
    console.log(' Administrateur créé avec succès');
    console.log('Email: admin@cinematch.com');
    console.log(' Mot de passe: Admin123!');
    console.log(' ID:', adminRef.id);

  } catch (error) {
    console.error(' Erreur lors de la création de l\'admin:', error);
  } finally {
    process.exit();
  }
}

initializeAdmin();