import { openDatabaseAsync } from 'expo-sqlite';
import { Repository } from './repository';
import { isWalkthrough } from './mode';
const databaseName = isWalkthrough ? 'tailor-master-walkthrough.db' : 'tailor-master.db';
const registry = globalThis as typeof globalThis & {
    __tailorRepositories?: Map<string, Promise<Repository>>;
};
const repositories = registry.__tailorRepositories ??= new Map();
export function openRepository(): Promise<Repository> {
    const existing = repositories.get(databaseName);
    if (existing)
        return existing;
    const opening = (async () => { const db = await openDatabaseAsync(databaseName); try {
        const repo = new Repository(db);
        await repo.initialize();
        return repo;
    }
    catch (e) {
        await db.closeAsync().catch(() => { });
        throw e;
    } })().catch(e => { repositories.delete(databaseName); throw e; });
    repositories.set(databaseName, opening);
    return opening;
}

