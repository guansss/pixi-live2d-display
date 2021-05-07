const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const fs = require('fs');
const path = require('path');
const glob = require('glob');
const ghpages = require('gh-pages');

const siteDir = path.resolve(__dirname, 'site');

async function main() {
    const apiDir = path.resolve(__dirname, 'api');

    if (!fs.existsSync(apiDir)) {
        throw new Error('Could not find "api" directory.');
    }

    await execute('git show master:README.md > mkdocs/README.md');
    await execute('git show master:README.zh.md > mkdocs/README.zh.md');

    fs.rmdirSync(siteDir, { recursive: true });

    await execute('mkdocs build');

    console.log('Copying API docs...');

    glob.sync(path.join(apiDir, '**/*'), { nodir: true })
        .forEach(file => {
            const destFile = path.resolve(siteDir, 'api', path.relative(apiDir, file));
            fs.mkdirSync(path.dirname(destFile), { recursive: true });
            fs.copyFileSync(file, destFile);
        });

    await publish();
}

function execute(cmd) {
    const promise = exec(cmd);

    promise.child.stdout.pipe(process.stdout);
    promise.child.stderr.pipe(process.stderr);

    return promise;
}

function publish() {
    console.log('Publishing...');

    return new Promise(resolve => {
        ghpages.publish('site', function(err) {
            if (err) {
                throw err;
            }

            console.log('Published');
            resolve();
        });
    });
}

main();
