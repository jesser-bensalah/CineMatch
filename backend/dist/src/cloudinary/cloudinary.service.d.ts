import { ConfigService } from '@nestjs/config';
export declare class CloudinaryService {
    private configService;
    private readonly logger;
    constructor(configService: ConfigService);
    private initializeCloudinary;
    uploadImage(file: Express.Multer.File): Promise<string>;
    uploadMovieImage(file: Express.Multer.File): Promise<string>;
}
