<?php

header('Content-Type: application/json');
session_start();

require 'db.php'; // Asegúrate de tener tu conexión a base de datos

// Verificar si el usuario está logueado
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'No autorizado']);
    exit;
}

$user_id = $_SESSION['user_id'];

// Obtener método de solicitud
$method = $_SERVER['REQUEST_METHOD'];

// Obtener parámetros
$taskId = isset($_GET['task_id']) ? intval($_GET['task_id']) : null;
$commentId = isset($_GET['id']) ? intval($_GET['id']) : null;

switch ($method) {
    case 'GET':
        if (!$taskId) {
            echo json_encode(['error' => 'Falta el ID de la tarea']);
            exit;
        }

        $stmt = $conn->prepare("
            SELECT c.id, c.comment, c.user_id, u.username,
                   CASE WHEN c.user_id = ? THEN 1 ELSE 0 END AS is_owner
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.task_id = ?
            ORDER BY c.created_at DESC
        ");
        $stmt->bind_param('ii', $user_id, $taskId);
        $stmt->execute();
        $result = $stmt->get_result();
        $comments = [];

        while ($row = $result->fetch_assoc()) {
            $comments[] = $row;
        }

        echo json_encode($comments);
        break;

    case 'POST':
        if (!$taskId) {
            echo json_encode(['error' => 'Falta el ID de la tarea']);
            exit;
        }

        $data = json_decode(file_get_contents('php://input'), true);
        $commentText = trim($data['comment'] ?? '');

        if (empty($commentText)) {
            echo json_encode(['error' => 'El comentario no puede estar vacío']);
            exit;
        }

        if (strlen($commentText) > 500) {
            echo json_encode(['error' => 'El comentario no puede exceder los 500 caracteres']);
            exit;
        }
        
        $stmt = $conn->prepare("INSERT INTO comments (task_id, user_id, comment, created_at) VALUES (?, ?, ?, NOW())");
        $stmt->bind_param('iis', $taskId, $user_id, $commentText);
        if ($stmt->execute()) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['error' => 'Error al insertar comentario']);
        }
        break;

    case 'DELETE':
        if (!$commentId) {
            echo json_encode(['error' => 'Falta el ID del comentario']);
            exit;
        }

        // Verificar que el comentario pertenezca al usuario antes de eliminar
        $stmt = $conn->prepare("SELECT user_id FROM comments WHERE id = ?");
        $stmt->bind_param('i', $commentId);
        $stmt->execute();
        $stmt->bind_result($commentUserId);
        $stmt->fetch();
        $stmt->close();

        if ($commentUserId !== $user_id) {
            http_response_code(403);
            echo json_encode(['error' => 'No tienes permisos para eliminar este comentario']);
            exit;
        }

        $stmt = $conn->prepare("DELETE FROM comments WHERE id = ?");
        $stmt->bind_param('i', $commentId);
        if ($stmt->execute()) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['error' => 'Error al eliminar comentario']);
        }
        break;
    case 'PUT':
        if (!$commentId) {
            echo json_encode(['error' => 'Falta el ID del comentario']);
            exit;
        }

        $data = json_decode(file_get_contents('php://input'), true);
        $newCommentText = trim($data['comment'] ?? '');

        if (empty($newCommentText)) {
            echo json_encode(['error' => 'El comentario no puede estar vacío']);
            exit;
        }

        // Verificar que el comentario pertenezca al usuario antes de actualizar
        $stmt = $conn->prepare("SELECT user_id FROM comments WHERE id = ?");
        $stmt->bind_param('i', $commentId);
        $stmt->execute();
        $stmt->bind_result($commentUserId);
        $stmt->fetch();
        $stmt->close();

        if ($commentUserId !== $user_id) {
            http_response_code(403);
            echo json_encode(['error' => 'No tienes permisos para editar este comentario']);
            exit;
        }

        $stmt = $conn->prepare("UPDATE comments SET comment = ? WHERE id = ?");
        $stmt->bind_param('si', $newCommentText, $commentId);
        if ($stmt->execute()) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['error' => 'Error al actualizar comentario']);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Método no permitido']);
        break;
}
