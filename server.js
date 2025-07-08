const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 路由 - 提供静态文件（明确指定主页）
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index-element.html'));
});

// 静态文件服务（放在路由后面，避免冲突）
app.use(express.static('.'));

app.get('/vue', (req, res) => {
    res.sendFile(path.join(__dirname, 'index-vue.html'));
});

app.get('/old', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 健康检查端点
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`团队工时管理系统服务器运行在 http://localhost:${PORT}`);
    console.log(`按 Ctrl+C 停止服务器`);
});

module.exports = app;
