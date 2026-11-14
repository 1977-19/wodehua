// Bundles src/*.js into a single self-contained index.html
const fs = require('fs'), path = require('path');
const order = ['core', 'geo', 'gl', 'chars', 'props', 'env', 'data', 'world_util', 'world_town', 'world_others', 'ui', 'game'];
const js = order.filter(n => fs.existsSync(path.join(__dirname, 'src', n + '.js'))).map(n => '/* ---- ' + n + '.js ---- */\n' + fs.readFileSync(path.join(__dirname, 'src', n + '.js'), 'utf8').replace(/^'use strict';\n/, '')).join('\n');
const html = fs.readFileSync(path.join(__dirname, 'src', 'index.template.html'), 'utf8').replace('/*JS*/', () => "'use strict';\n" + js.replace(/<\/script/g, '<\\/script'));
fs.writeFileSync(path.join(__dirname, 'index.html'), html);
console.log('index.html', (html.length / 1024).toFixed(0) + ' KB');
