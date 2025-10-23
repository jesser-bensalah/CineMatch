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
    const data = doc.data();
    
  
    if (!data) {
      return null;
    }
    
    return {
      id: doc.id,
      nom: data.nom || '',
      prenom: data.prenom || '',
      age: data.age || 0,
      email: data.email || '',
      password: data.password || '',
      photoUrl: data.photoUrl || '',
      isActive: data.isActive !== undefined ? data.isActive : true,
      role: data.role || 'user',
      favorites: data.favorites || [],
      createdAt: data.createdAt || '',
      updatedAt: data.updatedAt || ''
    };
  }

  async findAll(collectionName: string, whereClause?: { field: string; operator: any; value: any }): Promise<any[]> {
    let query: admin.firestore.Query = this.collection(collectionName);

    if (whereClause) {
      query = query.where(whereClause.field, whereClause.operator, whereClause.value);
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
      };
    });
  }

  async findById(collectionName: string, docId: string): Promise<any> {
    const doc = await this.doc(collectionName, docId).get();
    
    if (!doc.exists) {
      return null;
    }

    const data = doc.data();
    
    // Vérification que data n'est pas undefined
    if (!data) {
      return null;
    }

    return {
      id: doc.id,
      nom: data.nom || '',
      prenom: data.prenom || '',
      age: data.age || 0,
      email: data.email || '',
      password: data.password || '',
      photoUrl: data.photoUrl || '',
      isActive: data.isActive !== undefined ? data.isActive : true,
      role: data.role || 'user',
      favorites: data.favorites || [],
      createdAt: data.createdAt || '',
      updatedAt: data.updatedAt || ''
    };
  }
}