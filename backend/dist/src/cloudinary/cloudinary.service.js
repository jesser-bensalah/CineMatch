"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var CloudinaryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudinaryService = void 0;
const common_1 = require("@nestjs/common");
const cloudinary_1 = require("cloudinary");
const config_1 = require("@nestjs/config");
let CloudinaryService = CloudinaryService_1 = class CloudinaryService {
    configService;
    logger = new common_1.Logger(CloudinaryService_1.name);
    constructor(configService) {
        this.configService = configService;
        this.initializeCloudinary();
    }
    initializeCloudinary() {
        try {
            cloudinary_1.v2.config({
                cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME'),
                api_key: this.configService.get('CLOUDINARY_API_KEY'),
                api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
                secure: true,
            });
            this.logger.log('Cloudinary configured successfully');
        }
        catch (error) {
            this.logger.error('Error configuring Cloudinary:', error);
            throw error;
        }
    }
    async uploadImage(file) {
        return new Promise((resolve, reject) => {
            if (!file || !file.buffer) {
                reject(new Error('No file provided'));
                return;
            }
            const uploadStream = cloudinary_1.v2.uploader.upload_stream({
                resource_type: 'image',
                folder: 'cine-match/profiles',
                transformation: [
                    { width: 400, height: 400, crop: 'fill', gravity: 'face' },
                    { quality: 'auto:good' },
                    { format: 'webp' }
                ],
            }, (error, result) => {
                if (error) {
                    this.logger.error('Cloudinary upload error:', error);
                    reject(error);
                }
                else if (result) {
                    this.logger.log(`Image uploaded successfully: ${result.secure_url}`);
                    resolve(result.secure_url);
                }
                else {
                    reject(new Error('Upload failed without error'));
                }
            });
            uploadStream.end(file.buffer);
        });
    }
    async uploadMovieImage(file) {
        return new Promise((resolve, reject) => {
            if (!file || !file.buffer) {
                reject(new Error('No file provided'));
                return;
            }
            const uploadStream = cloudinary_1.v2.uploader.upload_stream({
                resource_type: 'image',
                folder: 'cine-match/movies',
                transformation: [
                    { width: 500, height: 750, crop: 'fill' },
                    { quality: 'auto:good' },
                    { format: 'webp' }
                ],
            }, (error, result) => {
                if (error) {
                    this.logger.error('Cloudinary movie image upload error:', error);
                    reject(error);
                }
                else if (result) {
                    this.logger.log(`Movie image uploaded successfully: ${result.secure_url}`);
                    resolve(result.secure_url);
                }
                else {
                    reject(new Error('Upload failed without error'));
                }
            });
            uploadStream.end(file.buffer);
        });
    }
};
exports.CloudinaryService = CloudinaryService;
exports.CloudinaryService = CloudinaryService = CloudinaryService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], CloudinaryService);
//# sourceMappingURL=cloudinary.service.js.map