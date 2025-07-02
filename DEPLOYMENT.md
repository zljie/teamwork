# 部署指南

本文档详细说明如何将团队工时管理系统部署到Vercel。

## 🚀 快速部署到Vercel

### 方法一：通过GitHub（推荐）

1. **将代码推送到GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/workcalc.git
   git push -u origin main
   ```

2. **在Vercel中导入项目**
   - 访问 [vercel.com](https://vercel.com)
   - 点击 "New Project"
   - 选择你的GitHub仓库
   - 点击 "Import"

3. **配置项目设置**
   - Framework Preset: 选择 "Other"
   - Root Directory: 保持默认 "./"
   - Build Command: 留空（静态网站无需构建）
   - Output Directory: 留空
   - Install Command: `npm install`

4. **部署**
   - 点击 "Deploy"
   - 等待部署完成

### 方法二：通过Vercel CLI

1. **安装Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **登录Vercel**
   ```bash
   vercel login
   ```

3. **部署项目**
   ```bash
   vercel
   ```

4. **跟随提示完成配置**
   - Set up and deploy? Yes
   - Which scope? 选择你的账户
   - Link to existing project? No
   - What's your project's name? workcalc
   - In which directory is your code located? ./

## 📁 项目文件说明

### 核心文件
- `index-element.html` - Element Plus版本（主页面）
- `index-vue.html` - Vue基础版本
- `index.html` - 原生JS版本
- `element-app.js` - Element Plus版本逻辑
- `vue-app.js` - Vue基础版本逻辑
- `script.js` - 原生JS版本逻辑

### 配置文件
- `vercel.json` - Vercel部署配置
- `package.json` - 项目依赖和脚本
- `.gitignore` - Git忽略文件

### 样式文件
- `vue-styles.css` - Vue版本样式
- `styles.css` - 原生版本样式

## 🔧 Vercel配置说明

`vercel.json` 文件配置了路由规则：

```json
{
  "version": 2,
  "routes": [
    {
      "src": "/",
      "dest": "/index-element.html"
    },
    {
      "src": "/vue",
      "dest": "/index-vue.html"
    },
    {
      "src": "/old",
      "dest": "/index.html"
    }
  ]
}
```

这样配置后：
- 主页 `/` 显示Element Plus版本
- `/vue` 显示Vue基础版本
- `/old` 显示原生JS版本

## 🌐 访问地址

部署成功后，你将获得以下访问地址：

- **主页**: `https://your-project.vercel.app/`
- **Vue版本**: `https://your-project.vercel.app/vue`
- **原生版本**: `https://your-project.vercel.app/old`

## 🔄 自动部署

配置GitHub集成后，每次推送代码到main分支都会自动触发部署：

```bash
git add .
git commit -m "Update features"
git push origin main
```

## 📊 环境变量

本项目是纯前端应用，不需要配置环境变量。所有数据都存储在浏览器的localStorage中。

## 🐛 常见问题

### 1. 部署失败
- 检查 `vercel.json` 文件格式是否正确
- 确保所有引用的文件都存在
- 查看Vercel部署日志获取详细错误信息

### 2. 页面无法访问
- 检查路由配置是否正确
- 确保HTML文件路径正确

### 3. 静态资源加载失败
- 检查CSS和JS文件路径
- 确保CDN资源可以正常访问

### 4. 功能异常
- 打开浏览器开发者工具查看控制台错误
- 检查localStorage是否被禁用

## 📱 移动端适配

项目已经做了响应式设计，在移动设备上也能正常使用。如果需要进一步优化移动端体验，可以：

1. 调整表格列宽
2. 优化触摸操作
3. 调整字体大小

## 🔒 安全说明

- 本项目是纯前端应用，数据存储在用户浏览器本地
- 不涉及服务器端数据存储，无需考虑服务器安全
- 建议定期导出数据进行备份

## 📈 性能优化

- 所有资源都通过CDN加载，加载速度快
- 使用Vue 3的响应式系统，性能优异
- Element Plus组件按需加载，减少包体积

## 🎯 自定义域名

在Vercel项目设置中可以配置自定义域名：

1. 进入项目设置
2. 点击 "Domains"
3. 添加你的域名
4. 按照提示配置DNS记录

## 📞 技术支持

如果在部署过程中遇到问题，可以：

1. 查看Vercel官方文档
2. 检查项目的GitHub Issues
3. 联系项目维护者
