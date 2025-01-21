// Импортируем библиотеку pg
import pkg from 'pg';
const { Client } = pkg;

// Настраиваем параметры подключения
const config = {
  host: 'localhost',
  port: 5432,
  user: 'student',
  password: 'student',
  database: 'swag_temp'
};

// Создаем экземпляр клиента
const client = new Client(config);

// Функция для подключения к базе данных и обработки результата
async function connectToDatabase() {
  try {
    // Подключаемся к базе данных
    await client.connect();
    console.log('Подключение к БД успешно установлено');
  } catch (err) {
    console.error('Ошибка подключения:', err.stack);
  } finally {
    // Закрываем соединение
    await client.end();
  }
}

// Вызываем функцию подключения
connectToDatabase();