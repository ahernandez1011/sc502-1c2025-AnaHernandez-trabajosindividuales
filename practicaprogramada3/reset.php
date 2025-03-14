<?php
session_start();
session_destroy();
header("Location: index.php"); // Redirecciona al formulario principal
exit();
?>
