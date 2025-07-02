// Element Plus 团队工时管理系统
const { createApp, ref, computed, reactive, watch, nextTick } = Vue;
const { ElMessage, ElMessageBox, ElNotification } = ElementPlus;

// 注册Element Plus图标
const {
    Plus,
    Delete,
    Download,
    Upload,
    Calendar,
    User,
    Folder,
    Edit,
    Check,
    Close
} = ElementPlusIconsVue;

createApp({
    setup() {
        // ===== 数据模型定义 =====

        // 员工对象模型 - 初始化示例数据
        const employees = ref([
            {
                id: 'emp_001',
                name: '张三',
                createdAt: new Date().toISOString()
            },
            {
                id: 'emp_002',
                name: '李四',
                createdAt: new Date().toISOString()
            }
        ]);

        // 项目对象模型 - 初始化示例数据
        const projects = ref([
            {
                id: 'proj_001',
                name: '示例项目A',
                createdAt: new Date().toISOString()
            }
        ]);

        // 工作日志对象模型 - 结构: { employeeId: { 'MM-DD': projectId } }
        // 初始化一些示例工时数据
        const timesheetData = reactive({
            'emp_001': {
                '12-01': 'proj_001',
                '12-02': 'proj_001',
                '12-03': 'proj_001'
            },
            'emp_002': {
                '12-01': 'proj_001',
                '12-04': 'proj_001'
            }
        });
        
        // ===== 界面状态管理 =====
        const currentMonth = ref(getCurrentMonth());
        const newEmployeeName = ref('');
        const newProjectName = ref('');
        const selectedEmployees = ref([]);
        const selectedProject = ref('');
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
        
        // 导入模态框标题
        const importModalTitle = computed(() => {
            return importType.value === 'employee' ? '批量导入员工' : '批量导入项目';
        });

        // 计算员工工作天数统计
        const employeeWorkDaysStats = computed(() => {
            const stats = {};
            employees.value.forEach(employee => {
                const workDays = [];
                const employeeData = timesheetData[employee.id] || {};

                Object.keys(employeeData).forEach(dateKey => {
                    if (employeeData[dateKey]) { // 有项目分配
                        workDays.push(dateKey);
                    }
                });

                stats[employee.id] = {
                    workDays: workDays.length,
                    dates: workDays.sort()
                };
            });
            return stats;
        });

        // 计算项目人天统计
        const projectManDaysStats = computed(() => {
            const stats = {};
            projects.value.forEach(project => {
                let totalManDays = 0;
                const employeeList = [];

                employees.value.forEach(employee => {
                    const employeeData = timesheetData[employee.id] || {};
                    let employeeDays = 0;

                    Object.keys(employeeData).forEach(dateKey => {
                        if (employeeData[dateKey] === project.id) {
                            employeeDays++;
                        }
                    });

                    if (employeeDays > 0) {
                        totalManDays += employeeDays;
                        employeeList.push({
                            name: employee.name,
                            days: employeeDays
                        });
                    }
                });

                stats[project.id] = {
                    totalManDays,
                    employeeCount: employeeList.length,
                    employees: employeeList
                };
            });
            return stats;
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
        
        // 格式化日期表头
        function formatDateHeader(day) {
            if (!currentMonth.value) return '';
            const month = currentMonth.value.split('-')[1];
            return `${month}/${String(day).padStart(2, '0')}`;
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
                    // 只有当localStorage中有数据时才覆盖初始数据
                    if (data.employees && data.employees.length > 0) {
                        employees.value = data.employees;
                    }
                    if (data.projects && data.projects.length > 0) {
                        projects.value = data.projects;
                    }
                    Object.assign(timesheetData, data.timesheetData || {});
                    if (data.currentMonth) {
                        currentMonth.value = data.currentMonth;
                    }
                    console.log('数据已加载:', data);
                } else {
                    console.log('使用初始示例数据');
                    // 首次使用，保存初始数据
                    saveData();
                }
            } catch (error) {
                console.error('加载数据失败:', error);
                ElMessage.error('加载数据失败，使用初始数据');
                // 出错时保存当前初始数据
                saveData();
            }
        }
        
        // ===== 员工管理 =====
        
        // 添加员工
        function addEmployee() {
            const name = newEmployeeName.value.trim();
            if (!name) {
                ElMessage.warning('请输入员工姓名');
                return;
            }
            
            if (employees.value.some(emp => emp.name === name)) {
                ElMessage.warning('该员工已存在');
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

            // 强制触发响应式更新
            nextTick(() => {
                console.log('员工列表已更新，当前员工数量:', employees.value.length);
            });

            ElMessage.success(`员工"${name}"添加成功`);
            console.log('添加员工:', employee);
        }
        
        // 删除员工
        async function deleteEmployee(employeeId) {
            const employee = employees.value.find(emp => emp.id === employeeId);
            if (!employee) return;
            
            try {
                await ElMessageBox.confirm(
                    `确定要删除员工"${employee.name}"吗？这将清除该员工的所有工时数据。`,
                    '删除确认',
                    {
                        confirmButtonText: '确定',
                        cancelButtonText: '取消',
                        type: 'warning',
                    }
                );
                
                employees.value = employees.value.filter(emp => emp.id !== employeeId);
                delete timesheetData[employeeId];
                selectedEmployees.value = selectedEmployees.value.filter(id => id !== employeeId);
                saveData();
                
                ElMessage.success(`员工"${employee.name}"删除成功`);
                console.log('删除员工:', employee);
            } catch {
                // 用户取消删除
            }
        }
        
        // ===== 项目管理 =====
        
        // 添加项目
        function addProject() {
            const name = newProjectName.value.trim();
            if (!name) {
                ElMessage.warning('请输入项目名称');
                return;
            }
            
            if (projects.value.some(proj => proj.name === name)) {
                ElMessage.warning('该项目已存在');
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

            // 强制触发响应式更新
            nextTick(() => {
                console.log('项目列表已更新，当前项目数量:', projects.value.length);
            });

            ElMessage.success(`项目"${name}"添加成功`);
            console.log('添加项目:', project);
        }
        
        // 删除项目
        async function deleteProject(projectId) {
            const project = projects.value.find(proj => proj.id === projectId);
            if (!project) return;
            
            try {
                await ElMessageBox.confirm(
                    `确定要删除项目"${project.name}"吗？这将清除所有相关的工时数据。`,
                    '删除确认',
                    {
                        confirmButtonText: '确定',
                        cancelButtonText: '取消',
                        type: 'warning',
                    }
                );
                
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
                
                ElMessage.success(`项目"${project.name}"删除成功`);
                console.log('删除项目:', project);
            } catch {
                // 用户取消删除
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
        async function batchBindTimesheet(includeWeekends = false) {
            console.log('=== 开始批量绑定工时 ===');
            console.log('includeWeekends:', includeWeekends);
            console.log('selectedEmployees:', selectedEmployees.value);
            console.log('selectedProject:', selectedProject.value);
            
            // 验证输入
            if (selectedEmployees.value.length === 0) {
                ElMessage.warning('请先选择员工');
                return;
            }
            
            if (!selectedProject.value) {
                ElMessage.warning('请先选择项目');
                return;
            }
            
            if (!currentMonth.value) {
                ElMessage.warning('请先选择年月');
                return;
            }
            
            // 确认操作
            const employeeNames = selectedEmployees.value.map(id => 
                employees.value.find(emp => emp.id === id)?.name
            ).filter(name => name);
            
            const project = projects.value.find(proj => proj.id === selectedProject.value);
            const dateRange = includeWeekends ? '当月所有日期' : '当月工作日';
            
            try {
                await ElMessageBox.confirm(
                    `确定要为以下员工绑定${dateRange}的工时到项目"${project.name}"吗？\n\n员工：${employeeNames.join('、')}`,
                    '批量绑定确认',
                    {
                        confirmButtonText: '确定',
                        cancelButtonText: '取消',
                        type: 'info',
                    }
                );
                
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
                
                // 显示成功通知
                ElNotification({
                    title: '批量绑定完成',
                    message: `员工：${employeeNames.join('、')}\n项目：${project.name}\n范围：${dateRange}\n共更新：${totalUpdatedCells} 个单元格`,
                    type: 'success',
                    duration: 5000
                });
                
                console.log('批量绑定完成，更新的数据:', timesheetData);
            } catch {
                // 用户取消操作
            }
        }
        
        // ===== 其他功能 =====
        
        // 月份变化处理
        function onMonthChange() {
            saveData();
            console.log('月份已切换到:', currentMonth.value);
        }
        
        // 批量导入相关
        function openImportModal(type) {
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
                ElMessage.warning('请输入要导入的内容');
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
                ElMessage.success(`成功导入 ${addedCount} 个员工`);
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
                ElMessage.success(`成功导入 ${addedCount} 个项目`);
            }
            
            saveData();
            closeImportModal();
        }
        
        // 导出功能
        function exportCSV() {
            if (!currentMonth.value) {
                ElMessage.warning('请先选择年月');
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
            
            ElMessage.success('CSV文件导出成功');
        }
        
        function exportJSON() {
            const exportData = {
                employees: employees.value,
                projects: projects.value,
                timesheetData: timesheetData,
                currentMonth: currentMonth.value,
                exportTime: new Date().toISOString(),
                version: '3.0-ElementPlus'
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

            ElMessage.success('JSON文件导出成功');
        }

        // 重置为初始数据（开发调试用）
        function resetToInitialData() {
            localStorage.removeItem('timesheetData');
            location.reload();
        }

        // 在控制台暴露重置函数，方便调试
        window.resetToInitialData = resetToInitialData;
        
        // ===== 生命周期 =====
        
        // 组件挂载时加载数据
        loadData();
        
        // 监听数据变化，自动保存
        watch([employees, projects], () => {
            saveData();
        }, { deep: true });
        
        // ===== 返回响应式数据和方法 =====
        return {
            // 图标
            Plus,
            Delete,
            Download,
            Upload,
            Calendar,
            User,
            Folder,
            Edit,
            Check,
            Close,
            
            // 数据
            employees,
            projects,
            timesheetData,
            currentMonth,
            newEmployeeName,
            newProjectName,
            selectedEmployees,
            selectedProject,
            showImportModal,
            importType,
            importText,
            
            // 计算属性
            daysInMonth,
            importModalTitle,
            employeeWorkDaysStats,
            projectManDaysStats,
            
            // 方法
            addEmployee,
            deleteEmployee,
            addProject,
            deleteProject,
            getTimesheetValue,
            updateTimesheet,
            batchBindTimesheet,
            onMonthChange,
            isWeekend,
            formatDateHeader,
            openImportModal,
            closeImportModal,
            confirmImport,
            exportCSV,
            exportJSON
        };
    }
}).use(ElementPlus).mount('#app');
