import { DbConnection, ErrorContext } from "@/spacetime_bindings";
import { getEnvVar, logger } from "@bitcraft/shared";
import { Identity } from "spacetimedb";

const ConnectionURI = "wss://bitcraft-early-access.spacetimedb.com" as const;
const ModuleName = "bitcraft-3" as const;

interface DbConnectionOptions {
    onConnect?: (ctx: DbConnection, identity: Identity) => void;
    onConnectError?: (ctx: ErrorContext, error: Error) => void;
    onDisconnect?: (ctx: ErrorContext, error: Error | undefined) => void;
}

export const DbBuilder = DbConnection.builder()
    .withUri(ConnectionURI)
    .withModuleName(ModuleName)

export const getDbConnection = (options: DbConnectionOptions = {}): DbConnection => {
    return DbBuilder.onConnect((_, identity) => {
        logger.info(`Connected to SpaceTimeDB with identity ${identity.toHexString()}`);
        options.onConnect?.(_, identity);
    }).onConnectError((ctx, error) => {
        logger.error("Failed to connect to SpaceTimeDB:", error);
        options.onConnectError?.(ctx, error);
    })
    .onDisconnect((ctx, err) => {
        logger.info("Disconnected from SpaceTimeDB");
        options.onDisconnect?.(ctx, err);
    })
    .withToken(getEnvVar("SPACETIME_AUTH_TOKEN"))
    .build();
};

export default getDbConnection;
