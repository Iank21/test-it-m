import { createStore, createEvent } from 'effector';

// Событие для обновления данных
export const setData = createEvent<any[]>();

// Хранилище данных
export const $dataStore = createStore<any[]>([]).on(setData, (_, data) => {
  // Если данные уже есть, не обновляем, иначе записываем
  if (_.length === 0) {
    return data;
  }
  return _;
});