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
        switchView('dashboard');
    });
    navTasks.addEventListener('click', (e) => {
        e.preventDefault();
        switchView('tasks');
    });

    if (navFocusTimer) {
        navFocusTimer.addEventListener('click', (e) => {
            e.preventDefault();
            switchView('focus-timer');
        });
    }
    if (navCalendar) {
        navCalendar.addEventListener('click', (e) => {
            e.preventDefault();
            switchView('calendar');
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

    // --- AI For Doubts Navigation and Chat Logic ---
    const navAIDoubts = document.getElementById('nav-ai-doubts');
    const aiDoubtsView = document.getElementById('ai-doubts-view');
    const aiChatHistory = document.getElementById('ai-chat-history');
    const aiChatForm = document.getElementById('ai-chat-form');
    const aiChatInput = document.getElementById('ai-chat-input');
    const aiChatLoading = document.getElementById('ai-chat-loading');
    function showView(view) {
        dashboardView.style.display = 'none';
        tasksView.style.display = 'none';
        focusTimerView.style.display = 'none';
        calendarView.style.display = 'none';
        if (aiDoubtsView) aiDoubtsView.style.display = 'none';
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
        } else if (view === 'ai-doubts' && aiDoubtsView) {
            aiDoubtsView.style.display = 'block';
            navAIDoubts.classList.add('active');
        }
    }
    if (navAIDoubts) {
        navAIDoubts.addEventListener('click', (e) => {
            e.preventDefault();
            showView('ai-doubts');
        });
    }
    // Basic AI response logic
    const aiAnswers = [
        { q: /hello|hi|hey/i, a: "Hello! How can I help you with your studies today?" },
        { q: /what is photosynthesis/i, a: "Photosynthesis is the process by which green plants use sunlight to synthesize foods from carbon dioxide and water." },
        { q: /who is newton/i, a: "Sir Isaac Newton was an English mathematician, physicist, astronomer, and author who is widely recognised as one of the most influential scientists of all time." },
        { q: /pythagoras/i, a: "The Pythagorean theorem states that in a right-angled triangle, the square of the hypotenuse is equal to the sum of the squares of the other two sides." },
        { q: /what is ai/i, a: "AI stands for Artificial Intelligence, which is the simulation of human intelligence in computers." },
        { q: /bye|goodbye/i, a: "Goodbye! Feel free to ask any doubt anytime." },
        { q: /how are you/i, a: "I'm just code, but I'm here to help you!" },
        { q: /integral/i, a: "An integral is a mathematical object that can be interpreted as an area or a generalization of area." },
        { q: /derivative/i, a: "A derivative represents the rate at which a function is changing at any given point." },
        { q: /thank/i, a: "You're welcome!" },
    ];
    function getAIAnswer(q) {
        for (const pair of aiAnswers) {
            if (pair.q.test(q)) return pair.a;
        }
        return "Sorry, I don't know the answer to that yet. Try asking something else!";
    }
    function appendChatBubble(text, sender) {
        const div = document.createElement('div');
        div.className = 'ai-chat-bubble ' + sender;
        div.textContent = text;
        aiChatHistory.appendChild(div);
        aiChatHistory.scrollTop = aiChatHistory.scrollHeight;
    }
    if (aiChatForm) {
        aiChatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const userMsg = aiChatInput.value.trim();
            if (!userMsg) return;
            appendChatBubble(userMsg, 'user');
            aiChatInput.value = '';
            aiChatLoading.style.display = 'flex';
            setTimeout(() => {
                aiChatLoading.style.display = 'none';
                const aiMsg = getAIAnswer(userMsg);
                appendChatBubble(aiMsg, 'ai');
            }, 1200);
        });
    }
}); 