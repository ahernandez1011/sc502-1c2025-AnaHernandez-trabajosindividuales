<?php
 require('db.php');
 
 function createTask($userId, $title, $description, $dueDate)
 {
     global $pdo;
     try {
         $sql = "insert into tasks (user_id, title, description, due_date) value (:user_id, :title, :description, :due_date)";
         $stmt = $pdo->prepare($sql);
         $stmt->execute([
             'user_id' => $userId,
             'title' => $title,
             'description' => $description,
             'due_date' => $dueDate
         ]);
         return $pdo->lastInsertId();
 
     } catch (Exception $e) {
         echo $e->getMessage();
         return 0;
     }
 }
 
 function getTasksByUser ($userId) {
    try {
        global $pdo;
        $stmt = $pdo->prepare("SELECT * FROM tasks WHERE user_id = :user_id");
        $stmt->execute(['user_id' => $userId]);
        $tasks = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Obtener comentarios para cada tarea
        foreach ($tasks as &$task) {
            $task['comments'] = getCommentsByTask($task['id']);
        }

        return $tasks;
    } catch (Exception $ex) {
        echo "Error al obtener las tareas del usuario: " . $ex->getMessage();
        return [];
    }
}
 
 function editTask($id, $title, $description, $dueDate)
 {
     global $pdo;
     try {
         $sql = "update tasks set title = :title, description = :description, due_date = :due_date where id = :id";
         $stmt = $pdo->prepare($sql);
         $stmt->execute([
             'title' => $title,
             'description' => $description,
             'due_date' => $dueDate,
             'id' => $id
         ]);
         //si la cantidad de filas editadas es mayor a cero, retorne true, sino, retorne false;
 
         return $stmt->rowCount() > 0;
     } catch (Exception $e) {
         echo $e->getMessage();
         return false;
     }
 }

 function deleteTask($id)  
 {
     global $pdo;
     try {
         $sql = "delete from tasks where id = :id";
         $stmt = $pdo->prepare($sql);
         $stmt->execute(["id" => $id]);
         //si la cantidad de filas editadas es mayor a cero, retorne true, sino, retorne false;
         return $stmt->rowCount() > 0;
     } catch (Exception $e) {
         echo $e->getMessage();
         return false;
     }
 }

 function validateInput($input)
 {
     if (isset($input['title'], $input['description'], $input['due_date'])) {
         return true;
     }
     return false;
 }
 
 $method = $_SERVER['REQUEST_METHOD'];
 header('Content-Type: application/json');
 
 function getJsonInput()
 {
     return json_decode(file_get_contents("php://input"), associative: true);
 }
 
 session_start();

if (isset($_SESSION["user_id"])) {
    try {
        $userId = $_SESSION["user_id"];
        $method = $_SERVER['REQUEST_METHOD'];
        switch ($method) {
            case 'GET':
                $stmt = $conn->prepare("SELECT id, title, description, due_date FROM tasks WHERE user_id = ?");
                $stmt->bind_param('i', $user_id);
                $stmt->execute();
                $result = $stmt->get_result();
                $tasks = [];

                while ($task = $result->fetch_assoc()) {
                    // Traer comentarios asociados
                    $commentsStmt = $conn->prepare("
                        SELECT c.id, c.comment, u.username, c.user_id,
                               CASE WHEN c.user_id = ? THEN 1 ELSE 0 END AS is_owner
                        FROM comments c
                        JOIN users u ON c.user_id = u.id
                        WHERE c.task_id = ?
                        ORDER BY c.created_at DESC
                    ");
                    $commentsStmt->bind_param('ii', $user_id, $task['id']);
                    $commentsStmt->execute();
                    $commentsResult = $commentsStmt->get_result();
                    $comments = [];

                    while ($comment = $commentsResult->fetch_assoc()) {
                        $comments[] = $comment;
                    }

                    $task['comments'] = $comments;
                    $tasks[] = $task;
                }

                echo json_encode($tasks);
                break;

             case 'POST':
                 //convertir de JSON a array asociativo para facil manipulacion dentro de php
                 $input = getJsonInput();
                 if (validateInput($input)) {
                     $idTask = createTask($userId, $input['title'], $input['description'], $input['due_date']);
                     if ($idTask > 0) {
                         http_response_code(201);
                         echo json_encode(["message" => "Tarea creada exitosamente. Id:" . $idTask]);
                     } else {
                         http_response_code(500);
                         echo json_encode(['error' => "Error general creando la tarea"]);
                     }
                 } else {
                     http_response_code(400);
                     echo json_encode(["error" => "Datos insuficientes"]);
                 }
                 break;
             
             case 'PUT':
                 $input = getJsonInput();
                 if (validateInput($input)) {
                     if (editTask($_GET['id'], $input['title'], $input['description'], $input['due_date'])) {
                         http_response_code(201);
                         echo json_encode(['message' => "Tarea actualizada exitosamente"]);
                     } else {
                         http_response_code(500);
                         echo json_encode(['error' => "Error interno al actualizar la tarea"]);
                     }
                 } else {
                     http_response_code(400);
                     echo json_encode(['error' => 'Datos insuficientes']);
                 }
 
                 break;
             case 'DELETE':
                 if ($_GET['id']) {
                     if (deleteTask($_GET['id'])) {
                         http_response_code(200);
                         echo json_encode(['message' => "Tarea eliminada exitosamente"]);
                     } else {
                         http_response_code(500);
                         echo json_encode(['error' => "Error interno al eliminar una tarea"]);
                     }
                 } else {
                     http_response_code(400);
                     echo json_encode(['error' => "Peticion invalida"]);
                 }
                 break;
 
             default:
                 http_response_code(405);
                 echo json_encode(["error" => "Metodo no permitido"]);
         }
     } catch (Exception $exp) {
         http_response_code(500);
         echo json_encode(['error' => "Error al procesar el request"]);
     }
 } else {
     http_response_code(401);
     echo json_encode(["error" => "Sesion no activa"]);
 }

 

