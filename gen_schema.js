
import fs from 'fs';

const databaseUrl = 'postgresql://postgres:2R4ZOQKdfKbsmSxr3YEZAt8cXRKZUJz4ZGZMvm5x7iR51t1o6neqS0rwdIwq7d5g@76.13.237.176:5432/postgres';

function mapDataType(type) {
    switch (type) {
        case 'uuid': return 'String';
        case 'character varying': return 'String';
        case 'text': return 'String';
        case 'numeric': return 'Decimal';
        case 'integer': return 'Int';
        case 'bigint': return 'BigInt';
        case 'boolean': return 'Boolean';
        case 'timestamp with time zone': case 'timestamp without time zone': case 'date': return 'DateTime';
        case 'time without time zone': return 'DateTime';
        case 'jsonb': return 'Json';
        default: return 'String';
    }
}

const inputPath = 'C:/Users/Guilherme/.gemini/antigravity/brain/95183e27-77ca-4c14-8ba4-d6d684bfc8b1/.system_generated/steps/868/output.txt';
const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const modelNames = data.map(t => t.name);

let schema = `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = "${databaseUrl}"
}

`;

data.forEach(table => {
    schema += `model ${table.name} {\n`;

    // Columns
    table.columns.forEach(col => {
        let type = mapDataType(col.data_type);
        let modifiers = '';
        if (table.primary_keys.includes(col.name)) modifiers += ' @id';
        if (col.options.includes('nullable') && !table.primary_keys.includes(col.name)) type += '?';
        if (col.options.includes('unique')) modifiers += ' @unique';

        schema += `  ${col.name.padEnd(30)} ${type.padEnd(10)}${modifiers}\n`;
    });

    // Relations
    // We iterate over all FKs in the entire database to see how they relate to the current table
    const seenRelations = new Set();

    data.forEach(otherTable => {
        otherTable.foreign_key_constraints?.forEach(fk => {
            const sourceParts = fk.source.split('.');
            const sourceTable = sourceParts[sourceParts.length - 2];
            const sourceCol = sourceParts[sourceParts.length - 1];

            const targetParts = fk.target.split('.');
            const targetTable = targetParts[targetParts.length - 2];
            const targetCol = targetParts[targetParts.length - 1];
            const targetSchema = targetParts[targetParts.length - 3];

            const relKey = `${sourceTable}_${targetTable}_${sourceCol}`;

            if (sourceTable === table.name) {
                // OUTBOUND
                if (modelNames.includes(targetTable)) {
                    if (!seenRelations.has(relKey + "_out")) {
                        const sourceColObj = table.columns.find(c => c.name === sourceCol);
                        const isOptional = sourceColObj?.options.includes('nullable');
                        const opt = isOptional ? '?' : '';
                        schema += `  ${(targetTable + "_" + sourceCol).padEnd(30)} ${targetTable.padEnd(10)}${opt} @relation("${relKey}", fields: [${sourceCol}], references: [${targetCol}], onDelete: NoAction, onUpdate: NoAction)\n`;
                        seenRelations.add(relKey + "_out");
                    }
                }
            } else if (targetTable === table.name) {
                // INBOUND
                if (modelNames.includes(sourceTable)) {
                    if (!seenRelations.has(relKey + "_in")) {
                        schema += `  ${(sourceTable + "_" + sourceCol + "_list").padEnd(30)} ${sourceTable}[] @relation("${relKey}")\n`;
                        seenRelations.add(relKey + "_in");
                    }
                }
            }
        });
    });

    schema += `}\n\n`;
});

fs.writeFileSync('m:/AntiGravitIA/systemQuartzRevest/prisma/schema.prisma.generated', schema);
console.log('Generated schema.prisma.generated');
