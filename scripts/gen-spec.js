const { inputPriorities, currentStates, results } = require('../test/motion-STT').STT;
const Handlebars = require('handlebars');
const fs = require('fs');

Handlebars.registerHelper('default', (a, b) => a || b);

Handlebars.registerHelper('resultRow', function(rowIndex, options) {
    let result = '';

    for (let i = 0; i < inputPriorities.length; i++) {
        result += options.fn(results[rowIndex * inputPriorities.length + i]);
    }

    return result;
});

const template = Handlebars.compile(`
<table>
<tr><td rowspan="2">When: :point_down:</td><th colspan="4">Start motion C as:</th></tr>
<tr>
{{#each inputPriorities}}
<th><code>{{this}}</code></th>
{{/each}}
</tr>
{{#each currentStates}}
<tr>
<td>Playing {{default this.playing 'none'}} {{#if this.playingPriority}} as <code>{{this.playingPriority}}</code> {{/if}}
<br>Reserved {{default this.reserved 'none'}} {{#if this.reservedPriority}} as <code>{{this.reservedPriority}}</code> {{/if}}</td>
{{#resultRow @index}}<td align="center">{{default this 'none'}}</td>{{/resultRow}}
</tr>
{{/each}}
</table>
`);

const table = template({ inputPriorities, currentStates, results });

fs.writeFileSync('STT.md', table, { encoding: 'utf8' });
