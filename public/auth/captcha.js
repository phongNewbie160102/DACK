function generateCaptcha() {
    const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let captcha = '';
    for (let i = 0; i < 5; i++) {
        captcha += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return captcha;
}

function drawCaptcha(captcha) {
    const captchaElement = document.getElementById('captcha');
    captchaElement.innerText = captcha;
}

function validateCaptcha() {
    const userInput = document.getElementById('captchaInput').value;
    const generatedCaptcha = document.getElementById('captcha').innerText;

    if (userInput === generatedCaptcha) {
        alert('CAPTCHA correct!');
    } else {
        alert('CAPTCHA incorrect. Please try again.');
    }
}

// Generate and display CAPTCHA when the page loads
const captcha = generateCaptcha();
drawCaptcha(captcha);