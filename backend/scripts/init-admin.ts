import * as admin from 'firebase-admin';
import * as bcrypt from 'bcryptjs';
import { config } from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';


const envPath = path.join(process.cwd(), '.env');
console.log(' Chemin du fichier .env:', envPath);

async function initializeFirebase() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;



  if (!projectId || !privateKey || !clientEmail) {
    throw new Error('Firebase configuration is missing in environment variables');
  }

  const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        privateKey: formattedPrivateKey,
        clientEmail,
      }),
      databaseURL: `https://${projectId}.firebaseio.com`
    });
  }

  return admin.firestore();
}

async function initializeAdmin() {
  try {
    console.log(' Initialisation de l\'administrateur par défaut...');

    const db = await initializeFirebase();

    const adminSnapshot = await db.collection('users')
      .where('email', '==', 'admin@cinematch.com')
      .get();

    if (!adminSnapshot.empty) {
      console.log(' Administrateur existe déjà');
      return;
    }

    const hashedPassword = await bcrypt.hash('Admin123!', 12);

    const adminData = {
      nom: 'Système',
      prenom: 'Admin',
      age: 25,
      email: 'admin@cinematch.com',
      password: hashedPassword,
      photoUrl: '',
      isActive: true,
      role: 'admin',
      favorites: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const adminRef = await db.collection('users').add(adminData);
    
    console.log(' Administrateur créé avec succès');
    console.log(' Email: admin@cinematch.com');
    console.log(' Mot de passe: Admin123!');
    console.log(' ID:', adminRef.id);

  } catch (error) {
    console.error(' Erreur lors de la création de l\'admin:', error);
  } finally {
    process.exit();
  }
}

initializeAdmin();