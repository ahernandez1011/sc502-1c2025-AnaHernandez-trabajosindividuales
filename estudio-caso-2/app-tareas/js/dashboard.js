document.addEventListener('DOMContentLoaded', function () {
 
    const API_URL = "backend/tasks.php";
    let isEditMode = false;
    let edittingId;
    let tasks = [];
 
    async function loadTasks() {
        //go to the backed to obtain the data
        try {
            const response = await fetch(API_URL, { method: 'GET', credentials: 'include' });
            if (response.ok) {
                tasks = await response.json();
                renderTasks(tasks);
            } else {
                if (response.status == 401) {
                    //estamos tratando de consutlar sin sesion
                    window.location.href = "index.html";
                }
                console.error("Error al obtener tareas");
            }
 
        } catch (err) {
            console.error(err);
        }
    }
 
    function renderTasks() {
    const taskList = document.getElementById('task-list');
    taskList.innerHTML = '';
    tasks.forEach(function (task) {
        let commentsList = '';
        if (task.comments && task.comments.length > 0) {
            commentsList = '<ul class="list-group list-group-flush">';
            task.comments.forEach(comment => {
                commentsList += `<li class="list-group-item">${comment.comment}
                <button type="button" class="btn btn-sm btn-link remove-comment" data-id="${comment.id}">Remove</button>
                </li>`;
            });
            commentsList += '</ul>';
        }
        const taskCard = document.createElement('div');
        taskCard.className = 'col-md-4 mb-3';
        taskCard.innerHTML = `
        <div class="card">
            <div class="card-body">
                <h5 class="card-title">${task.title}</h5>
                <p class="card-text">${task.description}</p>
                <p class="card-text"><small class="text-muted">Due: ${task.due_date}</small> </p>
                ${commentsList}
                <button type="button" class="btn btn-sm btn-link add-comment" data-id="${task.id}">Add Comment</button>
            </div>
            <div class="card-footer d-flex justify-content-between">
                <button class="btn btn-secondary btn-sm edit-task" data-id="${task.id}">Edit</button>
                <button class="btn btn-danger btn-sm delete-task" data-id="${task.id}">Delete</button>
            </div>
        </div>
        `;
        taskList.appendChild(taskCard);
    });
 
        document.querySelectorAll('.edit-task').forEach(function (button) {
            button.addEventListener('click', handleEditTask);
        });
 
        document.querySelectorAll('.delete-task').forEach(function (button) {
            button.addEventListener('click', handleDeleteTask);
        });
 
        document.querySelectorAll('.add-comment').forEach(function (button) {
            button.addEventListener('click', function (e) {
                // alert(e.target.dataset.id);
                document.getElementById("comment-task-id").value = e.target.dataset.id;
                const modal = new bootstrap.Modal(document.getElementById("commentModal"));
                modal.show()
 
            })
        });
        document.querySelectorAll('.remove-comment').forEach(function (button) {
            button.addEventListener('click', function (e) {
                let taskId = parseInt(e.target.dataset.visitid);
                let commentId = parseInt(e.target.dataset.commentid);
                selectedTask = tasks.find(t => t.id === taskId);
                commentIndex = selectedTask.comments.findIndex(c => c.id === commentId);
                selectedTask.comments.splice(commentIndex, 1);
                loadTasks();
            })
        });
    }
 
    function handleEditTask(event) {
        try {
            // alert(event.target.dataset.id);
            //localizar la tarea quieren editar
            const taskId = parseInt(event.target.dataset.id);
            const task = tasks.find(t => t.id === taskId);
            //cargar los datos en el formulario
            document.getElementById('task-title').value = task.title;
            document.getElementById('task-desc').value = task.description;
            document.getElementById('due-date').value = task.due_date;
            //ponerlo en modo edicion
            isEditMode = true;
            edittingId = taskId;
            //mostrar el modal
            const modal = new bootstrap.Modal(document.getElementById("taskModal"));
            modal.show();
 
 
        } catch (error) {
            alert("Error trying to edit a task");
            console.error(error);
        }
    }
 

    async function handleDeleteTask(event) {
        const id = parseInt(event.target.dataset.id);
        try{
            // API_URL + '?id=' + id; otra forma de concatenar en JS
            const response = await fetch(`${API_URL}?id=${id}`,{credentials: 'include', method:'DELETE'});
            if(response.ok){
                loadTasks();
            }else{
                console.error("Problema al eliminar la tarea");
            }
        }catch(err){
            console.error(err);
        }   
    }
 
    document.getElementById('comment-form').addEventListener('submit', function (e) {
        e.preventDefault();
        const comment = document.getElementById('task-comment').value;
        const selectedTask = parseInt(document.getElementById('comment-task-id').value);
        const task = tasks.find(t => t.id === selectedTask);
 
 
        let nextCommentId = 1;
 
        if (task.comments) {
            nextCommentId = task.comments.length + 1;
        } else {
            task.comments = [];
        }
 
        task.comments.push({ id: nextCommentId, description: comment });
        const modal = bootstrap.Modal.getInstance(document.getElementById('commentModal'));
        modal.hide();
        loadTasks();
 
    })

    document.getElementById('comment-form').addEventListener('submit', async function (e) {
        e.preventDefault();
        const comment = document.getElementById('task-comment').value;
        const selectedTask = parseInt(document.getElementById('comment-task-id').value);
    
        const commentData = {
            comment: comment
        };
    
        const response = await fetch(`backend/comments.php?task_id=${selectedTask}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(commentData),
            credentials: 'include'
        });
    
        if (response.ok) {
            loadTasks(); // Recargar las tareas para mostrar el nuevo comentario
        } else {
            console.error("Error al guardar el comentario");
        }
    });
 
    document.getElementById('task-form').addEventListener('submit', async function (e) {
        e.preventDefault();
 
        const title = document.getElementById("task-title").value;
        const description = document.getElementById("task-desc").value;
        const dueDate = document.getElementById("due-date").value;
 
        if (isEditMode) {
            const response = await fetch(`${API_URL}?id=${edittingId}`,
                {
                    method: 'PUT',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ title: title, description: description, due_date: dueDate })
                });
            if (!response.ok) {
                console.error("no se pudo actualizar la tarea");
            }

        } else {
            const newTask = {
                title: title,
                description: description,
                due_date: dueDate
            };
            const response = await fetch(API_URL, {
                method: 'POST',
                headers:{
                    'Content-Type': "application/json"
                },
                body: JSON.stringify(newTask),
                credentials: 'include'
            });
            if(!response.ok){
                console.error("No se pudo agregar la tarea");
            }
        }
        const modal = bootstrap.Modal.getInstance(document.getElementById('taskModal'));
        modal.hide();
        loadTasks();
    });
 
    document.getElementById('commentModal').addEventListener('show.bs.modal', function () {
        document.getElementById('comment-form').reset();
    })
 
    document.getElementById('taskModal').addEventListener('show.bs.modal', function () {
        if (!isEditMode) {
            document.getElementById('task-form').reset();
            // document.getElementById('task-title').value = "";
            // document.getElementById('task-desc').value = "";
            // document.getElementById('due-date').value = "";
        }
    });
 
    document.getElementById("taskModal").addEventListener('hidden.bs.modal', function () {
        edittingId = null;
        isEditMode = false;
    })
    loadTasks();
});

function renderTasks() {
    const taskList = document.getElementById('task-list');
    taskList.innerHTML = '';
    tasks.forEach(function (task) {
        let commentsList = '';
        if (task.comments && task.comments.length > 0) {
            commentsList = '<ul class="list-group list-group-flush">';
            task.comments.forEach(comment => {
                commentsList += `<li class="list-group-item">${comment.description}</li>`;
            });
            commentsList += '</ul>';
        }
        const taskCard = document.createElement('div');
        taskCard.className = 'col-md-4 mb-3';
        taskCard.innerHTML = `
        <div class="card">
            <div class="card-body">
                <h5 class="card-title">${task.title}</h5>
                <p class="card-text">${task.description}</p>
                <p class="card-text"><small class="text-muted">Due: ${task.due_date}</small> </p>
                ${commentsList}
            </div>
        </div>
        `;
        taskList.appendChild(taskCard);
    });
}

document.getElementById('comment-form').addEventListener('submit', async function (e) {
    e.preventDefault(); // Prevenir el comportamiento por defecto del formulario
    const comment = document.getElementById('task-comment').value;
    const selectedTask = parseInt(document.getElementById('comment-task-id').value);

    // Crear el objeto de comentario
    const commentData = {
        comment: comment
    };

    // Enviar el comentario a la API
    const response = await fetch(`backend/comments.php?task_id=${selectedTask}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(commentData),
        credentials: 'include' // Incluir cookies para la sesión
    });

    if (response.ok) {
        // Comentario guardado exitosamente
        loadTasks(); // Recargar las tareas para mostrar el nuevo comentario
    } else {
        console.error("Error al guardar el comentario");
    }
});

document.querySelectorAll('.remove-comment').forEach(function (button) {
    button.addEventListener('click', async function (e) {
        const commentId = parseInt(e.target.dataset.id);
        const response = await fetch(`backend/comments.php?id=${commentId}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (response.ok) {
            loadTasks(); // Recargar las tareas para reflejar la eliminación
        } else {
            console.error("Error al eliminar el comentario");
        }
    });

    async function fetchComments(taskId) {
        try {
            const response = await fetch(`backend/comments.php?task_id=${taskId}`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error al obtener comentarios:', error);
            return [];
        }
    }
    
    // Función para agregar un comentario
    async function addComment(taskId, commentText) {
        try {
            const response = await fetch(`backend/comments.php?task_id=${taskId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ comment: commentText })
            });
            return await response.json();
        } catch (error) {
            console.error('Error al agregar comentario:', error);
        }
    }
    
    // Función para eliminar un comentario
    async function deleteComment(commentId) {
        try {
            const response = await fetch(`backend/comments.php?id=${commentId}`, {
                method: 'DELETE'
            });
            return await response.json();
        } catch (error) {
            console.error('Error al eliminar comentario:', error);
        }
    }
    
    // Renderizar comentarios en el HTML
    async function renderComments(taskId) {
        const comments = await fetchComments(taskId);
        const commentsContainer = document.getElementById('comments-container');
        commentsContainer.innerHTML = '';
    
        if (comments.length === 0) {
            commentsContainer.innerHTML = '<p>No hay comentarios aún.</p>';
            return;
        }
    
        comments.forEach(comment => {
            const commentDiv = document.createElement('div');
            commentDiv.classList.add('comment');
            commentDiv.innerHTML = `
                <p><strong>${comment.username}</strong>: ${comment.comment}</p>
                ${comment.is_owner ? `<button class="delete-comment" data-id="${comment.id}" data-task="${taskId}">Eliminar</button>` : ''}
            `;
            commentsContainer.appendChild(commentDiv);
        });
    
        // Agregar evento a los botones de eliminar
        document.querySelectorAll('.delete-comment').forEach(button => {
            button.addEventListener('click', async (e) => {
                const commentId = e.target.getAttribute('data-id');
                const taskId = e.target.getAttribute('data-task');
                await deleteComment(commentId);
                renderComments(taskId);
            });
        });
    }
    
    // Manejar la creación de comentario desde el formulario
    function setupCommentForm(taskId) {
        const form = document.getElementById('comment-form');
        const commentInput = document.getElementById('comment-input');
    
        form.onsubmit = async function(event) {
            event.preventDefault();
            const commentText = commentInput.value.trim();
            if (!commentText) {
                alert('El comentario no puede estar vacío.');
                return;
            }
            await addComment(taskId, commentText);
            commentInput.value = '';
            renderComments(taskId);
        };
    }
    
    // Cuando se seleccione una tarea, carga los comentarios y prepara el formulario
    function handleTaskSelection(taskId) {
        renderComments(taskId);
        setupCommentForm(taskId);
    }
    
});