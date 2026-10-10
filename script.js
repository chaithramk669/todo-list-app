
const form = document.getElementById("task-form");
const input = document.getElementById("task-input");
const taskList = document.getElementById("task-list");
const emptyState = document.getElementById("empty-state");
const taskCount = document.getElementById("task-count");
const totalCount = document.getElementById("total-count");
const filters = document.querySelector(".filters");
const clearCompleted = document.getElementById("clear-completed");
const message = document.getElementById("message");

const STORAGE_KEY = "todo-list-tasks";

let tasks = loadTasks();
let currentFilter = "all";

// Load saved tasks.
function loadTasks() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        const data = saved ? JSON.parse(saved) : [];

        if (!Array.isArray(data)) return [];

        return data.filter(task =>
            task &&
            typeof task.id === "string" &&
            typeof task.text === "string" &&
            typeof task.completed === "boolean"
        );
    } catch (error) {
        console.error("Error loading tasks:", error);
        return [];
    }
}

// Save tasks in browser local storage.
function saveTasks() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
        return true;
    } catch (error) {
        console.error("Error saving tasks:", error);
        message.textContent = "Could not save tasks in browser storage.";
        return false;
    }
}

// CREATE: Add a task.
function addTask(text) {
    tasks.unshift({
        id: crypto.randomUUID(),
        text: text,
        completed: false
    });

    saveTasks();
    renderTasks();
}

// READ: Render the task list dynamically.
function renderTasks() {
    taskList.replaceChildren();

    const visibleTasks = tasks.filter(task => {
        if (currentFilter === "active") return !task.completed;
        if (currentFilter === "completed") return task.completed;
        return true;
    });

    visibleTasks.forEach(task => {
        const li = document.createElement("li");
        li.className = "task-item";
        li.dataset.id = task.id;

        if (task.completed) {
            li.classList.add("completed");
        }

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = task.completed;
        checkbox.className = "task-check";
        checkbox.dataset.action = "toggle";
        checkbox.setAttribute("aria-label", `Complete ${task.text}`);

        const text = document.createElement("span");
        text.className = "task-text";
        text.textContent = task.text;

        const actions = document.createElement("div");
        actions.className = "task-actions";

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.textContent = "Edit";
        editButton.className = "edit-btn";
        editButton.dataset.action = "edit";
        editButton.setAttribute("aria-label", `Edit ${task.text}`);

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "Delete";
        deleteButton.className = "delete-btn";
        deleteButton.dataset.action = "delete";
        deleteButton.setAttribute("aria-label", `Delete ${task.text}`);

        actions.append(editButton, deleteButton);
        li.append(checkbox, text, actions);
        taskList.appendChild(li);
    });

    const remaining = tasks.filter(task => !task.completed).length;

    taskCount.textContent =
        `${remaining} tasks remaining`;

    totalCount.textContent =
        `${tasks.length} total tasks`;

    emptyState.hidden = visibleTasks.length > 0;
    taskList.hidden = visibleTasks.length === 0;

    if (tasks.length === 0) {
        emptyState.textContent = "No tasks yet. Add your first task!";
    } else if (visibleTasks.length === 0) {
        emptyState.textContent = "No tasks match this filter.";
    }

    clearCompleted.disabled = !tasks.some(task => task.completed);
}

// Handle form submission.
form.addEventListener("submit", event => {
    event.preventDefault();

    const text = input.value.trim();

    if (!text) {
        message.textContent = "Please enter a task.";
        return;
    }

    if (text.length > 200) {
        message.textContent = "Tasks must be 200 characters or fewer.";
        return;
    }

    addTask(text);
    input.value = "";
    message.textContent = "Task added successfully.";
    input.focus();
});

// EVENT DELEGATION: Edit and delete dynamically created tasks.
taskList.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const li = button.closest(".task-item");
    if (!li) return;

    const id = li.dataset.id;
    const action = button.dataset.action;

    if (action === "edit") {
        const task = tasks.find(task => task.id === id);
        if (!task) return;

        const updatedText = prompt("Edit task:", task.text);
        if (updatedText === null) return;

        const trimmed = updatedText.trim();

        if (!trimmed || trimmed.length > 200) {
            message.textContent =
                "Enter a task between 1 and 200 characters.";
            return;
        }

        task.text = trimmed;
        saveTasks();
        renderTasks();
        message.textContent = "Task updated successfully.";
    }

    if (action === "delete") {
        tasks = tasks.filter(task => task.id !== id);
        saveTasks();
        renderTasks();
        message.textContent = "Task deleted successfully.";
    }
});

// UPDATE: Toggle task completion.
taskList.addEventListener("change", event => {
    if (!event.target.matches('[data-action="toggle"]')) return;

    const li = event.target.closest(".task-item");
    if (!li) return;

    const task = tasks.find(task => task.id === li.dataset.id);
    if (!task) return;

    task.completed = event.target.checked;
    saveTasks();
    renderTasks();
});

// FILTER: All, Active, Completed.
filters.addEventListener("click", event => {
    const button = event.target.closest("[data-filter]");
    if (!button) return;

    currentFilter = button.dataset.filter;

    filters.querySelectorAll("[data-filter]").forEach(filter => {
        const active = filter === button;
        filter.classList.toggle("active", active);
        filter.setAttribute("aria-pressed", String(active));
    });

    renderTasks();
});

// DELETE: Clear all completed tasks.
clearCompleted.addEventListener("click", () => {
    tasks = tasks.filter(task => !task.completed);
    saveTasks();
    renderTasks();
    message.textContent = "Completed tasks cleared.";
});

// Initial application render.
renderTasks();
