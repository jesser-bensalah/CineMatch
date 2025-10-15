import { IsString, IsNotEmpty, IsOptional, IsArray, IsDateString, IsNumber } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreateMovieDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  overview?: string;

  @IsString()
  @IsOptional()
  posterPath?: string;

  @IsDateString()
  @IsOptional()
  releaseDate?: string;

  @IsArray()
  @IsNumber({}, { each: true })
  @Transform(({ value }) => {
    // Si value est déjà un tableau, le retourner directement
    if (Array.isArray(value)) {
      return value.map(id => Number(id)).filter(id => !isNaN(id) && id > 0);
    }
    // Si c'est une chaîne unique, la convertir en tableau
    if (typeof value === 'string') {
      try {
        // Essayer de parser si c'est un JSON
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) 
          ? parsed.map(id => Number(id)).filter(id => !isNaN(id) && id > 0)
          : [Number(parsed)].filter(id => !isNaN(id) && id > 0);
      } catch (e) {
        // Si ce n'est pas un JSON, essayer de splitter par virgule
        return value.split(',')
          .map(id => Number(id.trim()))
          .filter(id => !isNaN(id) && id > 0);
      }
    }
    // Par défaut, retourner un tableau vide
    return [];
  })
  genreIds: number[];

  @IsString()
  @IsOptional()
  backdropPath?: string;

  @IsString()
  @IsOptional()
  originalLanguage?: string;
}