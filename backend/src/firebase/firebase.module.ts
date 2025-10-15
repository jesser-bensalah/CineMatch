import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Global()
@Module({})
export class FirebaseModule {
  constructor(private configService: ConfigService) {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    if (admin.apps.length === 0) {
      const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
      const privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY');
      const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');

      if (!projectId || !privateKey || !clientEmail) {
        throw new Error('Firebase configuration is missing');
      }

      const serviceAccount = {
        projectId,
        privateKey: privateKey.replace(/\\n/g, '\n'),
        clientEmail,
      };

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        databaseURL: `https://${serviceAccount.projectId}.firebaseio.com`,
      });

      
      const db = admin.firestore();
      db.settings({
        ignoreUndefinedProperties: true,
      });

      console.log(' Firebase initialized successfully');
    }
  }
}