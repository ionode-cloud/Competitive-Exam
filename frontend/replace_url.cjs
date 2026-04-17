const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            replaceInDir(fullPath);
        } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('http://localhost:5000')) {
                // We use a regex that matches quotes and the localhost base url.
                // It replaces it with the template literal string using import.meta.env
                content = content.replace(/['"`]http:\/\/localhost:5000(.*?)['"`]/g, '`${import.meta.env.VITE_API_URL || "http://localhost:5000"}$1`');
                fs.writeFileSync(fullPath, content);
            }
        }
    }
}

replaceInDir(path.join(__dirname, 'src'));
console.log('Replaced local API URLs with environment variables.');
