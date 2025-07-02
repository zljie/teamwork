#!/usr/bin/env node

// 构建脚本 - 将源文件复制到public目录
const fs = require('fs');
const path = require('path');

console.log('🏗️  开始构建团队工时管理系统...');

// 确保public目录存在
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
    console.log('📁 创建public目录');
}

// 需要复制的文件列表
const filesToCopy = [
    'index-element.html',
    'index-vue.html', 
    'index.html',
    'element-app.js',
    'vue-app.js',
    'script.js',
    'vue-styles.css',
    'styles.css'
];

// 复制文件
filesToCopy.forEach(file => {
    const srcPath = path.join(__dirname, file);
    const destPath = path.join(publicDir, file);
    
    if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`✅ 复制 ${file}`);
    } else {
        console.warn(`⚠️  文件不存在: ${file}`);
    }
});

// 创建public目录下的index.html（重定向到Element Plus版本）
const indexContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>团队工时管理系统</title>
    <meta http-equiv="refresh" content="0; url=./index-element.html">
</head>
<body>
    <p>正在跳转到团队工时管理系统...</p>
    <p>如果没有自动跳转，请<a href="./index-element.html">点击这里</a></p>
</body>
</html>`;

fs.writeFileSync(path.join(publicDir, 'index.html'), indexContent);
console.log('✅ 创建主页重定向文件');

console.log('🎉 构建完成！文件已复制到public目录');
console.log('📁 public目录内容:');
fs.readdirSync(publicDir).forEach(file => {
    console.log(`   - ${file}`);
});
