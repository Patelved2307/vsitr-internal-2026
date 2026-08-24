import { initDatabase, saveGlobalConfig } from './src/db/neonDb.js';
import { INITIAL_SETTINGS, INITIAL_TIMELINE_EVENTS, INITIAL_FAQS, INITIAL_RULES } from './src/data/initialData.js';

async function updateDb() {
  await initDatabase();
  await saveGlobalConfig({
    settings: INITIAL_SETTINGS,
    timeline: INITIAL_TIMELINE_EVENTS,
    faqs: INITIAL_FAQS,
    rules: INITIAL_RULES,
  });
  console.log('Database updated with initialData.ts');
  process.exit(0);
}

updateDb().catch(console.error);
