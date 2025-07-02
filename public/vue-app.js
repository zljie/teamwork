// Vue.js 团队工时管理系统
const { createApp, ref, computed, reactive, watch, nextTick } = Vue;

createApp({
    setup() {
        // ===== 数据模型定义 =====
        
        // 员工对象模型
        const employees = ref([]);
        
        // 项目对象模型  
        const projects = ref([]);
        
        // 工作日志对象模型 - 结构: { employeeId: { 'MM-DD': projectId } }
        const timesheetData = reactive({});
        
        // ===== 界面状态管理 =====
        const currentMonth = ref(getCurrentMonth());
        const newEmployeeName = ref('');
        const newProjectName = ref('');
        const selectedEmployees = ref([]);
        const selectedProject = ref('');
        const showEmployeeDropdown = ref(false);
        const showImportModal = ref(false);
        const importType = ref('');
        const importText = ref('');
        
        // ===== 计算属性 =====
        
        // 当月天数
        const daysInMonth = computed(() => {
            if (!currentMonth.value) return [];
            const [year, month] = currentMonth.value.split('-');
            const days = new Date(year, month, 0).getDate();
            return Array.from({ length: days }, (_, i) => i + 1);
        });
        
        // 获取选中员工对象
        const getSelectedEmployeeObjects = () => {
            return employees.value.filter(emp => selectedEmployees.value.includes(emp.id));
        };
        
        // 导入模态框标题
        const importModalTitle = computed(() => {
            return importType.value === 'employee' ? '批量导入员工' : '批量导入项目';
        });
        
        // ===== 工具函数 =====
        
        // 获取当前年月
        function getCurrentMonth() {
            const now = new Date();
            return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
        }
        
        // 生成唯一ID
        function generateId() {
            return Date.now() + Math.random().toString(36).substr(2, 9);
        }
        
        // 判断是否为周末
        function isWeekend(day) {
            if (!currentMonth.value) return false;
            const [year, month] = currentMonth.value.split('-');
            const date = new Date(year, month - 1, day);
            const dayOfWeek = date.getDay();
            return dayOfWeek === 0 || dayOfWeek === 6;
        }
        
        // 获取日期键
        function getDateKey(day) {
            if (!currentMonth.value) return '';
            const month = currentMonth.value.split('-')[1];
            return `${month.padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }
        
        // ===== 数据持久化 =====
        
        // 保存数据到localStorage
        function saveData() {
            const data = {
                employees: employees.value,
                projects: projects.value,
                timesheetData: timesheetData,
                currentMonth: currentMonth.value
            };
            localStorage.setItem('timesheetData', JSON.stringify(data));
            console.log('数据已保存:', data);
        }
        
        // 从localStorage加载数据
        function loadData() {
            try {
                const saved = localStorage.getItem('timesheetData');
                if (saved) {
                    const data = JSON.parse(saved);
                    employees.value = data.employees || [];
                    projects.value = data.projects || [];
                    Object.assign(timesheetData, data.timesheetData || {});
                    if (data.currentMonth) {
                        currentMonth.value = data.currentMonth;
                    }
                    console.log('数据已加载:', data);
                }
            } catch (error) {
                console.error('加载数据失败:', error);
            }
        }
        
        // ===== 员工管理 =====
        
        // 添加员工
        function addEmployee() {
            const name = newEmployeeName.value.trim();
            if (!name) {
                alert('请输入员工姓名');
                return;
            }
            
            if (employees.value.some(emp => emp.name === name)) {
                alert('该员工已存在');
                return;
            }
            
            const employee = {
                id: generateId(),
                name: name,
                createdAt: new Date().toISOString()
            };
            
            employees.value.push(employee);
            newEmployeeName.value = '';
            saveData();
            console.log('添加员工:', employee);
        }
        
        // 删除员工
        function deleteEmployee(employeeId) {
            const employee = employees.value.find(emp => emp.id === employeeId);
            if (!employee) return;
            
            if (confirm(`确定要删除员工"${employee.name}"吗？这将清除该员工的所有工时数据。`)) {
                employees.value = employees.value.filter(emp => emp.id !== employeeId);
                delete timesheetData[employeeId];
                selectedEmployees.value = selectedEmployees.value.filter(id => id !== employeeId);
                saveData();
                console.log('删除员工:', employee);
            }
        }
        
        // ===== 项目管理 =====
        
        // 添加项目
        function addProject() {
            const name = newProjectName.value.trim();
            if (!name) {
                alert('请输入项目名称');
                return;
            }
            
            if (projects.value.some(proj => proj.name === name)) {
                alert('该项目已存在');
                return;
            }
            
            const project = {
                id: generateId(),
                name: name,
                createdAt: new Date().toISOString()
            };
            
            projects.value.push(project);
            newProjectName.value = '';
            saveData();
            console.log('添加项目:', project);
        }
        
        // 删除项目
        function deleteProject(projectId) {
            const project = projects.value.find(proj => proj.id === projectId);
            if (!project) return;
            
            if (confirm(`确定要删除项目"${project.name}"吗？这将清除所有相关的工时数据。`)) {
                projects.value = projects.value.filter(proj => proj.id !== projectId);
                
                // 清除工时数据中的该项目
                Object.keys(timesheetData).forEach(employeeId => {
                    Object.keys(timesheetData[employeeId] || {}).forEach(dateKey => {
                        if (timesheetData[employeeId][dateKey] === projectId) {
                            timesheetData[employeeId][dateKey] = '';
                        }
                    });
                });
                
                if (selectedProject.value === projectId) {
                    selectedProject.value = '';
                }
                
                saveData();
                console.log('删除项目:', project);
            }
        }
        
        // ===== 员工选择器 =====
        
        // 切换员工下拉框显示
        function toggleEmployeeDropdown() {
            showEmployeeDropdown.value = !showEmployeeDropdown.value;
        }
        
        // 切换员工选择状态
        function toggleEmployeeSelection(employeeId) {
            const index = selectedEmployees.value.indexOf(employeeId);
            if (index > -1) {
                selectedEmployees.value.splice(index, 1);
            } else {
                selectedEmployees.value.push(employeeId);
            }
            console.log('选中员工:', selectedEmployees.value);
        }
        
        // 移除员工选择
        function removeEmployee(employeeId) {
            const index = selectedEmployees.value.indexOf(employeeId);
            if (index > -1) {
                selectedEmployees.value.splice(index, 1);
            }
        }
        
        // ===== 工时管理 =====
        
        // 获取工时表值
        function getTimesheetValue(employeeId, day) {
            const dateKey = getDateKey(day);
            return timesheetData[employeeId]?.[dateKey] || '';
        }
        
        // 更新工时表
        function updateTimesheet(employeeId, day, projectId) {
            const dateKey = getDateKey(day);
            
            if (!timesheetData[employeeId]) {
                timesheetData[employeeId] = {};
            }
            
            timesheetData[employeeId][dateKey] = projectId;
            saveData();
            
            const employee = employees.value.find(emp => emp.id === employeeId);
            const project = projects.value.find(proj => proj.id === projectId);
            console.log(`更新工时: ${employee?.name} ${dateKey} -> ${project?.name || '无'}`);
        }
        
        // 批量绑定工时
        function batchBindTimesheet(includeWeekends = false) {
            console.log('=== 开始批量绑定工时 ===');
            console.log('includeWeekends:', includeWeekends);
            console.log('selectedEmployees:', selectedEmployees.value);
            console.log('selectedProject:', selectedProject.value);
            
            // 验证输入
            if (selectedEmployees.value.length === 0) {
                alert('请先选择员工');
                return;
            }
            
            if (!selectedProject.value) {
                alert('请先选择项目');
                return;
            }
            
            if (!currentMonth.value) {
                alert('请先选择年月');
                return;
            }
            
            // 确认操作
            const employeeNames = selectedEmployees.value.map(id => 
                employees.value.find(emp => emp.id === id)?.name
            ).filter(name => name);
            
            const project = projects.value.find(proj => proj.id === selectedProject.value);
            const dateRange = includeWeekends ? '当月所有日期' : '当月工作日';
            
            const confirmMessage = `确定要为以下员工绑定${dateRange}的工时到项目"${project.name}"吗？\n\n员工：${employeeNames.join('、')}`;
            
            if (!confirm(confirmMessage)) {
                return;
            }
            
            // 执行批量绑定
            let totalUpdatedCells = 0;
            
            selectedEmployees.value.forEach(employeeId => {
                if (!timesheetData[employeeId]) {
                    timesheetData[employeeId] = {};
                }
                
                let updatedCells = 0;
                
                daysInMonth.value.forEach(day => {
                    const shouldUpdate = includeWeekends || !isWeekend(day);
                    
                    if (shouldUpdate) {
                        const dateKey = getDateKey(day);
                        timesheetData[employeeId][dateKey] = selectedProject.value;
                        updatedCells++;
                    }
                });
                
                totalUpdatedCells += updatedCells;
                console.log(`员工 ${employeeNames.find(name => employees.value.find(emp => emp.name === name)?.id === employeeId)} 更新了 ${updatedCells} 个单元格`);
            });
            
            saveData();
            
            // 显示成功消息
            const successMessage = `批量绑定完成！\n\n` +
                `员工：${employeeNames.join('、')}\n` +
                `项目：${project.name}\n` +
                `范围：${dateRange}\n` +
                `共更新：${totalUpdatedCells} 个单元格`;
                
            alert(successMessage);
            console.log('批量绑定完成，更新的数据:', timesheetData);
        }
        
        // ===== 其他功能 =====
        
        // 月份变化处理
        function onMonthChange() {
            saveData();
            console.log('月份已切换到:', currentMonth.value);
        }
        
        // 批量导入相关
        function showImportModal(type) {
            importType.value = type;
            importText.value = '';
            showImportModal.value = true;
        }
        
        function closeImportModal() {
            showImportModal.value = false;
            importType.value = '';
            importText.value = '';
        }
        
        function confirmImport() {
            const items = importText.value.split(',').map(item => item.trim()).filter(item => item);
            
            if (items.length === 0) {
                alert('请输入要导入的内容');
                return;
            }
            
            if (importType.value === 'employee') {
                let addedCount = 0;
                items.forEach(name => {
                    if (!employees.value.some(emp => emp.name === name)) {
                        employees.value.push({
                            id: generateId(),
                            name: name,
                            createdAt: new Date().toISOString()
                        });
                        addedCount++;
                    }
                });
                alert(`成功导入 ${addedCount} 个员工`);
            } else if (importType.value === 'project') {
                let addedCount = 0;
                items.forEach(name => {
                    if (!projects.value.some(proj => proj.name === name)) {
                        projects.value.push({
                            id: generateId(),
                            name: name,
                            createdAt: new Date().toISOString()
                        });
                        addedCount++;
                    }
                });
                alert(`成功导入 ${addedCount} 个项目`);
            }
            
            saveData();
            closeImportModal();
        }
        
        // 导出功能
        function exportCSV() {
            if (!currentMonth.value) {
                alert('请先选择年月');
                return;
            }
            
            const [year, month] = currentMonth.value.split('-');
            
            // 构建CSV内容
            let csvContent = '';
            
            // 表头
            let header = '姓名';
            daysInMonth.value.forEach(day => {
                header += `,${month}/${String(day).padStart(2, '0')}`;
            });
            csvContent += header + '\n';
            
            // 数据行
            employees.value.forEach(employee => {
                let row = employee.name;
                daysInMonth.value.forEach(day => {
                    const dateKey = getDateKey(day);
                    const projectId = timesheetData[employee.id]?.[dateKey];
                    const project = projects.value.find(p => p.id === projectId);
                    const projectName = project ? project.name : '';
                    row += `,"${projectName}"`;
                });
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
        
        function exportJSON() {
            const exportData = {
                employees: employees.value,
                projects: projects.value,
                timesheetData: timesheetData,
                currentMonth: currentMonth.value,
                exportTime: new Date().toISOString(),
                version: '2.0'
            };
            
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            
            const [year, month] = currentMonth.value.split('-');
            link.setAttribute('download', `工时数据_${year}-${month}.json`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        
        // ===== 生命周期 =====
        
        // 组件挂载时加载数据
        loadData();
        
        // 监听数据变化，自动保存
        watch([employees, projects], () => {
            saveData();
        }, { deep: true });
        
        // 点击外部关闭下拉框
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.tag-selector')) {
                showEmployeeDropdown.value = false;
            }
        });
        
        // ===== 返回响应式数据和方法 =====
        return {
            // 数据
            employees,
            projects,
            timesheetData,
            currentMonth,
            newEmployeeName,
            newProjectName,
            selectedEmployees,
            selectedProject,
            showEmployeeDropdown,
            showImportModal,
            importType,
            importText,
            
            // 计算属性
            daysInMonth,
            getSelectedEmployeeObjects,
            importModalTitle,
            
            // 方法
            addEmployee,
            deleteEmployee,
            addProject,
            deleteProject,
            toggleEmployeeDropdown,
            toggleEmployeeSelection,
            removeEmployee,
            getTimesheetValue,
            updateTimesheet,
            batchBindTimesheet,
            onMonthChange,
            isWeekend,
            showImportModal: showImportModal,
            closeImportModal,
            confirmImport,
            exportCSV,
            exportJSON
        };
    }
}).mount('#app');
