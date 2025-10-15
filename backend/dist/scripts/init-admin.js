"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const admin = __importStar(require("firebase-admin"));
const bcrypt = __importStar(require("bcryptjs"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
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
    }
    catch (error) {
        console.error(' Erreur lors de la création de l\'admin:', error);
    }
    finally {
        process.exit();
    }
}
initializeAdmin();
//# sourceMappingURL=init-admin.js.map