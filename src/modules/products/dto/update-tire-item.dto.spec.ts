import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { UpdateTireItemDto } from '../dto/update-tire-item.dto';

describe('UpdateTireItemDto', () => {
  it('convierte valores opcionales vacíos en null', () => {
    const dto = plainToInstance(UpdateTireItemDto, {
      prefix: '',
      aspectRatio: '',
      loadIndexFront: '',
      loadIndexRear: '',
      speedRating: '',
      loadRange: '',
      plies: '',
    });

    expect(dto).toMatchObject({
      prefix: null,
      aspectRatio: null,
      loadIndexFront: null,
      loadIndexRear: null,
      speedRating: null,
      loadRange: null,
      plies: null,
    });
  });

  it('conserva valores opcionales válidos', () => {
    const dto = plainToInstance(UpdateTireItemDto, {
      aspectRatio: 60,
      loadIndexFront: 100,
      loadIndexRear: 98,
      speedRating: 'H',
      plies: 2,
    });

    expect(dto).toMatchObject({
      aspectRatio: 60,
      loadIndexFront: 100,
      loadIndexRear: 98,
      speedRating: 'H',
      plies: 2,
    });
  });
});
