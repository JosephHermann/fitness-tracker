import { Injectable, signal } from '@angular/core';
import { ProgressPhoto } from '../models/photo.model';

@Injectable({
  providedIn: 'root',
})
export class IndexedDbService {
  private readonly dbName = 'fitness_tracker_db';
  private readonly storeName = 'progress_photos';
  private readonly dbVersion = 1;
  private db: IDBDatabase | null = null;

  public readonly photos = signal<ProgressPhoto[]>([]);

  constructor() {
    this.initDatabase().then(() => {
      this.refreshPhotos();
    }).catch((err) => {
      console.error('Error inicializando IndexedDB:', err);
    });
  }

  private async initDatabase(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB no está disponible en este entorno'));
        return;
      }

      const request = window.indexedDB.open(this.dbName, this.dbVersion);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('by_date', 'date', { unique: false });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        reject((event.target as IDBOpenDBRequest).error);
      };
    });
  }

  public async refreshPhotos(): Promise<ProgressPhoto[]> {
    try {
      const db = await this.initDatabase();
      const list = await new Promise<ProgressPhoto[]>((resolve, reject) => {
        const tx = db.transaction(this.storeName, 'readonly');
        const store = tx.objectStore(this.storeName);
        const req = store.getAll();

        req.onsuccess = () => {
          const results = (req.result as ProgressPhoto[]) || [];
          results.sort((a, b) => b.createdAt - a.createdAt);
          resolve(results);
        };

        req.onerror = () => reject(req.error);
      });

      this.photos.set(list);
      return list;
    } catch (err) {
      console.warn('Fallo al obtener fotos de IndexedDB:', err);
      return [];
    }
  }

  public async savePhoto(photo: ProgressPhoto): Promise<void> {
    const db = await this.initDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const req = store.put(photo);

      req.onsuccess = () => {
        this.refreshPhotos().then(() => resolve());
      };

      req.onerror = () => reject(req.error);
    });
  }

  public async deletePhoto(id: string): Promise<void> {
    const db = await this.initDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const req = store.delete(id);

      req.onsuccess = () => {
        this.refreshPhotos().then(() => resolve());
      };

      req.onerror = () => reject(req.error);
    });
  }

  public async clearAllPhotos(): Promise<void> {
    const db = await this.initDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const req = store.clear();

      req.onsuccess = () => {
        this.photos.set([]);
        resolve();
      };

      req.onerror = () => reject(req.error);
    });
  }
}
