import { IDatabaseService } from './interfaces/IDatabaseService';
import { SQLiteRepository } from './repositories/SQLiteRepository';

class DatabaseFactory {
  private static instance: IDatabaseService | null = null;

  static getInstance(): IDatabaseService {
    if (!DatabaseFactory.instance) {
      console.log('DatabaseFactory: Creating new SQLite database instance');
      DatabaseFactory.instance = new SQLiteRepository();
      DatabaseFactory.instance.init().catch(error => {
        console.error('Failed to initialize database:', error);
      });
    }
    return DatabaseFactory.instance;
  }
}

// Create and export the singleton instance
const databaseService = DatabaseFactory.getInstance();
export { databaseService };
export default databaseService;
