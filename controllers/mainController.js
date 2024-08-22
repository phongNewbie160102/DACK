const path = require('path');

exports.renderSPA = (req, res) => {
    res.sendFile(path.join(__dirname, '/../public/index.html'));
};

// Utility function to render pages
exports.renderPage = (page) => (req, res) => {
    res.sendFile(path.join(__dirname, '/../public/pages', `${page}.html`));
};
