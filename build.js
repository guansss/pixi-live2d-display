const { exec } = require('child_process');

function main() {
    retrieveFile('README.md');
    retrieveFile('README.zh.md');
}

function retrieveFile(file) {
    exec(`git show master:${file} > mkdocs/${file}`, (error, stdout, stderr) => {
        if (error) {
            throw error;
        }

        if (stderr) {
            console.error(stderr);
            throw new Error('Error in execution.');
        }
    });
}

main();
