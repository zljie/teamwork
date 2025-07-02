const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3002;

// 提供public目录的静态文件
app.use(express.static(path.join(__dirname, 'public')));

// 路由配置
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index-element.html'));
});

app.get('/vue', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index-vue.html'));
});

app.get('/old', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 健康检查
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        mode: 'public-directory'
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Public目录测试服务器运行在 http://localhost:${PORT}`);
    console.log(`📁 服务目录: ${path.join(__dirname, 'public')}`);
    console.log(`🌐 访问地址:`);
    console.log(`   主页 (Element Plus): http://localhost:${PORT}/`);
    console.log(`   Vue基础版本: http://localhost:${PORT}/vue`);
    console.log(`   原生JS版本: http://localhost:${PORT}/old`);
    console.log(`按 Ctrl+C 停止服务器`);
});

module.exports = app;
