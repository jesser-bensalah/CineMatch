import * as admin from 'firebase-admin';
export declare class FirebaseService {
    getFirestore(): admin.firestore.Firestore;
    collection(collectionName: string): admin.firestore.CollectionReference;
    doc(collectionName: string, docId: string): admin.firestore.DocumentReference;
    create(collectionName: string, data: any): Promise<admin.firestore.DocumentReference>;
    update(collectionName: string, docId: string, data: any): Promise<void>;
    findOneByField(collectionName: string, field: string, value: any): Promise<any>;
    findAll(collectionName: string, whereClause?: {
        field: string;
        operator: any;
        value: any;
    }): Promise<any[]>;
    findById(collectionName: string, docId: string): Promise<any>;
}
