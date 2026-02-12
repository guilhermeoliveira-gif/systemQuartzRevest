
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const schemas = await prisma.$queryRaw`
    SELECT schema_name
    FROM information_schema.schemata
    WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
  `;
    console.log(JSON.stringify(schemas, null, 2));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
