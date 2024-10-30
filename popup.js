document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('configForm');
    const options = ['option1', 'option2', 'option3', 'option4', 'option5', 'option6', 'option7'];
    const statsInfo = document.getElementById('statsInfo');
    const currentStatus = document.getElementById('currentStatus');

    function updateStats() {
        const checkedCount = options.filter(option => document.getElementById(option).checked).length;
        const filledInputs = options.filter(option => document.getElementById('input' + option.slice(-1)).value.trim() !== '').length;
        statsInfo.textContent = `统计信息: 已选择 ${checkedCount} 项，共填写 ${filledInputs} 个输入框`;
    }

    // 加载保存的配置
    chrome.storage.sync.get(options, function(items) {
        options.forEach(function(option) {
            const checkbox = document.getElementById(option);
            const input = document.getElementById('input' + option.slice(-1));

            if (items[option]) {
                checkbox.checked = items[option].checked;
                input.value = items[option].value;
            }
        });
        updateStats();
        currentStatus.textContent = '当前状态: 已加载保存的配置';
    });

    // 监听所有复选框和输入框的变化
    options.forEach(function(option) {
        const checkbox = document.getElementById(option);
        const input = document.getElementById('input' + option.slice(-1));

        checkbox.addEventListener('change', function() {
            updateStats();
            currentStatus.textContent = '当前状态: 未保存';
        });

        input.addEventListener('input', function() {
            updateStats();
            currentStatus.textContent = '当前状态: 未保存';
        });
    });

    // 保存配置
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const data = {};

        options.forEach(function(option) {
            const checkbox = document.getElementById(option);
            const input = document.getElementById('input' + option.slice(-1));
            data[option] = {
                checked: checkbox.checked,
                value: input.value
            };
        });

        chrome.storage.sync.set(data, function() {
            console.log('配置已保存');
            currentStatus.textContent = '当前状态: 已保存';
            // 可以在这里添加保存成功的提示
        });
    });

    // 初始更新统计信息
    updateStats();
});