<?php
// authenticate.php

declare(strict_types=1);
use Firebase\JWT\JWT;
require_once('../vendor/autoload.php');

// Function to authenticate user
function authenticateUser($username, $password) {
    $db_host = 'localhost'; 
    $db_name = 'cisco'; 
    $db_user = 'root'; 
    $db_pass = ''; 

    try {
        $conn = new PDO("mysql:host=$db_host;dbname=$db_name", $db_user, $db_pass);
        $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        // Prepare SQL statement to select user with given username and password
        $stmt = $conn->prepare("SELECT * FROM user WHERE username = :username AND uspw = :password");
        $stmt->bindParam(':username', $username);
        $stmt->bindParam(':password', $password);
        $stmt->execute();

        // Fetch user data
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        // Check if user exists and password matches
        if ($user) {
            // Assuming 'roles' is a column in your 'user' table
            $roles = $user['roles'];

            // Return the roles along with username
            return [
                'username' => $username,
                'roles' => $roles
            ];
        } else {
            return null; // User not found or credentials are incorrect
        }
    } catch(PDOException $e) {
        echo "Connection failed: " . $e->getMessage();
        return null;
    }
}

// Assuming you retrieve username and password from POST request
$username = $_POST['inputEmail'] ?? '';
$password = $_POST['inputPassword'] ?? '';

// Authenticate user
$userData = authenticateUser($username, $password);

if ($userData !== null) {
    // If authentication succeeds, create JWT token
    $secret_Key  = '68V0zWFrS72GbpPreidkQFLfj4v9m3Ti+DXc8OB0gcM=';
    $date   = new DateTimeImmutable();
    $expire_at = $date->modify('+1 hour')->getTimestamp();
    $domainName = "your.domain.name";

    // Create token data including roles
    $token_data = [
        'iat'  => $date->getTimestamp(),
        'iss'  => $domainName,
        'nbf'  => $date->getTimestamp(),
        'exp'  => $expire_at,
        'username' => $userData['username'],
        'roles' => $userData['roles'] 
    ];

    // Encode the array to a JWT string.
    $jwt = JWT::encode(
        $token_data,
        $secret_Key,
        'HS512'
    );

    // Return JWT token as JSON response
    header('Content-Type: application/json');
    echo json_encode(['jwt' => $jwt, 'roles' => $userData['roles'], 'expire_at' => $expire_at]);
} else {
    // Handle authentication failure
    header('HTTP/1.1 401 Unauthorized');
    echo json_encode(['message' => 'Mật khẩu hoặc tên đăng nhập không đúng']);
}
?>
