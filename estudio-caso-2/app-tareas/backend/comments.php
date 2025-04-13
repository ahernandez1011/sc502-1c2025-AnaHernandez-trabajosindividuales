<?php
require('db.php');

function createComment($taskId, $comment) {
    global $pdo;
    try {
        $sql = "INSERT INTO comments (task_id, comment) VALUES (:task_id, :comment)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute(['task_id' => $taskId, 'comment' => $comment]);
        return $pdo->lastInsertId();
    } catch (Exception $e) {
        echo $e->getMessage();
        return 0;
    }
}

function getCommentsByTask($taskId) {
    global $pdo;
    try {
        $stmt = $pdo->prepare("SELECT * FROM comments WHERE task_id = :task_id");
        $stmt->execute(['task_id' => $taskId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        echo "Error al obtener los comentarios: " . $e->getMessage();
        return [];
    }
}

function editComment($id, $comment) {
    global $pdo;
    try {
        $sql = "UPDATE comments SET comment = :comment WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute(['comment' => $comment, 'id' => $id]);
        return $stmt->rowCount() > 0;
    } catch (Exception $e) {
        echo $e->getMessage();
        return false;
    }
}

function deleteComment($id) {
    global $pdo;
    try {
        $sql = "DELETE FROM comments WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute(['id' => $id]);
        return $stmt->rowCount() > 0;
    } catch (Exception $e) {
        echo $e->getMessage();
        return false;
    }
}

$method = $_SERVER['REQUEST_METHOD'];
header('Content-Type: application/json');

session_start();

if (isset($_SESSION["user_id"])) {
    $taskId = $_GET['task_id'] ?? null;

    switch ($method) {
        case 'GET':
            if ($taskId) {
                $comments = getCommentsByTask($taskId);
                echo json_encode($comments);
            } else {
                http_response_code(400);
                echo json_encode(["error" => "task_id es requerido"]);
            }
            break;

        case 'POST':
            $input = json_decode(file_get_contents("php://input"), true);
            if (isset($input['comment']) && $taskId) {
                $commentId = createComment($taskId, $input['comment']);
                if ($commentId > 0) {
                    http_response_code(201);
                    echo json_encode(["message" => "Comentario creado exitosamente", "id" => $commentId]);
                } else {
                    http_response_code(500);
                    echo json_encode(['error' => "Error al crear el comentario"]);
                }
            } else {
                http_response_code(400);
                echo json_encode(["error" => "comment es requerido"]);
            }
            break;

        case 'PUT':
            $input = json_decode(file_get_contents("php://input"), true);
            if (isset($input['comment']) && isset($_GET['id'])) {
                if (editComment($_GET['id'], $input['comment'])) {
                    http_response_code(200);
                    echo json_encode(['message' => "Comentario actualizado exitosamente"]);
                } else {
                    http_response_code(500);
                    echo json_encode(['error' => "Error al actualizar el comentario"]);
                }
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'Datos insuficientes']);
            }
            break;

        case 'DELETE':
            if (isset($_GET['id'])) {
                if (deleteComment($_GET['id'])) {
                    http_response_code(200);
                    echo json_encode(['message' => "Comentario eliminado exitosamente"]);
                } else {
                    http_response_code(500);
                    echo json_encode(['error' => "Error al eliminar el comentario"]);
                }
            } else {
                http_response_code(400);
                echo json_encode(['error' => "id es requerido"]);
            }
            break;

        default:
            http_response_code(405);
            echo json_encode(["error" => "Método no permitido"]);
    }
} else {
    http_response_code(401);
    echo json_encode(["error" => "Sesión no activa"]);
}
?>