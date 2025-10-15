import { Module } from '@nestjs/common';
import { MoviesService } from './movies.service';
import { MoviesController } from './movies.controller';
import { FirebaseService } from '../shared/firebase.service';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [CloudinaryModule],
  controllers: [MoviesController],
  providers: [MoviesService, FirebaseService],
})
export class MoviesModule {}