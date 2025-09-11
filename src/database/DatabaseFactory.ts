import { IDatabaseService } from './interfaces/IDatabaseService';
import { SQLiteRepository } from './repositories/SQLiteRepository';
import { FirebaseRepository } from './repositories/FirebaseRepository';

export enum DatabaseType {
  SQLITE = 'sqlite',
  FIREBASE = 'firebase',
}

export class DatabaseFactory {
  static create(type: DatabaseType = DatabaseType.SQLITE): IDatabaseService {
    switch (type) {
      case DatabaseType.SQLITE:
        return new SQLiteRepository();
      case DatabaseType.FIREBASE:
        return new FirebaseRepository();
      default:
        throw new Error(`Unsupported database type: ${type}`);
    }
  }
}

// Configuration - Change this to switch database implementations
const DATABASE_TYPE: DatabaseType = DatabaseType.SQLITE;

// Export the configured database service
export const databaseService: IDatabaseService = DatabaseFactory.create(DATABASE_TYPE);
