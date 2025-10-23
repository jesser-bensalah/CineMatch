import { PartialType } from '@nestjs/mapped-types';
import { CreateMovieDto } from './create-movie.dto';

export class UpdateMovieDto extends PartialType(CreateMovieDto) {
   
    title?: string | undefined;
    overview?: string | undefined;
    posterPath?: string | undefined;
    releaseDate?: string | undefined;
    genreIds?: number[] | undefined;
}
