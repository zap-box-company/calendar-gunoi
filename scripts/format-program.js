// Scrie docs/program.json lizibil: listele de zile pe un singur rând, ex. "10": [2, 9, 16].
const fs = require('fs');

function formatProgram(program) {
  return (
    JSON.stringify(program, null, 2).replace(/\[\s*(\d+(?:\s*,\s*\d+)*)\s*\]/g, (_, nums) =>
      `[${nums.split(',').map((n) => n.trim()).join(', ')}]`,
    ) + '\n'
  );
}

module.exports = { formatProgram };

// Rulare directă: node scripts/format-program.js → reformatează fișierul.
if (require.main === module) {
  const p = require('path').join(__dirname, '..', 'docs', 'program.json');
  fs.writeFileSync(p, formatProgram(JSON.parse(fs.readFileSync(p, 'utf8'))));
  console.log('program.json reformatat');
}
