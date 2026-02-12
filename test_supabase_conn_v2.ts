
import { Client } from 'pg';

async function testConnect() {
    const client = new Client({
        connectionString: "postgres://postgres:2R4ZOQKdfKbsmSxr3YEZAt8cXRKZUJz4ZGZMvm5x7iR51t1o6neqS0rwdIwq7d5g@db.pbvwwhjyaciwsgibkrjo.supabase.co:5432/postgres",
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log("Connected successfully to Supabase with the complex password!");
        const res = await client.query("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'");
        console.log("Tables in public:", res.rows[0].count);
        await client.end();
    } catch (err) {
        console.error("Connection failed:", err.message);
    }
}

testConnect();
