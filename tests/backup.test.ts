import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { createShop, saveCustomer } from '../src/domain/services.ts';
import { emptyWorkshop } from '../src/domain/model.ts';
import { decryptBackup, encryptBackup, shopSnapshot } from '../src/services/backup.ts';
import { Repository, type DB } from '../src/database/repository.ts';
const ctx = { id: randomUUID, now: () => new Date().toISOString(), deviceId: 'test' };
function fixture() { return createShop(emptyWorkshop(), ctx, { name: 'Tailor', ownerName: 'Owner', phone: '000', address: '', logoPath: '', currency: 'PKR', defaultUnit: 'inch' }, ['kameez']); }
test('encrypted backup round-trip includes branding and rejects wrong passwords and tampering', async () => { const f = fixture(); f.state.shops[0].logoPath = 'data:image/png;base64,dGVzdA=='; const encoded = await encryptBackup(f.state, 'long-test-password', randomBytes); assert.ok(!encoded.includes('Tailor')); assert.deepEqual(await decryptBackup(encoded, 'long-test-password'), f.state); await assert.rejects(decryptBackup(encoded, 'incorrect-password')); const tampered = JSON.parse(encoded); tampered.ciphertext = 'ff' + tampered.ciphertext.slice(2); await assert.rejects(decryptBackup(JSON.stringify(tampered), 'long-test-password')); });
test('backup rejects short password, unknown format and expensive untrusted KDF settings', async () => { const f = fixture(); await assert.rejects(encryptBackup(f.state, 'short', randomBytes)); await assert.rejects(decryptBackup('{}', 'test')); await assert.rejects(decryptBackup(JSON.stringify({ format: 'tailor-master', version: 1, iterations: 999999999 }), 'test')); });
test('shop snapshot never includes another shop', () => { const a = fixture(); const b = createShop(a.state, ctx, { name: 'Other', ownerName: 'Owner', phone: '000', address: '', logoPath: '', currency: 'PKR', defaultUnit: 'cm' }, ['shalwar']); assert.equal(shopSnapshot(b.state, a.shopId).shops.length, 1); assert.equal(shopSnapshot(b.state, a.shopId).shops[0].name, 'Tailor'); });
function adapter() { const db = new DatabaseSync(':memory:'); const driver: DB = { execAsync: async (s) => { db.exec(s); }, runAsync: async (s, ...p) => db.prepare(s).run(...p), getAllAsync: async <T>(s: string, ...p: (string | number | null)[]) => db.prepare(s).all(...p) as T[], withTransactionAsync: async (fn) => { db.exec('BEGIN'); try {
        await fn();
        db.exec('COMMIT');
    }
    catch (e) {
        db.exec('ROLLBACK');
        throw e;
    } } }; return { db, repo: new Repository(driver) }; }
test('restore replaces selected shop atomically and preserves other shop and device language', async () => { const { repo } = adapter(); await repo.initialize(); const a = fixture(); const b = createShop(a.state, ctx, { name: 'Other', ownerName: 'Owner', phone: '000', address: '', logoPath: '', currency: 'PKR', defaultUnit: 'inch' }, ['shalwar']); const c = saveCustomer(b.state, ctx, a.shopId, { name: 'New customer', phone: '', address: '', notes: '' }); await repo.save(c.state); await repo.saveDevice({ deviceId: 'test', language: 'ur', activeShopId: a.shopId }); await repo.restoreShop(a.state, a.shopId); const restored = await repo.load(); assert.equal(restored.customers.length, 0); assert.equal(restored.shops.length, 2); assert.equal((await repo.getDevice())?.language, 'ur'); await assert.rejects(repo.restoreShop(a.state, b.shopId)); });
test('restore write failure rolls back original shop records', async () => { const { db, repo } = adapter(); await repo.initialize(); const a = fixture(); await repo.save(a.state); const c = saveCustomer(a.state, ctx, a.shopId, { name: 'New customer', phone: '', address: '', notes: '' }); db.exec("CREATE TRIGGER restore_failure BEFORE INSERT ON Customers BEGIN SELECT RAISE(ABORT,'failure'); END;"); await assert.rejects(repo.restoreShop(c.state, a.shopId)); assert.deepEqual(await repo.load(), a.state); });

