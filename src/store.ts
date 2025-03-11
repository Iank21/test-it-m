import { createStore, createEvent } from 'effector';

export const setData = createEvent<any[]>();

export const $dataStore = createStore<any[]>([]).on(setData, (_, data) => {
  return data;
});