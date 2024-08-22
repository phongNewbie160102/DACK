const express = require('express');
const router = express.Router();
const path = require('path');
const mainController = require('../controllers/mainController');

// Route cho trang chính
router.get('/', mainController.renderSPA);

// Route cho các trang con
router.get('/home', mainController.renderPage('home'));
router.get('/about', mainController.renderPage('about'));
router.get('/contact', mainController.renderPage('contact'));
router.get('/login', mainController.renderPage('login'));
router.get('/404', mainController.renderPage('404'));
module.exports = router;
