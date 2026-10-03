<?php
/**
 * Database Connection Configuration (MySQL PDO)
 * Supports both local (XAMPP) and InfinityFree production environments.
 *
 * For InfinityFree deployment:
 *   1. Create a file named "db_config.php" in this same /api/ directory
 *   2. Contents should define your InfinityFree MySQL credentials:
 *      <?php
 *      define('DB_HOST', 'sqlXXX.infinityfree.com');  // from InfinityFree panel
 *      define('DB_NAME', 'if0_XXXXXXXX_cart_witnessing');
 *      define('DB_USER', 'if0_XXXXXXXX');
 *      define('DB_PASS', 'your_password_here');
 *      define('DB_PORT', 3306);
 *   3. Add "api/db_config.php" to your .gitignore so credentials stay private.
 */
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Load production credentials if available, otherwise use local defaults
if (file_exists(__DIR__ . '/db_config.php')) {
    require_once __DIR__ . '/db_config.php';
    $db_host = DB_HOST;
    $db_name = DB_NAME;
    $db_user = DB_USER;
    $db_pass = DB_PASS;
    $db_port = defined('DB_PORT') ? DB_PORT : 3306;
} else {
    // Local development defaults (XAMPP)
    $db_host = 'localhost';
    $db_name = 'cart_witnessing';
    $db_user = 'root';
    $db_pass = '';
    $db_port = 3306;
}

try {
    $pdo = new PDO(
        "mysql:host={$db_host};port={$db_port};dbname={$db_name};charset=utf8mb4",
        $db_user,
        $db_pass,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Database connection failed: ' . $e->getMessage()
    ]);
    exit;
}
