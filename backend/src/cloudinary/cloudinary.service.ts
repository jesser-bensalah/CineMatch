import { Injectable, Logger } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(private configService: ConfigService) {
    this.initializeCloudinary();
  }

  private initializeCloudinary() {
    try {
      cloudinary.config({
        cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
        api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
        api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
        secure: true,
      });
      this.logger.log('Cloudinary configured successfully');
    } catch (error) {
      this.logger.error('Error configuring Cloudinary:', error);
      throw error;
    }
  }

  async uploadImage(file: Express.Multer.File): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!file || !file.buffer) {
        reject(new Error('No file provided'));
        return;
      }

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: 'cine-match/profiles',
          transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' },
            { quality: 'auto:good' },
            { format: 'webp' }
          ],
        },
        (error, result) => {
          if (error) {
            this.logger.error('Cloudinary upload error:', error);
            reject(error);
          } else if (result) {
            this.logger.log(`Image uploaded successfully: ${result.secure_url}`);
            resolve(result.secure_url);
          } else {
            reject(new Error('Upload failed without error'));
          }
        }
      );

      uploadStream.end(file.buffer);
    });
  }

  async uploadMovieImage(file: Express.Multer.File): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!file || !file.buffer) {
        reject(new Error('No file provided'));
        return;
      }

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: 'cine-match/movies',
          transformation: [
            { width: 500, height: 750, crop: 'fill' },
            { quality: 'auto:good' },
            { format: 'webp' }
          ],
        },
        (error, result) => {
          if (error) {
            this.logger.error('Cloudinary movie image upload error:', error);
            reject(error);
          } else if (result) {
            this.logger.log(`Movie image uploaded successfully: ${result.secure_url}`);
            resolve(result.secure_url);
          } else {
            reject(new Error('Upload failed without error'));
          }
        }
      );

      uploadStream.end(file.buffer);
    });
  }
}