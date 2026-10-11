export type Fleet = 'I.E' | 'V.E' | 'Other';

export type Vehicle = {
  id: string;
  fleet: Fleet;
  brand: string;
  model: string;
  plate: string;
  vin: string;
  mileage: number;
  image: string;
  status: 'В норме' | 'Скоро ТО' | 'Внимание';
  kind: 'Автомобиль' | 'Мотоцикл';
};
