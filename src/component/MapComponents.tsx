import React, { useEffect } from 'react';
import { setData, $dataStore } from '../store';
import { useUnit } from 'effector-react';
import { LayerGroup, LayersControl, MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import L from 'leaflet';

const MapComponent: React.FC = () => {
  // Использует функцию useUnit из библиотеки Effector для получения текущего состояния из хранилища $dataStore
  const data = useUnit($dataStore);

  // Используется хук useEffect, чтобы выполнить код при монтировании компонента
  useEffect(() => {
    const socket = new WebSocket('ws://127.0.0.1:8050/ws/map');

    socket.onopen = () => {
      console.log('WebSocket connected');
    };

    // Когда сервер отправляет сообщение, данные из него парсятся (преобразуются из строки в объект) 
    // и передаются в функцию setData, которая обновляет данные в хранилище $dataStore
    socket.onmessage = (event) => {
      const receivedData = JSON.parse(event.data);
      setData(receivedData); // Устанавливаем данные в store
    };

    socket.onerror = (event) => {
      console.error('WebSocket error:', event);
    };

    socket.onclose = () => {
      console.log('WebSocket connection closed');
    };

    // Закрытие соединения при размонтировании компонента
    return () => {
      socket.close();
    };
  }, []);

  // Получение массива для отображения на слое с температурой 
  const temperature = data
  .filter(item => item.is_active) // Фильтруем по полю is_active, чтобы убрать не активные объекты 
  .map(item => ({
    uuid: item.uuid,
    name: item.name,
    is_active: item.is_active,
    latitude: item.latitude,
    longitude: item.longitude,
    sensor: {
      is_active: item.sensor.is_active,
      supply_temperature: item.sensor.supply_temperature,
      return_temperature: item.sensor.return_temperature,
      correct_supply_temperature: item.sensor.correct_supply_temperature,
    }
  }));

  // Получение массива для отображения на слое с давлением 
  const pressure = data
  .filter(item => item.is_active) // фильтруем по полю is_active, чтобы убрать не активные объекты 
  .map(item => ({
    uuid: item.uuid,
    name: item.name,
    is_active: item.is_active,
    latitude: item.latitude,
    longitude: item.longitude,
    sensor: {
      is_active: item.sensor.is_active,
      pressure: item.sensor.pressure,
      correct_pressure: item.sensor.correct_pressure,
    }
  }));

  //Определяем цвет маркера в зависимости от значений для температуры
  const getTemperatureMarkerIcon = (item: any) => {
    let color = ''; 
    if (item.sensor.is_active && item.sensor.correct_supply_temperature) {
      color = 'green'; // Зеленый
    } else if ((item.sensor.is_active && !item.sensor.correct_supply_temperature) || (!item.sensor.is_active && item.sensor.correct_supply_temperature)) {
      color = 'blue'; // Синий  
    } else if (!item.sensor.is_active && !item.sensor.correct_supply_temperature) {
      color = 'red'; // Красный
    }
    
    // Создание иконки
    return L.divIcon({
      className: 'custom-icon',
      html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white;"></div>`,
      iconSize: [20, 20], 
      iconAnchor: [10, 10],
    });
  };

  //Определяем цвет маркера в зависимости от значений для давления
  const getPressureMarkerIcon = (item: any) => {
    let iconUrl = '';
    if (item.sensor.is_active && item.sensor.correct_pressure) {
      iconUrl = './icon-green.png'; // Зеленый 
    } else if ((item.sensor.is_active && !item.sensor.correct_pressure) || (!item.sensor.is_active && item.sensor.correct_pressure)) {
      iconUrl = './icon-blue.png'; // Синий 
    } else if (!item.sensor.is_active && !item.sensor.correct_pressure) {
      iconUrl = './icon-red.png'; // Красный
    }
    
    // Создание иконки
    return L.icon({
      className: 'img-icon',
      iconUrl: iconUrl,
      iconSize: [45, 45], 
      iconAnchor: [20, 45],
    });
  };

  return (
    <div className='container'>
      <div className='map-container'>
        <MapContainer center={[57.998519,56.249952]} zoom={11} scrollWheelZoom={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LayersControl position="topright">
            <LayersControl.Overlay checked name="Температура теплоносителя и ее отклонение">
              <LayerGroup>
                {temperature.map((item) => (
                    <Marker key={item.uuid} position={{lat: item.latitude, lng: item.longitude}} icon={getTemperatureMarkerIcon(item)}>
                      <Popup>
                        <p><b>Название:</b> {item.name}</p>
                        <p>{item.latitude}{item.longitude}</p>
                        <p><b>Активен ли прибор учета:</b> {item.sensor.is_active ? 'Да' : 'Нет'}</p>
                        <p><b>Температура теплоносителя в подающем трубопроводе:</b> {item.sensor.supply_temperature}</p>
                        <p><b>Температура теплоносителя в обратном трубопроводе:</b> {item.sensor.return_temperature}</p>
                        <p><b>Соответствует ли температура теплоносителя в
                        подающем трубопроводе значению из договора:</b> {item.sensor.correct_supply_temperature ? 'Да' : 'Нет'}</p>
                      </Popup>
                    </Marker>
                  ))} 
              </LayerGroup>
            </LayersControl.Overlay>
            <LayersControl.Overlay checked name="Давление и его отклонение">
              <LayerGroup>
                {pressure.map((item) => (
                  <Marker key={item.uuid} position={{lat: item.latitude, lng: item.longitude}} icon={getPressureMarkerIcon(item)}>
                    <Popup offset={[1, -20]}>
                      <p><b>Название:</b> {item.name}</p>
                      <p><b>Активен ли прибор учета:</b> {item.sensor.is_active ? 'Да' : 'Нет'}</p>
                      <p><b>Данные о текущем давлении:</b> {item.sensor.pressure}</p>
                      <p><b>Cоответствует ли давление значению из договора:</b> {item.sensor.correct_pressure ? 'Да' : 'Нет'}</p>
                    </Popup>
                  </Marker>
                  ))} 
              </LayerGroup>
            </LayersControl.Overlay>
          </LayersControl>
        </MapContainer>
      </div>
      <div className='about-text'>
        <p>Легенда для карты:</p>
          <ul>
            <li>Зеленый цвет маркера - прибор активен и значение соответствует договору</li>
            <li>Синий цвет маркера - один из параметров не соответствует норме</li>
            <li>Красный цвет маркера - оба параметра не соответствуют норме</li>
          </ul>
      </div>
    </div>
  );
};

export default MapComponent;