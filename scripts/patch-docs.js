const fs = require('fs');
const chalk = require('chalk');
const glob = require('glob');

glob('docs/**/*.html', (error, files) => {
    console.log(chalk.blue('Processing HTML'));

    for (const file of files) {
        console.log(file);

        let htmlContent = fs.readFileSync(file, 'utf8');

        htmlContent = htmlContent.replace(/<h4 class="tsd-returns-title">Returns <span class="tsd-signature-type">void<\/span><\/h4>/g, '');

        fs.writeFileSync(file, htmlContent);
    }
});

console.log(chalk.blue('Processing CSS'));

const cssFile = 'docs/assets/css/main.css';

console.log(cssFile);

let cssContent = fs.readFileSync(cssFile, 'utf8');

cssContent = cssContent + `
.tsd-descriptions {
    margin-left: -20px;
    margin-right: -20px;
    margin-bottom: -20px !important;
    padding: 0 20px 20px !important;
    background: #EEE;
}

.tsd-description:last-child > :last-child {
    margin-bottom: -20px !important;
    padding-bottom: 20px !important;
}

.tsd-description:not(:first-child) > :first-child {
  padding-top: 1em;
}

.tsd-returns-title {
    padding-bottom: 1em;
}

.tsd-description > .tsd-sources, .tsd-description > .tsd-comment {
    margin: 0 -20px;
    padding: 0 20px;
    overflow: hidden;
    background: #FFF;
}

.tsd-description > .tsd-sources {
    padding-bottom: 1em;
}

.tsd-description > .tsd-comment p {
    margin-top: 0;
}`;

fs.writeFileSync(cssFile, cssContent);

console.log(chalk.blue('Write .nojekyll'));

// https://github.com/TypeStrong/typedoc/issues/149
fs.writeFileSync('docs/.nojekyll', '');
