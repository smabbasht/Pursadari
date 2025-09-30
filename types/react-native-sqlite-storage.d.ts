declare module 'react-native-sqlite-storage' {
  namespace SQLite {
    interface ResultSet {
      rows: {
        length: number;
        item(index: number): any;
      };
    }

    interface SQLiteDatabase {
      executeSql(sqlStatement: string, params?: any[]): Promise<[ResultSet]>;
      transaction(cb: (tx: any) => void, error?: (e: any) => void, success?: () => void): void;
      readTransaction(cb: (tx: any) => void, error?: (e: any) => void, success?: () => void): void;
      close(): Promise<void> | void;
    }
  }

  const SQLite: {
    enablePromise(val: boolean): void;
    openDatabase(options: any): Promise<SQLite.SQLiteDatabase> | SQLite.SQLiteDatabase;
  };

  export default SQLite;
}
