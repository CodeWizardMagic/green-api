# GREEN-API Test Task

Статическая HTML-страница для тестового задания с вызовами методов GREEN-API:

- `getSettings`
- `getStateInstance`
- `sendMessage`
- `sendFileByUrl`

## Что реализовано

- поля подключения `idInstance` и `ApiTokenInstance`
- отдельное read-only поле для отображения ответа API
- формы для отправки текста и файла по URL
- сохранение введенных значений в `localStorage`
- адаптивный интерфейс без сборки и зависимостей

## Структура проекта

- [index.html]
- [styles.css]
- [app.js]

## Локальный запуск

Страница статическая, поэтому ее можно открыть напрямую файлом `index.html`.

Если нужен локальный сервер:

```powershell
python -m http.server 8080
```

После этого страница будет доступна по адресу [http://localhost:8080](http://localhost:8080).

## Запуск в Docker

Сборка образа:

```powershell
docker build -t green-api-test-task .
```

Запуск контейнера:

```powershell
docker run --rm -p 8080:8080 --name green-api-test-task green-api-test-task
```

После запуска страница будет доступна по адресу [http://localhost:8080](http://localhost:8080).

## Как использовать

1. Введите `idInstance` и `ApiTokenInstance` из личного кабинета GREEN-API.
2. При необходимости укажите ваш `apiUrl` в блоке "Дополнительные параметры".
3. Нажмите `getSettings` или `getStateInstance`.
4. Для `sendMessage` заполните `chatId` и текст сообщения.
5. Для `sendFileByUrl` заполните `chatId`, `urlFile`, `fileName` и при желании `caption`.
6. Ответ метода появится в правом поле.

`chatId` для личного чата можно вводить как номер телефона без `+`:

```text
77001234567
```

Скрипт автоматически преобразует его в формат:

```text
77001234567@c.us
```
