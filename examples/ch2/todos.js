// State of the app
const todos = [
	{ description: 'Walk the dog', done: false },
	{ description: 'Water the plants', done: false },
	{ description: 'Sand the chairs', done: false },
];

// HTML element references
const addTodoInput = document.getElementById('todo-input');
const addTodoButton = document.getElementById('add-todo-btn');
const todosList = document.getElementById('todos-list');

function init() {
	// Initialize the view.
	for (const todo of todos) {
		todosList.append(renderTodoInReadMode(todo));
	}

	// Check if the input value is longer than 3 characters.
	addTodoInput.addEventListener('input', () => {
		addTodoButton.disabled = addTodoInput.value.length < 3;
	});

	addTodoInput.addEventListener('keydown', (e) => {
		const { key } = e;
		if (key === 'Enter' && addTodoInput.value.length >= 3) {
			addTodo();
		}
	});

	addTodoButton.addEventListener('click', () => {
		addTodo();
	});
}
init();

function renderTodoInReadMode(todo) {
	const li = document.createElement('li');

	const span = document.createElement('span');
	span.textContent = todo.description;

	if (todo.done) {
		span.classList.add('done');
	}

	if (!todo.done) {
		span.addEventListener('dblclick', () => {
			const idx = todos.indexOf(todo);
			todosList.replaceChild(
				renderToDoInEditMode(todo),
				todosList.childNodes[idx]
			);
		});
	}

	li.append(span);

	if (!todo.done) {
		const button = document.createElement('button');
		button.textContent = 'Done';
		button.addEventListener('click', () => {
			const idx = todos.indexOf(todo);
			removeTodo(idx);
		});
		li.append(button);
	}

	return li;
}

function renderToDoInEditMode(todo) {
	const li = document.createElement('li');

	const input = document.createElement('input');
	input.type = 'text';
	input.value = todo.description;
	li.append(input);

	const saveBtn = document.createElement('button');
	saveBtn.textContent = 'Save';
	saveBtn.addEventListener('click', () => {
		const idx = todos.indexOf(todo);
		updateTodo(idx, input.value);
	});
	li.append(saveBtn);

	const cancelBtn = document.createElement('button');
	cancelBtn.textContent = 'Cancel';
	cancelBtn.addEventListener('click', () => {
		const idx = todos.indexOf(todo);
		todosList.replaceChild(
			renderTodoInReadMode(todo),
			todosList.childNodes[idx]
		);
	});
	li.append(cancelBtn);

	return li;
}

function addTodo() {
	const description = addTodoInput.value;
	if (isTodoExisted(description)) {
		alert('Todo already exists');
		return;
	}

	const todoInState = { description, done: false };
	todos.push(todoInState);
	const todo = renderTodoInReadMode(todoInState);
	todosList.append(todo);

	addTodoInput.value = '';
	addTodoButton.disabled = true;
}

function removeTodo(index) {
	todos[index].done = true;
	const todo = renderTodoInReadMode(todos[index]);
	todosList.replaceChild(todo, todosList.childNodes[index]);
}

function updateTodo(index, description) {
	const todoInState = { description, done: false };
	todos[index] = todoInState;
	const todo = renderTodoInReadMode(todoInState);
	todosList.replaceChild(todo, todosList.childNodes[index]);
}

function isTodoExisted(description) {
	const cleanTodos = todos.map((todo) => {
		return todo.description.trim().toLowerCase();
	});
	return cleanTodos.includes(description.trim().toLowerCase());
}
