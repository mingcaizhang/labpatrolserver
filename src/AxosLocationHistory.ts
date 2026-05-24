import * as sqlite3 from 'sqlite3';

type LocationType = 'card' | 'module' | 'ont';

const COLUMN_MAP: { [key: string]: string } = {
    'axoscard': 'SERIAL NO',
    'examodule': 'ManufacturerSerial',
    'axosmodule': 'vendor-serial-number',
    'exaont': 'Serial #',
    'axosont': 'SERIAL NUMBER',
};

const TYPE_TO_PREFIXES: { [key: string]: string[] } = {
    'card': ['axoscard'],
    'module': ['examodule', 'axosmodule'],
    'ont': ['exaont', 'axosont'],
};

interface LocationEntry {
    timestamp: Date;
    address: string;
    tableName: string;
}

export class AxosLocationHistory {
    private dbPath = '../labpatrol/labpatrol.db';
    private monthMap: { [key: string]: number } = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };

    private parseDbName(tableName: string): { date: Date, prefix: string } | null {
        // Pattern: (axoscard|examodule|axosmodule|exaont|axosont)YYYYMonDDHHMM
        const regex = /^(axoscard|examodule|axosmodule|exaont|axosont)(\d{4})([a-zA-Z]{3})(\d{2})(\d{4})/;
        const match = tableName.match(regex);
        if (!match) return null;

        const prefix = match[1];
        const year = parseInt(match[2], 10);
        const month = this.monthMap[match[3]];
        const day = parseInt(match[4], 10);
        const timeStr = match[5];
        const hour = parseInt(timeStr.substring(0, 2), 10);
        const minute = parseInt(timeStr.substring(2, 4), 10);

        if (month === undefined) return null;

        return { date: new Date(year, month, day, hour, minute), prefix };
    }

    async getLocationHistory(sn: string, type: LocationType = 'card'): Promise<LocationEntry[]> {
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database(this.dbPath, sqlite3.OPEN_READONLY, (err) => {
                if (err) {
                    reject(new Error(`Error opening DB ${this.dbPath}: ${err}`));
                    return;
                }
            });

            // 1. Retrieve all table names that match the pattern for the given type
            const prefixes = TYPE_TO_PREFIXES[type];
            const tableQuery = `SELECT name FROM sqlite_master WHERE type='table' AND (${prefixes.map(p => `name LIKE '${p}%'`).join(' OR ')})`;

            db.all(tableQuery, [], async (err, tables: { name: string }[]) => {
                if (err) {
                    db.close();
                    reject(new Error(`Error retrieving tables: ${err}`));
                    return;
                }

                // 2. Parse and filter valid date tables
                const validTables: { name: string, date: Date, prefix: string }[] = [];
                for (const table of tables) {
                    const parsed = this.parseDbName(table.name);
                    if (parsed) {
                        validTables.push({ name: table.name, date: parsed.date, prefix: parsed.prefix });
                    }
                }

                // 3. Order from old to new
                validTables.sort((a, b) => a.date.getTime() - b.date.getTime());

                // 4. Query each table for the SN
                const history: LocationEntry[] = [];

                try {
                    for (const table of validTables) {
                        const address = await new Promise<string | null>((res) => {
                            const column = COLUMN_MAP[table.prefix];
                            const sql = `SELECT address FROM ${table.name} WHERE UPPER("${column}") LIKE '%' || UPPER(?) || '%'`;
                            db.get(sql, [sn], (err, row: any) => {
                                if (err || !row) {
                                    res(null);
                                } else {
                                    res(row.address);
                                }
                            });
                        });

                        if (address) {
                            history.push({
                                timestamp: table.date,
                                address: address,
                                tableName: table.name
                            });
                        }
                    }
                    db.close();
                    resolve(history);
                } catch (e) {
                    db.close();
                    reject(e);
                }
            });
        });
    }
}

// --- Test Code ---
if (require.main === module) {
    (async () => {
        const historyService = new AxosLocationHistory();
        let testSn = '211806603448'; // Replace with a real SN from your DB for testing

        console.log(`Fetching location history for SN: ${testSn} from single DB file...`);
        try {
            const history = await historyService.getLocationHistory(testSn);
            if (history.length === 0) {
                console.log('No history found for this SN.');
            } else {
                console.log('Location History:');
                history.forEach((entry, index) => {
                    console.log(`${index + 1}. ${entry.timestamp.toISOString()} - ${entry.address} (Table: ${entry.tableName})`);
                });
            }
        } catch (error) {
            console.error('An error occurred:', error);
        }
        testSn = 'CE96B4';
        console.log(`Fetching location history for SN: ${testSn} from single DB file...`);
        try {
            const history = await historyService.getLocationHistory(testSn, "ont");
            if (history.length === 0) {
                console.log('No history found for this SN.');
            } else {
                console.log('Location History:');
                history.forEach((entry, index) => {
                    console.log(`${index + 1}. ${entry.timestamp.toISOString()} - ${entry.address} (Table: ${entry.tableName})`);
                });
            }
        } catch (error) {
            console.error('An error occurred:', error);
        }
        testSn = 'H3675A00185';
        console.log(`Fetching location history for SN: ${testSn} from single DB file...`);
        try {
            const history = await historyService.getLocationHistory(testSn, "module");
            if (history.length === 0) {
                console.log('No history found for this SN.');
            } else {
                console.log('Location History:');
                history.forEach((entry, index) => {
                    console.log(`${index + 1}. ${entry.timestamp.toISOString()} - ${entry.address} (Table: ${entry.tableName})`);
                });
            }
        } catch (error) {
            console.error('An error occurred:', error);
        }
        
    })();
}
