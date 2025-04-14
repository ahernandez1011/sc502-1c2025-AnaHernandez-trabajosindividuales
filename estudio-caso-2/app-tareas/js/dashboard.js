document.addEventListener('DOMContentLoaded', function () {
    const API_URL = 'backend/tasks.php';
    const COMMENTS_API_URL = 'backend/comments.php';

    let isEditMode = false;
    let editingTaskId = null;
    let tasks = [];

    async function loadTasks() {
        try {
            const response = await fetch(API_URL, { method: 'GET', credentials: 'include' });
            if (response.ok) {
                tasks = await response.json();
                renderTasks();
            } else if (response.status === 401) {
                window.location.href = 'index.html';
            } else {
                console.error('Error al obtener tareas');
            }
        } catch (error) {
            console.error(error);
        }
    }

    function renderTasks() {
        const taskList = document.getElementById('task-list');
        taskList.innerHTML = '';

        tasks.forEach(task => {
            const taskCard = document.createElement('div');
            taskCard.className = 'col-md-4 mb-3';

            let commentsHtml = '<ul class="list-group list-group-flush">';
            task.comments.forEach(comment => {
                commentsHtml += `<li class="list-group-item">
                    <strong>${comment.username}:</strong> <span class="comment-text">${comment.comment}</span>
                    ${comment.is_owner ? `
                        <button class="btn btn-sm btn-link text-primary edit-comment" data-id="${comment.id}" data-task-id="${task.id}">Editar</button>
                        <button class="btn btn-sm btn-link text-danger delete-comment" data-id="${comment.id}" data-task-id="${task.id}">Eliminar</button>
                    ` : ''}
                </li>`;
            });
            commentsHtml += '</ul>';

            taskCard.innerHTML = `
                <div class="card">
                    <div class="card-body">
                        <h5 class="card-title">${task.title}</h5>
                        <p class="card-text">${task.description}</p>
                        <p class="card-text"><small class="text-muted">Due: ${task.due_date}</small></p>
                        ${commentsHtml}
                        <button class="btn btn-sm btn-link add-comment" data-id="${task.id}">Agregar comentario</button>
                    </div>
                    <div class="card-footer d-flex justify-content-between">
                        <button class="btn btn-secondary btn-sm edit-task" data-id="${task.id}">Editar</button>
                        <button class="btn btn-danger btn-sm delete-task" data-id="${task.id}">Eliminar</button>
                    </div>
                </div>
            `;

            taskList.appendChild(taskCard);
        });

        attachEventListeners();
    }

    function attachEventListeners() {
        document.querySelectorAll('.edit-task').forEach(button => {
            button.addEventListener('click', handleEditTask);
        });

        document.querySelectorAll('.delete-task').forEach(button => {
            button.addEventListener('click', handleDeleteTask);
        });

        document.querySelectorAll('.add-comment').forEach(button => {
            button.addEventListener('click', e => {
                document.getElementById('comment-task-id').value = e.target.dataset.id;
                const modal = new bootstrap.Modal(document.getElementById('commentModal'));
                modal.show();
            });
        });

        document.querySelectorAll('.delete-comment').forEach(button => {
            button.addEventListener('click', async e => {
                const commentId = e.target.dataset.id;
                await deleteComment(commentId);
                loadTasks();
            });
        });

        document.querySelectorAll('.edit-comment').forEach(button => {
            button.addEventListener('click', async e => {
                const commentId = e.target.dataset.id;
                const taskId = e.target.dataset.taskId;

                const task = tasks.find(t => t.id == taskId);
                const comment = task.comments.find(c => c.id == commentId);

                const newComment = prompt('Edita tu comentario:', comment.comment);
                if (newComment && newComment.trim() !== '') {
                    await updateComment(commentId, newComment.trim());
                    loadTasks();
                }
            });
        });
    }

    async function deleteComment(commentId) {
        try {
            await fetch(`${COMMENTS_API_URL}?id=${commentId}`, {
                method: 'DELETE',
                credentials: 'include'
            });
        } catch (error) {
            console.error('Error al eliminar comentario:', error);
        }
    }

    async function updateComment(commentId, newCommentText) {
        try {
            await fetch(`${COMMENTS_API_URL}?id=${commentId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ comment: newCommentText }),
                credentials: 'include'
            });
        } catch (error) {
            console.error('Error al actualizar comentario:', error);
        }
    }

    async function handleDeleteTask(event) {
        const id = parseInt(event.target.dataset.id);
        try {
            await fetch(`${API_URL}?id=${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            loadTasks();
        } catch (error) {
            console.error('Error al eliminar tarea:', error);
        }
    }

    function handleEditTask(event) {
        const taskId = parseInt(event.target.dataset.id);
        const task = tasks.find(t => t.id === taskId);

        document.getElementById('task-title').value = task.title;
        document.getElementById('task-desc').value = task.description;
        document.getElementById('due-date').value = task.due_date;

        isEditMode = true;
        editingTaskId = taskId;

        const modal = new bootstrap.Modal(document.getElementById('taskModal'));
        modal.show();
    }

    document.getElementById('comment-form').addEventListener('submit', async function (e) {
        e.preventDefault();
        const comment = document.getElementById('task-comment').value.trim();
        const taskId = parseInt(document.getElementById('comment-task-id').value);

        if (!comment) {
            alert('El comentario no puede estar vacío.');
            return;
        }

        try {
            await fetch(`${COMMENTS_API_URL}?task_id=${taskId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ comment }),
                credentials: 'include'
            });

            const modal = bootstrap.Modal.getInstance(document.getElementById('commentModal'));
            modal.hide();
            loadTasks();
        } catch (error) {
            console.error('Error al agregar comentario:', error);
        }
    });

    document.getElementById('task-form').addEventListener('submit', async function (e) {
        e.preventDefault();
        const title = document.getElementById('task-title').value;
        const description = document.getElementById('task-desc').value;
        const dueDate = document.getElementById('due-date').value;

        const payload = { title, description, due_date: dueDate };
        const method = isEditMode ? 'PUT' : 'POST';
        const url = isEditMode ? `${API_URL}?id=${editingTaskId}` : API_URL;

        try {
            await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                credentials: 'include'
            });

            const modal = bootstrap.Modal.getInstance(document.getElementById('taskModal'));
            modal.hide();
            loadTasks();
        } catch (error) {
            console.error('Error al guardar tarea:', error);
        }
    });

    document.getElementById('commentModal').addEventListener('show.bs.modal', () => {
        document.getElementById('comment-form').reset();
    });

    document.getElementById('taskModal').addEventListener('show.bs.modal', () => {
        if (!isEditMode) {
            document.getElementById('task-form').reset();
        }
    });

    document.getElementById('taskModal').addEventListener('hidden.bs.modal', () => {
        isEditMode = false;
        editingTaskId = null;
    });

    loadTasks();
});
