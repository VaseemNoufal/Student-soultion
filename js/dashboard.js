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
    const dropdownHeader = document.querySelector(".dropdown-header p");
    const profileInitials = document.querySelector(".profile-btn span");
    const profileInitials2 = document.querySelector(".idk span");
    
    const navUsername = document.querySelector(".profile-link span.nav-text")

    // --- Fetch User Info ---
    fetch("http://85.215.229.78:8447/api/v1/auth/manage/", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization:`Bearer ${accessToken}`,
        },
    })
        .then((res) => {
            if (!res.ok) {
                throw new Error("Failed to fetch user info");
            }
            return res.json();
        })
        .then((data) => {
            console.log(data);
            const firstName = data.data.first_name || "";
            const lastName = data.data.last_name || "";

            // Set Full Name
            if (dropdownHeader) {
                dropdownHeader.textContent = `${firstName} ${lastName}`;
                navUsername.textContent =  `${firstName} ${lastName}`;
            }

            // Set Initials
            const initials =
                (firstName[0] || "").toUpperCase() +
                (lastName[0] || "").toUpperCase();
            if (profileInitials) {
                profileInitials.textContent = initials;
                profileInitials2.textContent = initials;
            }
        })
        .catch((error) => {
            console.error("Error fetching user data:", error);
            // Optional: redirect to login or show alert if fetch fails
        });
    // --- View Switching ---
    const navDashboard = document.getElementById('nav-dashboard');
    const navTasks = document.getElementById('nav-tasks');
    const dashboardView = document.getElementById('dashboard-view');
    const tasksView = document.getElementById('tasks-view');
    const navLinks = document.querySelectorAll('.sidebar-nav a');
    const navFocusTimer = document.getElementById('nav-focus-timer');
    const navCalendar = document.getElementById('nav-calendar');
    const focusTimerView = document.getElementById('focus-timer-view');
    const calendarView = document.getElementById('calendar-view');

    function switchView(view) {
        navLinks.forEach(link => link.classList.remove('active'));
        dashboardView.style.display = 'none';
        tasksView.style.display = 'none';
        if (focusTimerView) focusTimerView.style.display = 'none';
        if (calendarView) calendarView.style.display = 'none';

        if (view === 'dashboard') {
            dashboardView.style.display = 'block';
            navDashboard.classList.add('active');
        } else if (view === 'tasks') {
            tasksView.style.display = 'block';
            navTasks.classList.add('active');
            renderTasks();
        } else if (view === 'focus-timer') {
            if (focusTimerView) focusTimerView.style.display = 'block';
            if (navFocusTimer) navFocusTimer.classList.add('active');
        } else if (view === 'calendar') {
            if (calendarView) calendarView.style.display = 'block';
            if (navCalendar) navCalendar.classList.add('active');
            renderCalendarEvents();
        }
    }

    function showView(view) {
        navLinks.forEach(link => link.classList.remove('active'));
        dashboardView.style.display = 'none';
        tasksView.style.display = 'none';
        if (focusTimerView) focusTimerView.style.display = 'none';
        if (calendarView) calendarView.style.display = 'none';

        if (view === 'dashboard') {
            dashboardView.style.display = 'block';
            navDashboard.classList.add('active');
        } else if (view === 'tasks') {
            tasksView.style.display = 'block';
            navTasks.classList.add('active');
            renderTasks();
        } else if (view === 'focus-timer') {
            if (focusTimerView) focusTimerView.style.display = 'block';
            if (navFocusTimer) navFocusTimer.classList.add('active');
        } else if (view === 'calendar') {
            if (calendarView) calendarView.style.display = 'block';
            if (navCalendar) navCalendar.classList.add('active');
            renderCalendarEvents();
        }
    }

    navDashboard.addEventListener('click', (e) => {
        e.preventDefault();
        showView('dashboard');
    });
    navTasks.addEventListener('click', (e) => {
        e.preventDefault();
        showView('tasks');
    });

    if (navFocusTimer) {
        navFocusTimer.addEventListener('click', (e) => {
            e.preventDefault();
            showView('focus-timer');
        });
    }
    if (navCalendar) {
        navCalendar.addEventListener('click', (e) => {
            e.preventDefault();
            showView('calendar');
        });
    }

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

        fetch("http://85.215.229.78:8447/api/v1/auth/manage/", {
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

    // --- Calendar Logic ---
    const eventForm = document.getElementById('event-form');
    const eventDate = document.getElementById('event-date');
    const eventTitle = document.getElementById('event-title');
    const eventList = document.getElementById('event-list');
    let calendarEvents = JSON.parse(localStorage.getItem('calendarEvents') || '[]');

    function renderCalendarEvents() {
        if (!eventList) return;
        eventList.innerHTML = '';
        if (calendarEvents.length === 0) {
            eventList.innerHTML = '<li>No events yet.</li>';
            return;
        }
        calendarEvents.forEach((event, idx) => {
            const li = document.createElement('li');
            li.textContent = `${event.date}: ${event.title}`;
            const delBtn = document.createElement('button');
            delBtn.textContent = '❌';
            delBtn.style.marginLeft = '1rem';
            delBtn.onclick = () => {
                calendarEvents.splice(idx, 1);
                localStorage.setItem('calendarEvents', JSON.stringify(calendarEvents));
                renderCalendarEvents();
            };
            li.appendChild(delBtn);
            eventList.appendChild(li);
        });
    }
    if (eventForm) {
        eventForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!eventDate.value || !eventTitle.value) return;
            calendarEvents.push({ date: eventDate.value, title: eventTitle.value });
            localStorage.setItem('calendarEvents', JSON.stringify(calendarEvents));
            eventDate.value = '';
            eventTitle.value = '';
            renderCalendarEvents();
        });
    }
    renderCalendarEvents();

    // --- Calendar Grid Logic ---
    const calendarGrid = document.getElementById('calendar-grid');
    const calendarEventModal = document.getElementById('calendar-event-modal');
    const calendarModalDate = document.getElementById('calendar-modal-date');
    const calendarEventForm = document.getElementById('calendar-event-form');
    const calendarEventTitle = document.getElementById('calendar-event-title');
    const calendarModalClose = document.getElementById('calendar-modal-close');
    const calendarModalEventList = document.getElementById('calendar-modal-event-list');
    let selectedCalendarDate = null;

    function getMonthDays(year, month) {
        return new Date(year, month + 1, 0).getDate();
    }
    function getFirstDayOfWeek(year, month) {
        return new Date(year, month, 1).getDay();
    }
    function renderCalendarGrid() {
        if (!calendarGrid) return;
        const now = new Date();
        let year = now.getFullYear();
        let month = now.getMonth();
        calendarGrid.innerHTML = '';
        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.marginBottom = '0.5rem';
        const prevBtn = document.createElement('button');
        prevBtn.textContent = '<';
        const nextBtn = document.createElement('button');
        nextBtn.textContent = '>';
        const monthLabel = document.createElement('span');
        monthLabel.textContent = now.toLocaleString('default', { month: 'long', year: 'numeric' });
        header.appendChild(prevBtn);
        header.appendChild(monthLabel);
        header.appendChild(nextBtn);
        calendarGrid.appendChild(header);
        const daysRow = document.createElement('div');
        daysRow.style.display = 'grid';
        daysRow.style.gridTemplateColumns = 'repeat(7,1fr)';
        daysRow.style.fontWeight = 'bold';
        ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(d => {
            const day = document.createElement('div');
            day.textContent = d;
            daysRow.appendChild(day);
        });
        calendarGrid.appendChild(daysRow);
        const days = getMonthDays(year, month);
        const firstDay = getFirstDayOfWeek(year, month);
        const grid = document.createElement('div');
        grid.className = 'grid';
        for (let i = 0; i < firstDay; i++) {
            grid.appendChild(document.createElement('div'));
        }
        for (let d = 1; d <= days; d++) {
            const cell = document.createElement('div');
            cell.textContent = d;
            cell.style.cursor = 'pointer';
            cell.style.padding = '0.5rem';
            cell.style.borderRadius = '0.5rem';
            cell.onclick = () => openCalendarEventModal(`${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`);
            // Mark if event exists
            if (calendarEvents.some(ev => ev.date === `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`)) {
                cell.classList.add('has-event');
            }
            grid.appendChild(cell);
        }
        calendarGrid.appendChild(grid);
    }
    function openCalendarEventModal(dateStr) {
        selectedCalendarDate = dateStr;
        calendarModalDate.textContent = `Events for ${dateStr}`;
        calendarEventModal.style.display = 'block';
        renderCalendarModalEvents();
    }
    function closeCalendarEventModal() {
        calendarEventModal.style.display = 'none';
        selectedCalendarDate = null;
    }
    function renderCalendarModalEvents() {
        if (!calendarModalEventList) return;
        calendarModalEventList.innerHTML = '';
        const events = calendarEvents.filter(ev => ev.date === selectedCalendarDate);
        if (events.length === 0) {
            calendarModalEventList.innerHTML = '<li>No events for this date.</li>';
            return;
        }
        events.forEach((ev, idx) => {
            const li = document.createElement('li');
            li.textContent = ev.title;
            const delBtn = document.createElement('button');
            delBtn.textContent = '❌';
            delBtn.onclick = () => {
                const i = calendarEvents.findIndex(e => e.date === selectedCalendarDate && e.title === ev.title);
                if (i > -1) {
                    calendarEvents.splice(i, 1);
                    localStorage.setItem('calendarEvents', JSON.stringify(calendarEvents));
                    renderCalendarModalEvents();
                    renderCalendarGrid();
                }
            };
            li.appendChild(delBtn);
            calendarModalEventList.appendChild(li);
        });
    }
    if (calendarEventForm) {
        calendarEventForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!calendarEventTitle.value || !selectedCalendarDate) return;
            calendarEvents.push({ date: selectedCalendarDate, title: calendarEventTitle.value });
            localStorage.setItem('calendarEvents', JSON.stringify(calendarEvents));
            calendarEventTitle.value = '';
            renderCalendarModalEvents();
            updateCalendarUI();
        });
    }
    if (calendarModalClose) {
        calendarModalClose.addEventListener('click', closeCalendarEventModal);
    }
    updateCalendarUI();

    // --- Upcoming Events Below Calendar ---
    function renderUpcomingEvents() {
        const upcomingList = document.getElementById('upcoming-events-list');
        if (!upcomingList) return;
        const today = new Date();
        const upcoming = calendarEvents
            .filter(ev => new Date(ev.date) >= new Date(today.getFullYear(), today.getMonth(), today.getDate()))
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(0, 5);
        upcomingList.innerHTML = '';
        if (upcoming.length === 0) {
            upcomingList.innerHTML = '<li>No upcoming events.</li>';
            return;
        }
        upcoming.forEach(ev => {
            const li = document.createElement('li');
            li.innerHTML = `<span class="event-date">${ev.date}</span> <span>${ev.title}</span>`;
            upcomingList.appendChild(li);
        });
    }

    // Call after any event change
    function updateCalendarUI() {
        renderCalendarGrid();
        renderUpcomingEvents();
    }

    // --- Simple Focus Timer Logic ---
    const simpleTimerForm = document.getElementById('simple-timer-form');
    const simpleTimerMinutesInput = document.getElementById('simple-timer-minutes');
    const simpleTimerDisplay = document.getElementById('simple-timer-display');
    const simpleTimerLabel = document.getElementById('simple-timer-label');
    const simpleTimerResetBtn = document.getElementById('simple-timer-reset');
    let simpleTimerInterval = null;
    let simpleTimerRemaining = 0;

    function updateSimpleTimerDisplay() {
        const min = Math.floor(simpleTimerRemaining / 60);
        const sec = Math.floor(simpleTimerRemaining % 60);
        simpleTimerDisplay.textContent = `${min < 10 ? '0' : ''}${min}:${sec < 10 ? '0' : ''}${sec}`;
    }
    function startSimpleTimer(minutes) {
        if (simpleTimerInterval) clearInterval(simpleTimerInterval);
        simpleTimerRemaining = minutes * 60;
        updateSimpleTimerDisplay();
        simpleTimerLabel.textContent = 'Focus';
        simpleTimerInterval = setInterval(() => {
            simpleTimerRemaining--;
            updateSimpleTimerDisplay();
            if (simpleTimerRemaining <= 0) {
                clearInterval(simpleTimerInterval);
                simpleTimerLabel.textContent = 'Time is up!';
                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification('Focusly Timer', { body: 'Time is up! Take a break.', icon: 'https://cdn-icons-png.flaticon.com/512/149/149271.png' });
                }
            }
        }, 1000);
    }
    if (simpleTimerForm) {
        simpleTimerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const minutes = parseInt(simpleTimerMinutesInput.value);
            if (!minutes || minutes < 1) {
                alert('Enter valid minutes!');
                return;
            }
            startSimpleTimer(minutes);
        });
    }
    if (simpleTimerResetBtn) {
        simpleTimerResetBtn.addEventListener('click', () => {
            if (simpleTimerInterval) clearInterval(simpleTimerInterval);
            simpleTimerRemaining = 0;
            updateSimpleTimerDisplay();
            simpleTimerLabel.textContent = 'Focus';
        });
    }
    // Set initial display
    if (simpleTimerDisplay) simpleTimerDisplay.textContent = '00:00';

    // --- Exam Checklist Navigation and Logic ---
    const navExamChecklist = document.getElementById('nav-exam-checklist');
    const examChecklistView = document.getElementById('exam-checklist-view');
    
    function showView(view) {
        dashboardView.style.display = 'none';
        tasksView.style.display = 'none';
        focusTimerView.style.display = 'none';
        calendarView.style.display = 'none';
        if (examChecklistView) examChecklistView.style.display = 'none';
        if (timetableView) timetableView.style.display = 'none';
        // Remove 'active' from all nav links
        navLinks.forEach(link => link.classList.remove('active'));
        // Show the selected view and set active nav
        if (view === 'dashboard') {
            dashboardView.style.display = 'block';
            navDashboard.classList.add('active');
        } else if (view === 'tasks') {
            tasksView.style.display = 'block';
            navTasks.classList.add('active');
        } else if (view === 'focus-timer') {
            focusTimerView.style.display = 'block';
            navFocusTimer.classList.add('active');
        } else if (view === 'calendar') {
            calendarView.style.display = 'block';
            navCalendar.classList.add('active');
        } else if (view === 'exam-checklist' && examChecklistView) {
            examChecklistView.style.display = 'block';
            navExamChecklist.classList.add('active');
            renderExamChecklist();
        } else if (view === 'timetable' && timetableView) {
            timetableView.style.display = 'block';
            navTimetable.classList.add('active');
            renderTimetableTable();
        }
    }
    
    if (navExamChecklist) {
        navExamChecklist.addEventListener('click', (e) => {
            e.preventDefault();
            showView('exam-checklist');
        });
    }

    // --- Exam Checklist Data Management ---
    let examData = JSON.parse(localStorage.getItem('examData')) || {};
    let userSubjects = JSON.parse(localStorage.getItem('userSubjects')) || [];
    
    const subjectIcons = {
        'Mathematics': '📐',
        'Physics': '⚡',
        'Chemistry': '🧪',
        'Biology': '🧬',
        'English': '📖',
        'History': '📜',
        'Geography': '🌍',
        'Computer Science': '💻',
        'Economics': '💰',
        'Political Science': '🏛️',
        'Literature': '📚',
        'Science': '🔬'
    };

    const recommendedSubjects = [
        'Mathematics', 'Physics', 'Chemistry', 'Biology', 
        'English', 'History', 'Geography', 'Computer Science'
    ];

    // Syllabus chapters data (simplified version)
    const syllabusChapters = {
        'Class 10': {
            'CBSE': {
                'Mathematics': [
                    'Real Numbers', 'Polynomials', 'Pair of Linear Equations', 'Quadratic Equations',
                    'Arithmetic Progressions', 'Triangles', 'Coordinate Geometry', 'Introduction to Trigonometry',
                    'Applications of Trigonometry', 'Circles', 'Constructions', 'Areas Related to Circles',
                    'Surface Areas and Volumes', 'Statistics', 'Probability'
                ],
                'Physics': [
                    'Light - Reflection and Refraction', 'Human Eye and Colourful World', 'Electricity',
                    'Magnetic Effects of Electric Current', 'Sources of Energy', 'Our Environment',
                    'Management of Natural Resources'
                ],
                'Chemistry': [
                    'Chemical Reactions and Equations', 'Acids, Bases and Salts', 'Metals and Non-metals',
                    'Carbon and its Compounds', 'Periodic Classification of Elements'
                ],
                'Biology': [
                    'Life Processes', 'Control and Coordination', 'How do Organisms Reproduce?',
                    'Heredity and Evolution', 'Our Environment', 'Management of Natural Resources'
                ]
            }
        }
    };

    function saveExamData() {
        localStorage.setItem('examData', JSON.stringify(examData));
        localStorage.setItem('userSubjects', JSON.stringify(userSubjects));
    }

    function renderExamChecklist() {
        updateExamStats();
        renderSubjects();
    }

    function updateExamStats() {
        const totalSubjects = userSubjects.length;
        let completedChapters = 0;
        let totalChapters = 0;
        let daysRemaining = '-';

        userSubjects.forEach(subject => {
            if (examData[subject] && examData[subject].tasks) {
                totalChapters += examData[subject].tasks.length;
                completedChapters += examData[subject].tasks.filter(task => task.completed).length;
            }
        });

        // Calculate days remaining
        const now = new Date();
        const examDates = userSubjects
            .map(subject => examData[subject]?.examDate)
            .filter(date => date)
            .map(date => new Date(date))
            .filter(date => date > now);

        if (examDates.length > 0) {
            const nearestExam = new Date(Math.min(...examDates));
            const diffTime = nearestExam - now;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            daysRemaining = diffDays > 0 ? diffDays : 0;
        }

        document.getElementById('totalSubjects').textContent = totalSubjects;
        document.getElementById('completedChapters').textContent = completedChapters;
        document.getElementById('daysRemaining').textContent = daysRemaining;
    }

    function renderSubjects() {
        const grid = document.getElementById('subjectsGrid');
        const emptyState = document.getElementById('emptyState');
        if (!grid) return;
        grid.innerHTML = '';
        if (userSubjects.length === 0) {
            if (emptyState) emptyState.style.display = 'block';
            return;
        }
        if (emptyState) emptyState.style.display = 'none';
        userSubjects.forEach(subjectName => {
            const subjectData = examData[subjectName] || {};
            const tasks = subjectData.tasks || [];
            const completedTasks = tasks.filter(task => task.completed).length;
            const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
            const noDate = !subjectData.examDate;
            const card = document.createElement('div');
            card.className = 'modern-subject-card';
            card.innerHTML = `
                <div class="subject-card-header">
                    <div class="subject-card-title">
                        <div class="subject-card-icon">${subjectIcons[subjectName] || '📚'}</div>
                        <div class="subject-card-info">
                            <h3>${subjectName}</h3>
                            <div class="subject-card-meta">
                                <span class="subject-meta-tag">${subjectData.className || 'Class 10'}</span>
                                ${subjectData.examDate ? `<span class="subject-meta-tag exam-date">📅 ${subjectData.examDate}</span>` : ''}
                            </div>
                        </div>
                    </div>
                    <button onclick="removeSubject('${subjectName}')" class="modern-chapter-btn delete" title="Remove subject">🗑️</button>
                </div>
                <div class="subject-progress-section">
                    <div class="progress-header">
                        <span class="progress-text">${completedTasks} of ${tasks.length} chapters completed</span>
                        <span class="progress-percentage">${progress}%</span>
                    </div>
                    <div class="modern-progress-bar">
                        <div class="modern-progress-fill" style="width: ${progress}%"></div>
                    </div>
                </div>
                <div class="subject-actions-section">
                    <button class="modern-action-btn" onclick="openChapterModal('${subjectName}')">
                        ➕ Add Chapter
                    </button>
                </div>
                ${noDate ? `<div style='color:#ef4444;font-size:0.95rem;margin-bottom:1rem;padding:0.8rem;background:#fef2f2;border-radius:0.8rem;border:1px solid #fecaca;'>⚠️ Please set the exam date before adding chapters.</div>` : ''}
                <form class="add-chapter-form" onsubmit="addChapterTask(event, '${subjectName}')">
                    <input type="text" class="modern-chapter-input" placeholder="Quick add chapter..." required ${noDate ? 'disabled' : ''}>
                    <button type="submit" class="modern-action-btn primary" ${noDate ? 'disabled' : ''}>
                        ➕
                    </button>
                </form>
                <ul class="modern-chapters-list" id="checklist-${subjectName}"></ul>
            `;
            grid.appendChild(card);
            renderTasks(subjectName);
        });
    }

    function renderTasks(subject) {
        const checklist = document.getElementById(`checklist-${subject}`);
        if (!checklist) return;
        
        const tasks = examData[subject]?.tasks || [];
        
        if (tasks.length === 0) {
            checklist.innerHTML = '<li style="color: #64748b; font-style: italic; text-align: center; padding: 2rem;">No chapters added yet. Add your first chapter above!</li>';
            return;
        }
        
        checklist.innerHTML = tasks.map((task, index) => `
            <li class="modern-chapter-item ${task.completed ? 'completed' : ''}">
                <input type="checkbox" 
                       class="modern-chapter-checkbox"
                       ${task.completed ? 'checked' : ''} 
                       onchange="toggleTask('${subject}', ${index})">
                <span class="modern-chapter-text">${task.text}</span>
                <div class="modern-chapter-actions">
                    <button class="modern-chapter-btn edit" onclick="editTask('${subject}', ${index})" title="Edit">✏️</button>
                    <button class="modern-chapter-btn delete" onclick="deleteTask('${subject}', ${index})" title="Delete">🗑️</button>
                </div>
            </li>
        `).join('');
    }

    function addChapterTask(event, subject) {
        event.preventDefault();
        const form = event.target;
        const input = form.querySelector('.modern-chapter-input');
        const text = input.value.trim();
        if (!text) return;
        if (!examData[subject]) {
            examData[subject] = { tasks: [] };
        }
        examData[subject].tasks.push({ text, completed: false });
        saveExamData();
        input.value = '';
        renderTasks(subject);
        updateExamStats();
        // Check if all chapters are completed
        const tasks = examData[subject].tasks;
        if (tasks.length > 0 && tasks.every(t => t.completed)) {
            showCongratsModal();
        }
    }

    function toggleTask(subject, index) {
        examData[subject].tasks[index].completed = !examData[subject].tasks[index].completed;
        saveExamData();
        renderTasks(subject);
        updateExamStats();
        
        // Check if all chapters are completed
        const tasks = examData[subject].tasks;
        if (tasks.length > 0 && tasks.every(t => t.completed)) {
            showCongratsModal();
        }
    }

    function editTask(subject, index) {
        const newText = prompt('Edit chapter:', examData[subject].tasks[index].text);
        if (newText && newText.trim()) {
            examData[subject].tasks[index].text = newText.trim();
            saveExamData();
            renderTasks(subject);
        }
    }

    function deleteTask(subject, index) {
        if (confirm('Are you sure you want to delete this chapter?')) {
            examData[subject].tasks.splice(index, 1);
            saveExamData();
            renderTasks(subject);
            updateExamStats();
        }
    }

    function generateAISuggestions(subject) {
        const aiBox = document.getElementById(`ai-${subject}`);
        const suggestionsDiv = document.getElementById(`suggestions-${subject}`);
        
        if (aiBox.style.display === 'none') {
            aiBox.style.display = 'block';
            
            const subjectData = examData[subject];
            const className = subjectData.className || 'Class 10';
            const syllabus = subjectData.syllabus || 'CBSE';
            
            const availableChapters = syllabusChapters[className]?.[syllabus]?.[subject] || [];
            
            if (availableChapters.length > 0) {
                suggestionsDiv.innerHTML = `
                    <div style="margin-bottom: 1rem; color: #64748b; font-size: 0.9rem;">
                        ${syllabus} ${className} - ${subject} Chapters:
                    </div>
                    <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                        ${availableChapters.map((chapter, index) => `
                            <button onclick="addChapterAsTask('${subject}', '${chapter}')" 
                                    class="suggestion-tag">
                                Chapter ${index + 1}: ${chapter}
                            </button>
                        `).join('')}
                    </div>
                `;
            } else {
                suggestionsDiv.innerHTML = `
                    <div style="color: #64748b; text-align: center; padding: 1rem;">
                        No syllabus chapters available for ${subject} in ${className}. 
                        You can manually add topics using the input field above.
                    </div>
                `;
            }
        } else {
            aiBox.style.display = 'none';
        }
    }

    function addChapterAsTask(subject, chapter) {
        if (!examData[subject]) {
            examData[subject] = { tasks: [] };
        }
        
        // Check if chapter already exists
        const exists = examData[subject].tasks.some(task => task.text === chapter);
        if (exists) {
            alert('This chapter is already added!');
            return;
        }
        
        examData[subject].tasks.push({ text: chapter, completed: false });
        saveExamData();
        renderTasks(subject);
        updateExamStats();
    }

    function removeSubject(subjectName) {
        if (confirm(`Are you sure you want to remove "${subjectName}" and all its chapters?`)) {
            const index = userSubjects.indexOf(subjectName);
            if (index > -1) {
                userSubjects.splice(index, 1);
            }
            delete examData[subjectName];
            saveExamData();
            renderSubjects();
            updateExamStats();
        }
    }

    // --- Modal Functions ---
    function openModal() {
        document.getElementById('subjectModal').style.display = 'flex';
    }

    function closeModal() {
        document.getElementById('subjectModal').style.display = 'none';
        document.getElementById('subjectForm').reset();
    }

    function showCongratsModal() {
        document.getElementById('congratsModal').style.display = 'flex';
    }

    function closeCongratsModal() {
        document.getElementById('congratsModal').style.display = 'none';
    }

    // Add subject button event listener
    const addSubjectBtn = document.getElementById('addSubjectBtn');
    if (addSubjectBtn) {
        addSubjectBtn.addEventListener('click', openModal);
    }

    // Subject form submission
    const subjectForm = document.getElementById('subjectForm');
    if (subjectForm) {
        subjectForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const subjectName = document.getElementById('modalSubjectName').value.trim();
            const className = document.getElementById('modalClassName').value;
            const examDate = document.getElementById('modalExamDate').value;
            if (!subjectName || !className || !examDate) {
                alert('Please fill in all required fields!');
                return;
            }
            if (userSubjects.includes(subjectName)) {
                alert('This subject already exists!');
                return;
            }
            userSubjects.push(subjectName);
            examData[subjectName] = {
                className,
                examDate,
                tasks: []
            };
            saveExamData();
            closeModal();
            renderSubjects();
            updateExamStats();
        });
    }

    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        const subjectModal = document.getElementById('subjectModal');
        const congratsModal = document.getElementById('congratsModal');
        
        if (e.target === subjectModal) {
            closeModal();
        }
        if (e.target === congratsModal) {
            closeCongratsModal();
        }
    });

    // Make functions globally available
    window.openModal = openModal;
    window.closeModal = closeModal;
    window.closeCongratsModal = closeCongratsModal;
    window.addTask = addTask;
    window.toggleTask = toggleTask;
    window.editTask = editTask;
    window.deleteTask = deleteTask;
    window.generateAISuggestions = generateAISuggestions;
    window.addChapterAsTask = addChapterAsTask;
    window.removeSubject = removeSubject;

    function openChapterModal(subjectName) {
        const modal = document.getElementById('chapterModal');
        const subtitle = document.getElementById('chapterModalSubtitle');
        if (subtitle) {
            subtitle.textContent = `Add a new chapter to ${subjectName}`;
        }
        modal.style.display = 'flex';
        window.currentSubject = subjectName;
    }

    function closeChapterModal() {
        document.getElementById('chapterModal').style.display = 'none';
        document.getElementById('chapterForm').reset();
        window.currentSubject = null;
    }

    function closeSuccessModal() {
        document.getElementById('successModal').style.display = 'none';
    }

    function exportData() {
        const data = {
            subjects: userSubjects,
            examData: examData,
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `exam-checklist-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = JSON.parse(e.target.result);
                        if (data.subjects && data.examData) {
                            userSubjects = data.subjects;
                            examData = data.examData;
                            saveExamData();
                            renderSubjects();
                            updateExamStats();
                            alert('Data imported successfully!');
                        } else {
                            alert('Invalid file format');
                        }
                    } catch (error) {
                        alert('Error reading file');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }

    function viewNotes(subjectName) {
        const notes = examData[subjectName]?.notes || 'No notes available';
        alert(`Notes for ${subjectName}:\n\n${notes}`);
    }

    // Chapter form submission
    const chapterForm = document.getElementById('chapterForm');
    if (chapterForm) {
        chapterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const chapterName = document.getElementById('chapterName').value.trim();
            if (!chapterName || !window.currentSubject) return;
            if (!examData[window.currentSubject]) {
                examData[window.currentSubject] = { tasks: [] };
            }
            // Check if chapter already exists
            const exists = examData[window.currentSubject].tasks.some(task => task.text === chapterName);
            if (exists) {
                alert('This chapter is already added!');
                return;
            }
            examData[window.currentSubject].tasks.push({ 
                text: chapterName, 
                completed: false
            });
            saveExamData();
            closeChapterModal();
            renderTasks(window.currentSubject);
            updateExamStats();
        });
    }

    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        const subjectModal = document.getElementById('subjectModal');
        const chapterModal = document.getElementById('chapterModal');
        const successModal = document.getElementById('successModal');
        
        if (e.target.classList.contains('modal-overlay')) {
            if (subjectModal && e.target.parentElement === subjectModal) {
                closeModal();
            }
            if (chapterModal && e.target.parentElement === chapterModal) {
                closeChapterModal();
            }
            if (successModal && e.target.parentElement === successModal) {
                closeSuccessModal();
            }
        }
    });

    // Make functions globally available
    window.openModal = openModal;
    window.closeModal = closeModal;
    window.closeChapterModal = closeChapterModal;
    window.closeSuccessModal = closeSuccessModal;
    window.addTask = addTask;
    window.toggleTask = toggleTask;
    window.editTask = editTask;
    window.deleteTask = deleteTask;
    window.generateAISuggestions = generateAISuggestions;
    window.addChapterAsTask = addChapterAsTask;
    window.removeSubject = removeSubject;
    window.exportData = exportData;
    window.importData = importData;
    window.viewNotes = viewNotes;
    window.openChapterModal = openChapterModal;

    // --- Timetable Navigation and Logic ---
    const navTimetable = document.getElementById('nav-timetable');
    const timetableView = document.getElementById('timetable-view');
    const timetableTable = document.getElementById('timetableTable');
    const addPeriodBtn = document.getElementById('addPeriodBtn');
    const addDayBtn = document.getElementById('addDayBtn');
    const submitTimetableBtn = document.getElementById('submitTimetableBtn');
    const timetableNameInput = document.getElementById('timetableName');

    // Initial state
    let timetablePeriods = 3;
    let timetableDays = [
        { id: 1, label: 'Monday' },
        { id: 2, label: 'Tuesday' },
        { id: 3, label: 'Wednesday' },
        { id: 4, label: 'Thursday' },
        { id: 5, label: 'Friday' }
    ];
    let timetableData = {};

    function renderTimetableTable() {
        // Header row
        let html = '<tr><th>Day</th>';
        for (let i = 1; i <= timetablePeriods; i++) {
            html += `<th>Period ${i} <button type="button" class="timetable-btn btn-secondary" style="padding:0 0.5rem;font-size:1.1rem;" onclick="removePeriod(${i})">&minus;</button></th>`;
        }
        html += '</tr>';
        // Rows
        timetableDays.forEach((day, dayIdx) => {
            html += `<tr><th>${day.label}</th>`;
            for (let p = 1; p <= timetablePeriods; p++) {
                const cellId = `cell-${day.id}-${p}`;
                html += `<td><input type="text" id="${cellId}" class="form-input timetable-input" placeholder="Subject" value="${(timetableData[day.id] && timetableData[day.id][p]) || ''}" oninput="updateTimetableCell(${day.id},${p},this.value)"></td>`;
            }
            html += '</tr>';
        });
        timetableTable.innerHTML = html;
    }

    window.removePeriod = function(periodNum) {
        if (timetablePeriods > 1) {
            timetablePeriods--;
            // Remove data for the last period
            for (const day of timetableDays) {
                if (timetableData[day.id]) delete timetableData[day.id][timetablePeriods + 1];
            }
            renderTimetableTable();
        }
    };

    window.updateTimetableCell = function(dayId, period, value) {
        if (!timetableData[dayId]) timetableData[dayId] = {};
        timetableData[dayId][period] = value;
    };

    function addPeriod() {
        timetablePeriods++;
        renderTimetableTable();
    }

    function addDay() {
        const nextId = timetableDays.length > 0 ? Math.max(...timetableDays.map(d => d.id)) + 1 : 1;
        timetableDays.push({ id: nextId, label: `Day ${nextId}` });
        renderTimetableTable();
    }

    function handleTimetableSubmit() {
        const name = timetableNameInput.value.trim();
        if (!name) {
            alert('Please enter a timetable name.');
            return;
        }
        // Build JSON structure
        const days = timetableDays.map(day => {
            const periods = [];
            for (let p = 1; p <= timetablePeriods; p++) {
                const subject = (timetableData[day.id] && timetableData[day.id][p]) ? timetableData[day.id][p] : '';
                periods.push({ order: p, subject });
            }
            return { id: day.id, periods };
        });
        const body = { name, days };
        // POST request
        fetch('http://localhost:8000/api/v1/timetable/create/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        })
            .then(res => res.json())
            .then(data => {
                alert('Timetable submitted successfully!');
            })
            .catch(err => {
                alert('Error submitting timetable.');
            });
    }

    if (navTimetable) {
        navTimetable.addEventListener('click', (e) => {
            e.preventDefault();
            showView('timetable');
            renderTimetableTable();
        });
    }
    if (addPeriodBtn) addPeriodBtn.onclick = addPeriod;
    if (addDayBtn) addDayBtn.onclick = addDay;
    if (submitTimetableBtn) submitTimetableBtn.onclick = handleTimetableSubmit;

}); 