const fs = require('fs');
const chalk = require('chalk');
const TypeDoc = require('typedoc');
const packageJSON = require('../package.json');

typedoc().then(patchCSS);

// https://typedoc.org/guides/installation/#node-module
async function typedoc() {
    const app = new TypeDoc.Application();

    // If you want TypeDoc to load tsconfig.json
    app.options.addReader(new TypeDoc.TSConfigReader());

    app.bootstrap({
        entryPoints: ['src/index.ts', 'src/types/events.d.ts'],
        readme: 'DOC_INDEX.md',
        tsconfig: 'tsconfig.build.json',
        disableOutputCheck: true,
        excludePrivate: true,
    });

    const project = app.convert();

    if (project) { // Project may not have converted correctly
        const patchedFiles = [];

        app.renderer.on('endPage', pageEvent => {
            patchedFiles.push(pageEvent.url);

            if (pageEvent.url === 'index.html') {
                // append version to the project name
                pageEvent.contents = pageEvent.contents.replace(`<h1>${packageJSON.name}</h1>`, `<h1>${packageJSON.name} ${packageJSON.version}</h1>`);
            }

            // remove the unnecessary "Return void" signatures for methods
            pageEvent.contents = pageEvent.contents.replace(/<h4 class="tsd-returns-title">Returns <span class="tsd-signature-type">void<\/span><\/h4>/g, '');
        });

        // Rendered docs
        await app.generateDocs(project, 'docs');

        console.log('\n', chalk.blue('Patched files:'), patchedFiles);
    } else {
        throw new Error('Project not have converted correctly');
    }
}

function patchCSS() {
    console.log(chalk.blue('Processing CSS'));

    const cssFile = 'docs/assets/css/main.css';

    console.log(chalk.green(cssFile));

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

.tsd-description:last-child > .tsd-parameters:last-child .tsd-comment > p {
    margin-bottom: 0;
}

.tsd-description:not(:first-child) > :first-child {
  padding-top: 1em;
}

.tsd-returns-title {
    padding-bottom: 1em;
}

.tsd-description > .tsd-sources,
.tsd-description > .tsd-comment {
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
}

.tsd-signatures.active .tsd-signature:hover:not(.current) {
    background-color: #FAFAFA;
}
`;

    fs.writeFileSync(cssFile, cssContent);
}

function writeExtraFiles() {
    // console.log(chalk.blue('Write .nojekyll'));

    // https://github.com/TypeStrong/typedoc/issues/149
    // since .nojekyll has been excluded when running rimraf, there's no need to recreate this file
    // fs.writeFileSync('docs/.nojekyll', '');
}
