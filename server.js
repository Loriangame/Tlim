const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Разрешаем запросы с любых доменов
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Файл для хранения данных
const DATA_FILE = path.join(__dirname, 'data.json');

// Загрузка данных из файла
function loadData() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (e) {
        console.log('Ошибка загрузки данных, создаём новые');
    }
    return { users: [], chats: [], messages: {} };
}

// Сохранение данных в файл
function saveData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// ===== API РОУТЫ =====

// Регистрация
app.post('/api/register', (req, res) => {
    const { name, email, password } = req.body;
    const data = loadData();
    
    // Проверка, существует ли пользователь
    if (data.users.find(u => u.name === name || u.email === email)) {
        return res.status(400).json({ error: 'Пользователь уже существует' });
    }
    
    const user = {
        id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
        name: name,
        email: email,
        password: password,
        created: Date.now()
    };
    
    data.users.push(user);
    saveData(data);
    
    res.json({ success: true, user: { id: user.id, name: user.name, email: user.email } });
});

// Вход
app.post('/api/login', (req, res) => {
    const { name, password } = req.body;
    const data = loadData();
    
    const user = data.users.find(u => u.name === name && u.password === password);
    if (!user) {
        return res.status(400).json({ error: 'Неверное имя или пароль' });
    }
    
    res.json({ success: true, user: { id: user.id, name: user.name, email: user.email } });
});

// Получить всех пользователей
app.get('/api/users', (req, res) => {
    const data = loadData();
    res.json(data.users.map(u => ({ id: u.id, name: u.name })));
});

// Получить чаты пользователя
app.get('/api/chats/:userId', (req, res) => {
    const data = loadData();
    const userId = req.params.userId;
    
    const userChats = data.chats.filter(c => c.participants.includes(userId));
    res.json(userChats);
});

// Создать чат
app.post('/api/chats', (req, res) => {
    const { name, type, participants, creator, isPrivate } = req.body;
    const data = loadData();
    
    const chat = {
        id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
        name: name,
        type: type || 'chat',
        participants: participants,
        isPrivate: isPrivate || false,
        created: Date.now(),
        creator: creator,
        messages: []
    };
    
    data.chats.push(chat);
    saveData(data);
    res.json(chat);
});

// Отправить сообщение
app.post('/api/messages', (req, res) => {
    const { chatId, sender, text, video, file, audio } = req.body;
    const data = loadData();
    
    const chat = data.chats.find(c => c.id === chatId);
    if (!chat) {
        return res.status(404).json({ error: 'Чат не найден' });
    }
    
    const message = {
        id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
        sender: sender,
        text: text || '',
        video: video || null,
        file: file || null,
        audio: audio || null,
        time: Date.now()
    };
    
    chat.messages.push(message);
    saveData(data);
    res.json(message);
});

// Получить сообщения чата
app.get('/api/messages/:chatId', (req, res) => {
    const data = loadData();
    const chat = data.chats.find(c => c.id === req.params.chatId);
    if (!chat) {
        return res.status(404).json({ error: 'Чат не найден' });
    }
    res.json(chat.messages);
});

// Статический файл для фронтенда
app.use(express.static('.'));

app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
});