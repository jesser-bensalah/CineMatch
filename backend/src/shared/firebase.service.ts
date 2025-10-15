/*import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { ConfigService } from '@nestjs/config';

interface ServiceAccount {
  projectId: string;
  privateKey: string;
  clientEmail: string;
}

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private db: admin.firestore.Firestore;
  private initialized = false;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.initializeFirebase();
  }

  private async initializeFirebase() {
    try {
      if (this.initialized) {
        return; // Déjà initialisé
      }

      if (admin.apps.length === 0) {
        const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
        const privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY');
        const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');

        if (!projectId || !privateKey || !clientEmail) {
          throw new Error('Firebase configuration is missing');
        }

        const serviceAccount: ServiceAccount = {
          projectId,
          privateKey: privateKey.replace(/\\n/g, '\n'),
          clientEmail,
        };

        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
          databaseURL: `https://${serviceAccount.projectId}.firebaseio.com`,
        });

        this.logger.log('Firebase Admin initialized successfully');
      }

      // Initialiser Firestore une seule fois
      this.db = admin.firestore();
      
      // Configurer les settings seulement si pas déjà fait
      if (!this.initialized) {
        this.db.settings({
          ignoreUndefinedProperties: true,
        });
        this.initialized = true;
      }

      this.logger.log('Firestore configured successfully');

    } catch (error) {
      this.logger.error('Error initializing Firebase:', error);
      throw error;
    }
  }

  getFirestore(): admin.firestore.Firestore {
    if (!this.db) {
      throw new Error('Firestore not initialized');
    }
    return this.db;
  }

  collection(collectionName: string): admin.firestore.CollectionReference {
    return this.getFirestore().collection(collectionName);
  }

  doc(collectionName: string, docId: string): admin.firestore.DocumentReference {
    return this.collection(collectionName).doc(docId);
  }

  async create(collectionName: string, data: any): Promise<admin.firestore.DocumentReference> {
    const docRef = this.collection(collectionName).doc();
    await docRef.set({
      ...data,
      id: docRef.id,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return docRef;
  }

  async update(collectionName: string, docId: string, data: any): Promise<void> {
    await this.doc(collectionName, docId).update({
      ...data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  async findOneByField(collectionName: string, field: string, value: any): Promise<any> {
    const snapshot = await this.collection(collectionName)
      .where(field, '==', value)
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    };
  }

  async findAll(collectionName: string, whereClause?: { field: string; operator: any; value: any }): Promise<any[]> {
    let query: admin.firestore.Query = this.collection(collectionName);
    
    if (whereClause) {
      query = query.where(whereClause.field, whereClause.operator, whereClause.value);
    }
    
    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  }
}*/

import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService {
  getFirestore(): admin.firestore.Firestore {
    return admin.firestore();
  }

  collection(collectionName: string): admin.firestore.CollectionReference {
    return this.getFirestore().collection(collectionName);
  }

  doc(collectionName: string, docId: string): admin.firestore.DocumentReference {
    return this.collection(collectionName).doc(docId);
  }

  async create(collectionName: string, data: any): Promise<admin.firestore.DocumentReference> {
    const docRef = this.collection(collectionName).doc();
    await docRef.set({
      ...data,
      id: docRef.id,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return docRef;
  }

  async update(collectionName: string, docId: string, data: any): Promise<void> {
    await this.doc(collectionName, docId).update({
      ...data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  async findOneByField(collectionName: string, field: string, value: any): Promise<any> {
    const snapshot = await this.collection(collectionName)
      .where(field, '==', value)
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    };
  }

  async findAll(collectionName: string, whereClause?: { field: string; operator: any; value: any }): Promise<any[]> {
    let query: admin.firestore.Query = this.collection(collectionName);
    
    if (whereClause) {
      query = query.where(whereClause.field, whereClause.operator, whereClause.value);
    }
    
    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  }
}