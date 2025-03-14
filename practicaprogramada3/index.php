<?php
session_start();

// Inicializar sesión si no existe
if (!isset($_SESSION['transacciones'])) {
    $_SESSION['transacciones'] = [];
}

// Procesar formulario cuando se envía
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $descripcion = $_POST['descripcion'];
    $monto = floatval($_POST['monto']);

    if (!empty($descripcion) && $monto > 0) {
        $_SESSION['transacciones'][] = ['descripcion' => $descripcion, 'monto' => $monto];
    }
}

// Función para calcular estado de cuenta
function generarEstadoCuenta($transacciones) {
    $montoTotalContado = array_sum(array_column($transacciones, 'monto'));
    $montoConInteres = $montoTotalContado * 1.026;
    $cashBack = $montoTotalContado * 0.001;
    $montoFinal = $montoConInteres - $cashBack;

    // Tabla HTML estilizada
    echo "<style>
        body { font-family: Arial, sans-serif; text-align: center; }
        table { width: 60%; margin: 20px auto; border-collapse: collapse; font-size: 18px; }
        th, td { padding: 10px; border: 1px solid #ddd; text-align: left; }
        th { background-color: #007BFF; color: white; }
        tr:nth-child(even) { background-color: #f2f2f2; }
    </style>";

    echo "<h2>Estado de Cuenta</h2>";
    echo "<table><tr><th>Descripción</th><th>Monto ($)</th></tr>";

    foreach ($transacciones as $transaccion) {
        echo "<tr><td>{$transaccion['descripcion']}</td><td style='text-align:right;'>$" . number_format($transaccion['monto'], 2) . "</td></tr>";
    }

    echo "<tr><td><strong>Monto Total de Contado</strong></td><td style='text-align:right;'><strong>$" . number_format($montoTotalContado, 2) . "</strong></td></tr>";
    echo "<tr><td>Monto con Interés (2.6%)</td><td style='text-align:right;'>$" . number_format($montoConInteres, 2) . "</td></tr>";
    echo "<tr><td>Cash Back (0.1%)</td><td style='text-align:right;'>- $" . number_format($cashBack, 2) . "</td></tr>";
    echo "<tr><td><strong>Monto Final a Pagar</strong></td><td style='text-align:right;'><strong>$" . number_format($montoFinal, 2) . "</strong></td></tr>";
    echo "</table>";

    // Guardar en archivo de texto
    $contenido = "=== ESTADO DE CUENTA ===\n";
    foreach ($transacciones as $transaccion) {
        $contenido .= "{$transaccion['descripcion']}: $" . number_format($transaccion['monto'], 2) . "\n";
    }
    $contenido .= "\nMonto Total de Contado: $" . number_format($montoTotalContado, 2) . "\n";
    $contenido .= "Monto con Interés (2.6%): $" . number_format($montoConInteres, 2) . "\n";
    $contenido .= "Cash Back (0.1%): -$" . number_format($cashBack, 2) . "\n";
    $contenido .= "Monto Final a Pagar: $" . number_format($montoFinal, 2) . "\n";
    
    file_put_contents("estado_cuenta.txt", $contenido);
}

?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Registro de Transacciones</title>
</head>
<body>

<h1>Registro de Transacciones</h1>

<!-- Formulario para agregar transacciones -->
<form method="POST" action="">
    <label for="descripcion">Descripción:</label>
    <input type="text" name="descripcion" required>
    
    <label for="monto">Monto ($):</label>
    <input type="number" name="monto" step="0.01" required>
    
    <button type="submit">Agregar Transacción</button>
</form>

<!-- Mostrar estado de cuenta -->
<?php generarEstadoCuenta($_SESSION['transacciones']); ?>

<!-- Botón para limpiar transacciones -->
<form method="POST" action="reset.php">
    <button type="submit">Limpiar Transacciones</button>
</form>

</body>
</html>
