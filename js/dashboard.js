document.addEventListener('DOMContentLoaded', () => {
    // localStorage.setItem('access_token', '1234567890');
    // localStorage.setItem('refresh_token', '1234567890');
    // --- Authentication Check ---
    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (!accessToken || !refreshToken) {
        window.location.href = 'auth.html';
        return;
    }

    // --- View Switching ---
    const navDashboard = document.getElementById('nav-dashboard');
    const navTasks = document.getElementById('nav-tasks');
    const dashboardView = document.getElementById('dashboard-view');
    const tasksView = document.getElementById('tasks-view');
    const navLinks = document.querySelectorAll('.sidebar-nav a');

    function switchView(view) {
        navLinks.forEach(link => link.classList.remove('active'));
        dashboardView.style.display = 'none';
        tasksView.style.display = 'none';

        if (view === 'dashboard') {
            dashboardView.style.display = 'block';
            navDashboard.classList.add('active');
        } else if (view === 'tasks') {
            tasksView.style.display = 'block';
            navTasks.classList.add('active');
        }
    }

    navDashboard.addEventListener('click', (e) => {
        e.preventDefault();
        switchView('dashboard');
    });
    navTasks.addEventListener('click', (e) => {
        e.preventDefault();
        switchView('tasks');
    });

    // --- Live Time and Date ---
    const timeElement = document.getElementById('currentTime');
    const dateElement = document.getElementById('currentDate');

    function updateLiveTime() {
        const now = new Date();
        timeElement.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        dateElement.textContent = now.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
    }

    updateLiveTime();
    setInterval(updateLiveTime, 1000 * 60);

    // Sidebar Toggle (for future use if needed)
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }

    // Focus Timer
    const timerDisplay = document.getElementById('timer-display');
    const timerLabel = document.getElementById('timer-label');
    const startPauseBtn = document.getElementById('start-pause-btn');
    const resetBtn = document.getElementById('reset-btn');
    const skipBtn = document.getElementById('skip-btn');
    const timeBtns = document.querySelectorAll('.time-btn');

    let countdown;
    let timeInSeconds = 1500;
    let isRunning = false;
    let isPaused = false;

    // Notification Permission
    if ('Notification' in window) {
        if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    console.log('Notification permission granted.');
                }
            });
        }
    }

    function showNotification(message) {
        if (!('Notification' in window) || Notification.permission !== 'granted') {
            return;
        }
        new Notification('Focusly Timer', {
            body: message,
            icon: 'https://cdn-icons-png.flaticon.com/512/149/149271.png'
        });
    }

    function updateTimerDisplay() {
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = timeInSeconds % 60;
        timerDisplay.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }
    
    function startTimer() {
        isRunning = true;
        isPaused = false;
        startPauseBtn.innerHTML = '⏸';
        showNotification('Focus session started!');
        
        countdown = setInterval(() => {
            timeInSeconds--;
            updateTimerDisplay();
            if (timeInSeconds <= 0) {
                clearInterval(countdown);
                isRunning = false;
                showNotification('Time is up! Take a break.');
                startPauseBtn.innerHTML = '▶';
            }
        }, 1000);
    }

    function pauseTimer() {
        isPaused = true;
        clearInterval(countdown);
        startPauseBtn.innerHTML = '▶';
    }

    function resetTimer() {
        clearInterval(countdown);
        isRunning = false;
        isPaused = false;
        timeInSeconds = parseInt(document.querySelector('.time-btn.active')?.dataset.time || '1500');
        updateTimerDisplay();
        startPauseBtn.innerHTML = '▶';
    }

    startPauseBtn.addEventListener('click', () => {
        if (isRunning && !isPaused) {
            pauseTimer();
        } else {
            startTimer();
        }
    });

    resetBtn.addEventListener('click', resetTimer);
    
    timeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (isRunning) return;
            timeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            timeInSeconds = parseInt(btn.dataset.time);
            updateTimerDisplay();
        });
    });

    // Set default active button
    document.querySelector('.time-btn[data-time="1500"]').classList.add('active');
    updateTimerDisplay();

    // --- Task Management ---
    const taskNameInput = document.getElementById('task-name-input');
    const taskSubjectInput = document.getElementById('task-subject-input');
    const taskDateInput = document.getElementById('task-date-input');
    const addTaskBtn = document.getElementById('add-task-btn');
    const taskList = document.getElementById('task-list');
    const filterBtns = document.querySelectorAll('.filter-btn');

    let tasks = [];
    let currentFilter = 'all';

    function renderTasks() {
        taskList.innerHTML = '';
        const filteredTasks = tasks.filter(task => {
            if (currentFilter === 'all') return true;
            if (currentFilter === 'pending') return !task.completed;
            if (currentFilter === 'completed') return task.completed;
        });

        if (filteredTasks.length === 0) {
            taskList.innerHTML = '<p class="no-tasks-msg">No tasks here. Add one above!</p>';
            return;
        }

        filteredTasks.forEach(task => {
            const taskCard = document.createElement('div');
            taskCard.className = `task-card ${task.completed ? 'completed' : ''}`;
            taskCard.dataset.id = task.id;
            
            taskCard.innerHTML = `
                <div class="task-info">
                    <h4>${task.name}</h4>
                    <div class="task-meta">
                        ${task.subject ? `<span>${task.subject}</span>` : ''}
                        ${task.subject && task.date ? ' &bull; ' : ''}
                        ${task.date ? `<span>${new Date(task.date).toLocaleDateString()}</span>` : ''}
                    </div>
                </div>
                <div class="task-actions">
                    <button class="complete-btn" aria-label="Mark as complete">✔️</button>
                    <button class="delete-btn" aria-label="Delete task">🗑️</button>
                </div>
            `;
            taskList.appendChild(taskCard);
        });
    }

    function addTask() {
        const name = taskNameInput.value.trim();
        if (!name) return;

        const newTask = {
            id: Date.now(),
            name,
            subject: taskSubjectInput.value.trim(),
            date: taskDateInput.value,
            completed: false
        };
        tasks.push(newTask);
        
        taskNameInput.value = '';
        taskSubjectInput.value = '';
        taskDateInput.value = '';
        
        renderTasks();
    }

    function handleTaskListClick(e) {
        const target = e.target;
        const taskCard = target.closest('.task-card');
        if (!taskCard) return;
        const taskId = parseInt(taskCard.dataset.id);

        if (target.classList.contains('delete-btn')) {
            tasks = tasks.filter(task => task.id !== taskId);
        } else if (target.classList.contains('complete-btn')) {
            const task = tasks.find(task => task.id === taskId);
            if (task) {
                task.completed = !task.completed;
            }
        }
        renderTasks();
    }

    addTaskBtn.addEventListener('click', addTask);
    taskList.addEventListener('click', handleTaskListClick);

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderTasks();
        });
    });

    renderTasks();

    // --- Profile Dropdown ---
    const profileBtn = document.getElementById('profile-btn');
    const dropdownMenu = document.getElementById('dropdown-menu');
    const logoutBtn = document.getElementById('logout-btn');
    const deleteProfileBtn = document.getElementById('delete-profile-btn');

    profileBtn.addEventListener('click', () => {
        dropdownMenu.classList.toggle('open');
    });

    window.addEventListener('click', (e) => {
        if (!profileBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
            dropdownMenu.classList.remove('open');
        }
    });

    // Close dropdown on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && dropdownMenu.classList.contains('open')) {
            dropdownMenu.classList.remove('open');
        }
    });

    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        alert("You have been logged out.");
        // Assuming your login page is auth.html
        window.location.href = "auth.html";
    });

    deleteProfileBtn.addEventListener('click', () => {
        const confirmed = confirm("Are you sure you want to delete your profile? This action cannot be undone.");
        if (!confirmed) return;

        const accessToken = localStorage.getItem("access_token");
        if (!accessToken) {
            alert("You are not logged in.");
            window.location.href = "auth.html";
            return;
        }

        fetch("http://localhost:8000/api/v1/auth/manage_user/", {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`
            }
        }).then(res => {
            if (res.ok) {
                alert("Profile deleted successfully.");
                localStorage.clear();
                window.location.href = "auth.html";
            } else {
                return res.json().then(data => {
                    throw new Error(data.detail || 'Failed to delete profile.');
                });
            }
        }).catch(err => {
            console.error("Profile deletion error:", err);
            alert(`Error: ${err.message}`);
        });
    });
}); 