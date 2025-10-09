import { DbConnection } from "@/spacetime_bindings";

export const getDbConnection = () => {
    console.log('Getting DB connection');
    return DbConnection.builder()
        .withUri('wss://bitcraft-early-access.spacetimedb.com')
        .withModuleName('bitcraft-global')
        .withToken(process.env.SPACETIME_AUTH_TOKEN)
        .onConnect(() => {
            console.log('Connected to SpaceTimeDB');
        })
        .onDisconnect(() => {
            console.log('Disconnected from SpaceTimeDB');
        })
        .build();
}