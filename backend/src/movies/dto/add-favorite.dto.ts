import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class AddFavoriteDto {
  @IsString()
  @IsNotEmpty()
  movieId: string;

  @IsString()
  @IsNotEmpty()
  movieTitle: string;

  @IsString()
  @IsOptional()
  moviePoster?: string;
}