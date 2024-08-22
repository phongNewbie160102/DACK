<?php
session_start();
header("Content-Type: application/json; charset=UTF-8");

$response = array('success' => false);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['captcha']) && isset($_SESSION['captcha'])) {
        $userCaptcha = trim($_POST['captcha']);
        if ($userCaptcha === $_SESSION['captcha']) {
            $response['success'] = true;
        } else {
            $response['message'] = 'Captcha không đúng.';
        }
    } else {
        $response['message'] = 'Captcha không hợp lệ.';
    }
} else {
    $response['message'] = 'Invalid request';
}

echo json_encode($response);
?>
