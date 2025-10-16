import { DbConnection } from "@/spacetime_bindings";
import { getDbConnection } from "@bitcraft/spacetime";

let _dbConnection: DbConnection | null = null;

/**
 * Initialize the SpacetimeDB connection
 * @returns A promise that resolves when the connection is initialized
 */
export const initializeSpacetime = async (): Promise<DbConnection> => {
    _dbConnection = getDbConnection({
        onConnect: (conn) => {
            _dbConnection = conn;
        },
        onDisconnect: () => {
            _dbConnection = null;
        }
    });

    await waitForSpacetime();

    return _dbConnection;
}

export const spacetime = (): DbConnection => {
    if(!_dbConnection) {
        throw new Error("SpacetimeDB connection not initialized");
    }
    return _dbConnection;
}

/**
 * Wait for the SpacetimeDB connection to be initialized
 * @param timeBetweenChecksInMs The time to wait between checks in milliseconds, defaults to 500ms
 * @returns A promise that resolves when the connection is initialized
 * @throws An error if the connection is not initialized after 10 checks
 */
export const waitForSpacetime = (timeBetweenChecksInMs: number = 500): Promise<void> => {
    return new Promise((resolve, reject) => {
        let checks = 0;
        const check = () => {
            if (_dbConnection && _dbConnection.isActive) {
                resolve();
            } else {
                checks++;
                if (checks > 10) {
                    reject(new Error("Failed to connect to SpaceTimeDB"));
                }
                setTimeout(check, timeBetweenChecksInMs);
            }
        }
        check();
    });
}

/**
 * 
 * @param query  The query to subscribe to
 * @param onApplied  A callback to call when the subscription has been applied
 * @returns The subscription object
 */
export const applySubscription = (query: string, onApplied?: () => void | Promise<void>) => {
    if(!_dbConnection) {
        throw new Error("SpacetimeDB connection not initialized");
    }

    const builder = _dbConnection.subscriptionBuilder();

    if(onApplied) {
        builder.onApplied(async () => onApplied());
    }
    
    return builder.subscribe(query);
}