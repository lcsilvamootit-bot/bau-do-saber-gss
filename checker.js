const fs = require('fs');
const html = fs.readFileSync('c:/Users/crist/Desktop/Hackaton/bau-do-saber-gss/index.html', 'utf8');
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
if (scriptMatch) {
    fs.writeFileSync('c:/Users/crist/Desktop/Hackaton/bau-do-saber-gss/temp.js', scriptMatch[1]);
    require('child_process').execSync('node -c c:/Users/crist/Desktop/Hackaton/bau-do-saber-gss/temp.js', { stdio: 'inherit' });
    console.log('Syntax OK');
} else {
    console.log('No script found');
}
