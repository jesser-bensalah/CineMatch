import { ConfigService } from '@nestjs/config';
export declare class FirebaseModule {
    private configService;
    constructor(configService: ConfigService);
    private initializeFirebase;
}
