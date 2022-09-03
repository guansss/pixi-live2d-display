const TypeDoc = require('typedoc');
const { execSync } = require('child_process');

mkdocs().then(typedoc);

async function mkdocs() {
    execSync(`mkdocs build -f docs/mkdocs.yml`, { stdio: 'inherit' });
}

// https://typedoc.org/guides/installation/#node-module
async function typedoc() {
    const app = new TypeDoc.Application();

    // If you want TypeDoc to load tsconfig.json
    app.options.addReader(new TypeDoc.TSConfigReader());

    app.bootstrap({
        entryPoints: ['src/index.ts', 'cubism/src/index.ts'],
        readme: 'DOC_INDEX.md',
        tsconfig: 'tsconfig.build.json',
        includeVersion: true,
        excludePrivate: true,
    });

    const project = app.convert();

    if (!project) {
        throw new Error('Project is not converted correctly');
    }

    await app.generateDocs(project, 'site/api');
}
