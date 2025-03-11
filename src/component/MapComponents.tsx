import React, { useEffect } from 'react';
import { setData, $dataStore } from '../store';
import { useUnit } from 'effector-react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'

const MapComponent: React.FC = () => {
  const data = useUnit($dataStore);

  useEffect(() => {
    const socket = new WebSocket('ws://127.0.0.1:8050/ws/map');

    // Обработка события открытия соединения
    socket.onopen = () => {
      console.log('WebSocket connected');
    };

    // Обработка сообщения от WebSocket
    socket.onmessage = (event) => {
      const receivedData = JSON.parse(event.data);
      setData(receivedData); // Устанавливаем данные в store
    };

    // Обработка ошибок
    socket.onerror = (event) => {
      console.error('WebSocket error:', event);
    };

    // Обработка закрытия соединения
    socket.onclose = () => {
      console.log('WebSocket connection closed');
    };

    // Функция очистки при размонтировании компонента
    return () => {
      socket.close();
    };
  }, []);

  return (
    <div>
          <MapContainer center={[57.998519,56.249952]} zoom={11} scrollWheelZoom={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {data.map((item) => (
            <Marker key={item.uuid} position={{lat: item.latitude, lng: item.longitude}}><Popup>{item.name}</Popup></Marker>
          ))} 
          </MapContainer>
      <h1>WebSocket Data</h1>
      {data.length > 0 ? (
        <ul>
          {data.map((item, index) => (
            <li key={index}>{JSON.stringify(item)}</li>
          ))}
        </ul>
      ) : (
        <p>No data received yet...</p>
      )}
    </div>
  );
};

export default MapComponent;