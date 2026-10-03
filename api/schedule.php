<?php
/**
 * Cart Witnessing — Schedule API Endpoint
 * Handles GET (fetching schedule by date) and POST (saving schedule by date)
 */
require_once __DIR__ . '/db.php';

header('Content-Type: application/json; charset=utf-8');

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// Helper to generate blank 5-location structure
function getBlankSchedule($pdo) {
    $stmt = $pdo->query("SELECT id FROM locations WHERE is_active = 1 ORDER BY display_order ASC");
    $locations = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    $schedule = [];
    foreach ($locations as $locId) {
        $schedule[$locId] = [
            0 => ['p1' => ['name' => '', 'phone' => ''], 'p2' => ['name' => '', 'phone' => ''], 'p3' => ['name' => '', 'phone' => ''], 'notes' => ''],
            1 => ['p1' => ['name' => '', 'phone' => ''], 'p2' => ['name' => '', 'phone' => ''], 'p3' => ['name' => '', 'phone' => ''], 'notes' => '']
        ];
    }
    return $schedule;
}

// -------------------------------------------------------------
// GET: Fetch schedule for a date
// -------------------------------------------------------------
if ($method === 'GET') {
    $dateKey = isset($_GET['date']) ? trim($_GET['date']) : date('Y-m-d');

    // Validate YYYY-MM-DD
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateKey)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Invalid date format. Use YYYY-MM-DD.']);
        exit;
    }

    $schedule = getBlankSchedule($pdo);

    // Fetch stored assignments for this date
    $stmt = $pdo->prepare("
        SELECT location_id, shift_id, slot_num, volunteer_name, volunteer_phone, shift_notes
        FROM shift_assignments
        WHERE date_key = ?
    ");
    $stmt->execute([$dateKey]);
    $rows = $stmt->fetchAll();

    foreach ($rows as $row) {
        $locId = $row['location_id'];
        $shiftId = (int)$row['shift_id'];
        $slotNum = (int)$row['slot_num'];

        if (isset($schedule[$locId][$shiftId])) {
            $slotKey = 'p' . $slotNum;
            $schedule[$locId][$shiftId][$slotKey] = [
                'name' => $row['volunteer_name'] ?? '',
                'phone' => $row['volunteer_phone'] ?? ''
            ];
            if (!empty($row['shift_notes'])) {
                $schedule[$locId][$shiftId]['notes'] = $row['shift_notes'];
            }
        }
    }

    echo json_encode([
        'status' => 'success',
        'dateKey' => $dateKey,
        'data' => $schedule
    ]);
    exit;
}

// -------------------------------------------------------------
// POST: Save schedule for a date
// -------------------------------------------------------------
if ($method === 'POST') {
    $input = file_get_contents('php://input');
    $payload = json_decode($input, true);

    if (!$payload || !isset($payload['dateKey']) || !isset($payload['data'])) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Invalid payload. Required: dateKey, data']);
        exit;
    }

    $dateKey = trim($payload['dateKey']);
    $data = $payload['data'];

    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateKey)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Invalid date format. Use YYYY-MM-DD.']);
        exit;
    }

    $pdo->beginTransaction();
    try {
        // Upsert metadata record
        $stmtMeta = $pdo->prepare("INSERT INTO schedules (date_key) VALUES (?) ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP");
        $stmtMeta->execute([$dateKey]);

        // Upsert shift assignments
        $upsertStmt = $pdo->prepare("
            INSERT INTO shift_assignments (date_key, location_id, shift_id, slot_num, volunteer_name, volunteer_phone, shift_notes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                volunteer_name = VALUES(volunteer_name),
                volunteer_phone = VALUES(volunteer_phone),
                shift_notes = VALUES(shift_notes),
                updated_at = CURRENT_TIMESTAMP
        ");

        foreach ($data as $locId => $shifts) {
            foreach ($shifts as $shiftIdx => $shiftData) {
                $notes = $shiftData['notes'] ?? '';
                for ($slot = 1; $slot <= 3; $slot++) {
                    $slotKey = 'p' . $slot;
                    $name = isset($shiftData[$slotKey]['name']) ? trim($shiftData[$slotKey]['name']) : '';
                    $phone = isset($shiftData[$slotKey]['phone']) ? trim($shiftData[$slotKey]['phone']) : '';

                    $upsertStmt->execute([
                        $dateKey,
                        $locId,
                        $shiftIdx,
                        $slot,
                        $name,
                        $phone,
                        $notes
                    ]);
                }
            }
        }

        $pdo->commit();

        echo json_encode([
            'status' => 'success',
            'message' => 'Schedule saved successfully to MySQL',
            'dateKey' => $dateKey
        ]);
        exit;
    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
        exit;
    }
}
