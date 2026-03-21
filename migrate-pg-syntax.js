const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('./app').concat(walk('./lib')).concat(walk('./components'));

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Add "await " in front of "db.prepare(....).all/get/run(" if it's missing
    // We use a regex that matches "db.prepare" followed by anything lazily until ")" followed by ".all(" or ".get(" or ".run("
    // We also make sure not to double-add "await "
    
    // Pattern: db\.prepare\([\s\S]*?\)\.(all|get|run)\(
    const regex = /(?<!await\s+)(db\.prepare\([\s\S]*?\)\.(all|get|run)\()/g;
    
    // Find how many replacements would occur
    const matches = content.match(regex);
    if (matches && matches.length > 0) {
        content = content.replace(regex, 'await $1');
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated ${matches.length} queries in ${file}`);
    }
});
