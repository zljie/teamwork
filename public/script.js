// 团队工时管理系统 - 主要JavaScript文件

class TimesheetManager {
    constructor() {
        this.data = {
            persons: [],
            projects: [],
            timesheetData: {},
            currentMonth: ''
        };
        this.selectedUsers = new Set();
        this.currentImportType = null;
        this.selectedEmployees = new Set(); // 存储选中的员工ID
        
        this.init();
    }
    
    init() {
        this.loadData();
        this.initEventListeners();
        this.setCurrentMonth();
        this.updateUI();
    }
    
    // 初始化事件监听器
    initEventListeners() {
        // 年月选择器
        document.getElementById('monthSelector').addEventListener('change', (e) => {
            this.data.currentMonth = e.target.value;
            this.generateTable();
            this.saveData();
        });
        
        // 人员管理
        document.getElementById('addPersonBtn').addEventListener('click', () => {
            this.addPerson();
        });
        
        document.getElementById('personInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addPerson();
            }
        });
        
        // 项目管理
        document.getElementById('addProjectBtn').addEventListener('click', () => {
            this.addProject();
        });
        
        document.getElementById('projectInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addProject();
            }
        });
        
        // 批量操作
        document.getElementById('batchBindAllBtn').addEventListener('click', () => {
            this.batchBindTimesheet(true); // 绑定所有日期
        });

        document.getElementById('batchBindWorkdaysBtn').addEventListener('click', () => {
            this.batchBindTimesheet(false); // 仅绑定工作日
        });

        // 批量导入
        document.getElementById('batchImportPersonBtn').addEventListener('click', () => {
            this.openImportModal('person');
        });

        document.getElementById('batchImportProjectBtn').addEventListener('click', () => {
            this.openImportModal('project');
        });

        // 导出功能
        document.getElementById('exportCsvBtn').addEventListener('click', () => {
            this.exportCSV();
        });

        document.getElementById('exportJsonBtn').addEventListener('click', () => {
            this.exportJSON();
        });

        // 模态框事件
        this.initModalEvents();

        // 标签选择器事件
        this.initTagSelector();

        // 键盘事件监听
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeImportModal();
                this.closeEmployeeDropdown();
            }
        });
    }

    // 初始化模态框事件
    initModalEvents() {
        const modal = document.getElementById('importModal');
        const closeBtn = modal.querySelector('.close');
        const cancelBtn = document.getElementById('cancelImportBtn');
        const confirmBtn = document.getElementById('confirmImportBtn');
        const tabBtns = modal.querySelectorAll('.tab-btn');
        const fileInput = document.getElementById('importFile');

        // 关闭模态框
        closeBtn.addEventListener('click', () => this.closeImportModal());
        cancelBtn.addEventListener('click', () => this.closeImportModal());

        // 点击模态框外部关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeImportModal();
            }
        });

        // 确认导入
        confirmBtn.addEventListener('click', () => this.confirmImport());

        // 标签页切换
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // 文件上传
        fileInput.addEventListener('change', (e) => {
            this.handleFileUpload(e.target.files[0]);
        });
    }
    
    // 设置当前月份
    setCurrentMonth() {
        const now = new Date();
        const currentMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
        
        if (!this.data.currentMonth) {
            this.data.currentMonth = currentMonth;
        }
        
        document.getElementById('monthSelector').value = this.data.currentMonth;
    }
    
    // 添加人员
    addPerson() {
        const input = document.getElementById('personInput');
        const name = input.value.trim();
        
        if (!name) {
            alert('请输入人员姓名');
            return;
        }
        
        if (this.data.persons.some(p => p.name === name)) {
            alert('该人员已存在');
            return;
        }
        
        const person = {
            id: Date.now(),
            name: name
        };
        
        this.data.persons.push(person);
        input.value = '';
        
        this.updatePersonList();
        this.generateTable();
        this.saveData();
    }
    
    // 删除人员
    deletePerson(id) {
        if (confirm('确定要删除该人员吗？这将清除该人员的所有工时数据。')) {
            this.data.persons = this.data.persons.filter(p => p.id !== id);
            delete this.data.timesheetData[id];
            
            this.updatePersonList();
            this.generateTable();
            this.saveData();
        }
    }
    
    // 添加项目
    addProject() {
        const input = document.getElementById('projectInput');
        const name = input.value.trim();
        
        if (!name) {
            alert('请输入项目名称');
            return;
        }
        
        if (this.data.projects.some(p => p.name === name)) {
            alert('该项目已存在');
            return;
        }
        
        const project = {
            id: Date.now(),
            name: name
        };
        
        this.data.projects.push(project);
        input.value = '';
        
        this.updateProjectList();
        this.updateBatchProjectSelect();
        this.generateTable();
        this.saveData();
    }
    
    // 删除项目
    deleteProject(id) {
        if (confirm('确定要删除该项目吗？这将清除所有相关的工时数据。')) {
            this.data.projects = this.data.projects.filter(p => p.id !== id);
            
            // 清除工时数据中的该项目
            Object.keys(this.data.timesheetData).forEach(personId => {
                Object.keys(this.data.timesheetData[personId]).forEach(date => {
                    if (this.data.timesheetData[personId][date] == id) {
                        this.data.timesheetData[personId][date] = '';
                    }
                });
            });
            
            this.updateProjectList();
            this.updateBatchProjectSelect();
            this.generateTable();
            this.saveData();
        }
    }
    
    // 更新人员列表显示
    updatePersonList() {
        const container = document.getElementById('personList');
        container.innerHTML = '';

        this.data.persons.forEach(person => {
            const item = document.createElement('div');
            item.className = 'list-item';
            item.innerHTML = `
                <span>${person.name}</span>
                <button class="delete-btn" onclick="timesheetManager.deletePerson(${person.id})">删除</button>
            `;
            container.appendChild(item);
        });
    }
    
    // 更新项目列表显示
    updateProjectList() {
        const container = document.getElementById('projectList');
        container.innerHTML = '';
        
        this.data.projects.forEach(project => {
            const item = document.createElement('div');
            item.className = 'list-item';
            item.innerHTML = `
                <span>${project.name}</span>
                <button class="delete-btn" onclick="timesheetManager.deleteProject(${project.id})">删除</button>
            `;
            container.appendChild(item);
        });
    }
    
    // 更新批量操作选择器
    updateBatchProjectSelect() {
        const select = document.getElementById('batchProjectSelect');
        select.innerHTML = '<option value="">选择项目</option>';

        this.data.projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project.id;
            option.textContent = project.name;
            select.appendChild(option);
        });
    }

    // 初始化标签选择器
    initTagSelector() {
        const selectedTags = document.getElementById('selectedEmployeeTags');
        const dropdown = document.getElementById('employeeDropdown');

        // 点击选中区域显示下拉框
        selectedTags.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleEmployeeDropdown();
        });

        // 点击其他地方关闭下拉框
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.tag-selector')) {
                this.closeEmployeeDropdown();
            }
        });
    }

    // 更新员工标签选择器
    updateEmployeeTagSelector() {
        const dropdown = document.getElementById('employeeDropdown');
        dropdown.innerHTML = '';

        this.data.persons.forEach(person => {
            const item = document.createElement('div');
            item.className = 'dropdown-item';
            item.textContent = person.name;
            item.dataset.employeeId = person.id;

            if (this.selectedEmployees.has(person.id.toString())) {
                item.classList.add('selected');
            }

            item.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleEmployeeSelection(person.id, person.name);
            });

            dropdown.appendChild(item);
        });
    }

    // 切换员工选择状态
    toggleEmployeeSelection(employeeId, employeeName) {
        const employeeIdStr = employeeId.toString();

        console.log('切换员工选择:', employeeId, employeeName);

        if (this.selectedEmployees.has(employeeIdStr)) {
            this.selectedEmployees.delete(employeeIdStr);
            console.log('移除员工:', employeeIdStr);
        } else {
            this.selectedEmployees.add(employeeIdStr);
            console.log('添加员工:', employeeIdStr);
        }

        console.log('当前选中员工:', this.selectedEmployees);

        this.updateSelectedEmployeeTags();
        this.updateEmployeeTagSelector();
    }

    // 更新选中的员工标签显示
    updateSelectedEmployeeTags() {
        const container = document.getElementById('selectedEmployeeTags');
        container.innerHTML = '';

        if (this.selectedEmployees.size === 0) {
            const placeholder = document.createElement('span');
            placeholder.className = 'placeholder';
            placeholder.textContent = '点击选择员工...';
            container.appendChild(placeholder);
        } else {
            this.selectedEmployees.forEach(employeeId => {
                const employee = this.data.persons.find(p => p.id.toString() === employeeId);
                if (employee) {
                    const tag = document.createElement('div');
                    tag.className = 'employee-tag';
                    tag.innerHTML = `
                        <span>${employee.name}</span>
                        <button class="remove-tag" onclick="timesheetManager.removeEmployeeTag('${employeeId}')">&times;</button>
                    `;
                    container.appendChild(tag);
                }
            });
        }
    }

    // 移除员工标签
    removeEmployeeTag(employeeId) {
        this.selectedEmployees.delete(employeeId.toString());
        this.updateSelectedEmployeeTags();
        this.updateEmployeeTagSelector();
    }

    // 显示/隐藏员工下拉框
    toggleEmployeeDropdown() {
        const dropdown = document.getElementById('employeeDropdown');
        const selectedTags = document.getElementById('selectedEmployeeTags');

        if (dropdown.classList.contains('show')) {
            this.closeEmployeeDropdown();
        } else {
            dropdown.classList.add('show');
            selectedTags.classList.add('active');
        }
    }

    // 关闭员工下拉框
    closeEmployeeDropdown() {
        const dropdown = document.getElementById('employeeDropdown');
        const selectedTags = document.getElementById('selectedEmployeeTags');

        dropdown.classList.remove('show');
        selectedTags.classList.remove('active');
    }

    // 调试信息
    debugInfo() {
        console.log('=== 调试信息 ===');
        console.log('选中的员工:', this.selectedEmployees);
        console.log('员工数据:', this.data.persons);
        console.log('项目数据:', this.data.projects);
        console.log('当前月份:', this.data.currentMonth);
        console.log('工时数据:', this.data.timesheetData);

        const projectId = document.getElementById('batchProjectSelect').value;
        console.log('选中的项目ID:', projectId);

        alert('调试信息已输出到控制台，请按F12查看');
    }
    
    // 生成工时表格
    generateTable() {
        if (!this.data.currentMonth) return;
        
        const [year, month] = this.data.currentMonth.split('-');
        const daysInMonth = new Date(year, month, 0).getDate();
        
        // 生成表头
        const header = document.getElementById('tableHeader');
        header.innerHTML = '<th class="name-column">姓名</th>';
        
        for (let day = 1; day <= daysInMonth; day++) {
            const th = document.createElement('th');
            const date = new Date(year, month - 1, day);
            const dayOfWeek = date.getDay(); // 0=周日, 1=周一, ..., 6=周六

            th.textContent = `${month}/${day.toString().padStart(2, '0')}`;

            // 添加周末和节假日的样式类
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                th.classList.add('weekend');
            }

            header.appendChild(th);
        }
        
        // 生成表格内容
        const tbody = document.getElementById('tableBody');
        tbody.innerHTML = '';
        
        this.data.persons.forEach(person => {
            const row = document.createElement('tr');
            row.dataset.personId = person.id;

            // 姓名列
            const nameCell = document.createElement('td');
            nameCell.className = 'name-cell';
            nameCell.textContent = person.name;

            // 添加用户行选择事件
            nameCell.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleUserSelection(person.id, row);
            });

            row.appendChild(nameCell);
            
            // 日期列
            for (let day = 1; day <= daysInMonth; day++) {
                const cell = document.createElement('td');
                const dateKey = `${month.padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                const date = new Date(year, month - 1, day);
                const dayOfWeek = date.getDay(); // 0=周日, 1=周一, ..., 6=周六

                // 添加周末样式
                if (dayOfWeek === 0 || dayOfWeek === 6) {
                    cell.classList.add('weekend-cell');
                }

                const select = document.createElement('select');
                select.className = 'cell-select';
                select.innerHTML = '<option value="">--</option>';

                this.data.projects.forEach(project => {
                    const option = document.createElement('option');
                    option.value = project.id;
                    option.textContent = project.name;
                    select.appendChild(option);
                });

                // 设置当前值
                if (this.data.timesheetData[person.id] && this.data.timesheetData[person.id][dateKey]) {
                    const projectId = this.data.timesheetData[person.id][dateKey];
                    select.value = projectId;
                    console.log(`设置 ${person.name} ${dateKey} 的值为项目ID: ${projectId}`);
                }

                // 添加事件监听器
                select.addEventListener('change', (e) => {
                    this.updateTimesheetData(person.id, dateKey, e.target.value);
                });

                cell.appendChild(select);
                row.appendChild(cell);
            }
            
            tbody.appendChild(row);
        });
    }
    
    // 更新工时数据
    updateTimesheetData(personId, dateKey, projectId, skipSave = false) {
        console.log(`updateTimesheetData 调用: personId=${personId}, dateKey=${dateKey}, projectId=${projectId}, skipSave=${skipSave}`);

        if (!this.data.timesheetData[personId]) {
            this.data.timesheetData[personId] = {};
            console.log(`为员工 ${personId} 创建新的工时数据对象`);
        }

        this.data.timesheetData[personId][dateKey] = projectId;
        console.log(`设置 timesheetData[${personId}][${dateKey}] = ${projectId}`);

        if (!skipSave) {
            this.saveData();
            console.log('数据已保存到 localStorage');
        }
    }
    
    // 更新UI
    updateUI() {
        this.updatePersonList();
        this.updateProjectList();
        this.updateBatchProjectSelect();
        this.updateEmployeeTagSelector();
        this.updateSelectedEmployeeTags();
        this.generateTable();
    }
    


    // 数据存储和加载
    saveData() {
        localStorage.setItem('timesheetData', JSON.stringify(this.data));
    }

    loadData() {
        const saved = localStorage.getItem('timesheetData');
        if (saved) {
            this.data = { ...this.data, ...JSON.parse(saved) };
        }
    }

    // 用户选择功能
    toggleUserSelection(personId, row) {
        if (this.selectedUsers.has(personId)) {
            this.selectedUsers.delete(personId);
            row.classList.remove('selected-row');
        } else {
            this.selectedUsers.add(personId);
            row.classList.add('selected-row');
        }
        this.updateSelectionCount();
    }

    clearSelection() {
        document.querySelectorAll('.selected-row').forEach(row => {
            row.classList.remove('selected-row');
        });
        this.selectedUsers.clear();
        this.updateSelectionCount();
    }

    updateSelectionCount() {
        document.getElementById('selectionCount').textContent = `已选择: ${this.selectedCells.size} 个单元格`;
    }

    // 批量绑定工时
    batchBindTimesheet(includeWeekends = false) {
        console.log('=== 开始批量绑定工时 ===');
        console.log('includeWeekends:', includeWeekends);
        console.log('selectedEmployees:', this.selectedEmployees);

        const selectedEmployeeIds = Array.from(this.selectedEmployees);
        const projectId = document.getElementById('batchProjectSelect').value;

        console.log('selectedEmployeeIds:', selectedEmployeeIds);
        console.log('projectId:', projectId);
        console.log('currentMonth:', this.data.currentMonth);

        // 验证输入
        if (selectedEmployeeIds.length === 0) {
            alert('请先选择员工（可按住Ctrl键多选）');
            return;
        }

        if (!projectId) {
            alert('请先选择项目');
            return;
        }

        if (!this.data.currentMonth) {
            alert('请先选择年月');
            return;
        }

        // 确认操作
        const employeeNames = selectedEmployeeIds.map(id =>
            this.data.persons.find(p => p.id == id)?.name
        ).filter(name => name);

        const projectName = this.data.projects.find(p => p.id == projectId)?.name;
        const dateRange = includeWeekends ? '当月所有日期' : '当月工作日';

        const confirmMessage = `确定要为以下员工绑定${dateRange}的工时到项目"${projectName}"吗？\n\n员工：${employeeNames.join('、')}`;

        if (!confirm(confirmMessage)) {
            return;
        }

        // 执行批量绑定
        const [year, month] = this.data.currentMonth.split('-');
        const daysInMonth = new Date(year, month, 0).getDate();
        let totalUpdatedCells = 0;

        selectedEmployeeIds.forEach(employeeIdStr => {
            const employeeId = parseInt(employeeIdStr);
            let updatedCells = 0;

            // 确保员工存在
            const employee = this.data.persons.find(p => p.id === employeeId);
            if (!employee) {
                console.warn(`员工ID ${employeeId} 不存在`);
                return;
            }

            // 遍历当月所有日期
            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(year, month - 1, day);
                const dayOfWeek = date.getDay(); // 0=周日, 1=周一, ..., 6=周六

                // 根据设置决定是否包含周末
                const shouldUpdate = includeWeekends || (dayOfWeek >= 1 && dayOfWeek <= 5);

                if (shouldUpdate) {
                    const dateKey = `${month.padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                    this.updateTimesheetData(employeeId, dateKey, projectId, true); // 跳过单独保存
                    updatedCells++;

                    // 调试信息
                    console.log(`更新员工 ${employee.name} (ID: ${employeeId}) 的 ${dateKey} 为项目 ${projectId}`);
                }
            }

            totalUpdatedCells += updatedCells;
        });

        // 保存数据并刷新界面
        this.saveData();

        // 强制刷新表格，确保数据更新
        setTimeout(() => {
            this.generateTable();
            console.log('表格已刷新，当前工时数据：', this.data.timesheetData);
        }, 50);

        // 显示成功消息
        const successMessage = `批量绑定完成！\n\n` +
            `员工：${employeeNames.join('、')}\n` +
            `项目：${projectName}\n` +
            `范围：${dateRange}\n` +
            `共更新：${totalUpdatedCells} 个单元格`;

        alert(successMessage);
    }

    // 批量操作
    applyBatchOperation() {
        const projectId = document.getElementById('batchProjectSelect').value;

        if (this.selectedUsers.size === 0) {
            alert('请先选择要操作的用户（点击用户姓名）');
            return;
        }

        if (!projectId) {
            alert('请选择要应用的项目');
            return;
        }

        const [year, month] = this.data.currentMonth.split('-');
        const daysInMonth = new Date(year, month, 0).getDate();

        let totalUpdated = 0;

        this.selectedUsers.forEach(personId => {
            if (!this.data.timesheetData[personId]) {
                this.data.timesheetData[personId] = {};
            }

            // 只更新工作日（周一到周五）
            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(year, month - 1, day);
                const dayOfWeek = date.getDay();

                // 0=周日, 6=周六，只更新周一到周五
                if (dayOfWeek >= 1 && dayOfWeek <= 5) {
                    const dateKey = `${month.padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                    this.data.timesheetData[personId][dateKey] = projectId;
                    totalUpdated++;
                }
            }
        });

        // 更新表格显示
        this.generateTable();
        this.clearSelection();
        this.saveData();

        alert(`已成功为 ${this.selectedUsers.size} 个用户的工作日更新项目，共更新 ${totalUpdated} 个单元格`);
    }

    // 批量导入功能
    openImportModal(type) {
        this.currentImportType = type;
        const modal = document.getElementById('importModal');
        const title = document.getElementById('modalTitle');

        title.textContent = type === 'person' ? '批量导入人员' : '批量导入项目';

        // 重置表单
        document.getElementById('importTextarea').value = '';
        document.getElementById('importFile').value = '';
        document.getElementById('filePreview').innerHTML = '';
        this.switchTab('text');

        modal.style.display = 'block';
    }

    closeImportModal() {
        document.getElementById('importModal').style.display = 'none';
        this.currentImportType = null;
    }

    switchTab(tabName) {
        // 切换标签按钮状态
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // 切换内容区域
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}Tab`).classList.add('active');
    }

    handleFileUpload(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            document.getElementById('filePreview').textContent = content;

            // 自动解析文件内容到文本框
            const lines = content.split('\n').filter(line => line.trim());
            document.getElementById('importTextarea').value = lines.join('\n');
        };
        reader.readAsText(file);
    }

    confirmImport() {
        const textarea = document.getElementById('importTextarea');
        const content = textarea.value.trim();

        if (!content) {
            alert('请输入要导入的内容');
            return;
        }

        // 解析内容 - 支持逗号分隔和换行分隔
        let items = [];
        if (content.includes(',')) {
            items = content.split(',').map(item => item.trim()).filter(item => item);
        } else {
            items = content.split('\n').map(item => item.trim()).filter(item => item);
        }

        if (items.length === 0) {
            alert('没有找到有效的导入内容');
            return;
        }

        // 执行导入
        let successCount = 0;
        let duplicateCount = 0;

        items.forEach(name => {
            if (this.currentImportType === 'person') {
                if (!this.data.persons.some(p => p.name === name)) {
                    this.data.persons.push({
                        id: Date.now() + Math.random(),
                        name: name
                    });
                    successCount++;
                } else {
                    duplicateCount++;
                }
            } else if (this.currentImportType === 'project') {
                if (!this.data.projects.some(p => p.name === name)) {
                    this.data.projects.push({
                        id: Date.now() + Math.random(),
                        name: name
                    });
                    successCount++;
                } else {
                    duplicateCount++;
                }
            }
        });

        // 更新界面
        this.updateUI();
        this.saveData();
        this.closeImportModal();

        // 显示结果
        let message = `导入完成！成功导入 ${successCount} 项`;
        if (duplicateCount > 0) {
            message += `，跳过重复项 ${duplicateCount} 项`;
        }
        alert(message);
    }


    // 导出CSV
    exportCSV() {
        if (!this.data.currentMonth) {
            alert('请先选择年月');
            return;
        }

        const [year, month] = this.data.currentMonth.split('-');
        const daysInMonth = new Date(year, month, 0).getDate();

        // 构建CSV内容
        let csvContent = '';

        // 表头
        let header = '姓名';
        for (let day = 1; day <= daysInMonth; day++) {
            header += `,${month}/${day.toString().padStart(2, '0')}`;
        }
        csvContent += header + '\n';

        // 数据行
        this.data.persons.forEach(person => {
            let row = person.name;
            for (let day = 1; day <= daysInMonth; day++) {
                const dateKey = `${month.padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                const projectId = this.data.timesheetData[person.id] && this.data.timesheetData[person.id][dateKey];
                const project = this.data.projects.find(p => p.id == projectId);
                const projectName = project ? project.name : '';
                row += `,"${projectName}"`;
            }
            csvContent += row + '\n';
        });

        // 下载文件
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `工时表_${year}年${month}月.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // 导出JSON
    exportJSON() {
        const exportData = {
            ...this.data,
            exportTime: new Date().toISOString(),
            version: '1.0'
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);

        const [year, month] = this.data.currentMonth.split('-');
        link.setAttribute('download', `工时数据_${year}-${month}.json`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// 初始化应用
let timesheetManager;
document.addEventListener('DOMContentLoaded', () => {
    timesheetManager = new TimesheetManager();
});
