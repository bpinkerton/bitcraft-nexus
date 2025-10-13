"use client";

import { useEffect, useState } from "react";

interface SchemaTable {
    name: string;
    table_access?: { Public?: boolean };
    product_type_ref?: number;
}

interface SchemaElement {
    name?: { some: string };
}

interface SchemaType {
    Product?: {
        elements?: SchemaElement[];
    };
}

interface SchemaData {
    V9?: {
        tables?: SchemaTable[];
        typespace?: {
            types?: SchemaType[];
        };
    };
    tables?: SchemaTable[];
    typespace?: {
        types?: SchemaType[];
    };
}

export default function SQLExplorerPage() {
    const [schema, setSchema] = useState<SchemaData | null>(null);
    const [tables, setTables] = useState<string[]>([]);
    const [selectedTable, setSelectedTable] = useState<string>("");
    const [selectedColumn, setSelectedColumn] = useState<string>("ALL");
    const [queryValue, setQueryValue] = useState<string>("");
    const [results] = useState<Record<string, unknown>[]>([]);
    const [status, setStatus] = useState<string>("Loading...");
    const [currentPage, setCurrentPage] = useState<number>(0);

    const pageSize = 10;
    const totalPages = Math.ceil(results.length / pageSize);

    useEffect(() => {
        // Load schema and auth token
        Promise.all([
            fetch("/api/schema").then(res => res.json()),
            fetch("/api/auth-token").then(res => res.text()),
        ])
            .then(([schemaData]) => {
                setSchema(schemaData);

                // Extract public tables from V9 schema
                const v9Schema = schemaData?.V9 || schemaData;
                const publicTables =
                    v9Schema?.tables
                        ?.filter((t: SchemaTable) => t.table_access?.Public)
                        ?.map((t: SchemaTable) => t.name)
                        ?.sort() || [];

                setTables(publicTables);
                setStatus("Ready. Choose a table to query.");
            })
            .catch((error: Error) => {
                setStatus(`Error loading: ${error.message}`);
            });
    }, []);

    const handleQuery = () => {
        if (!selectedTable) {
            setStatus("Please select a table first.");
            return;
        }

        // Build a parameterized query for display; never inline user input
        const params: unknown[] = [];
        let queryText = `SELECT * FROM ${quoteIdentifier(selectedTable)}`;

        if (selectedColumn !== "ALL" && queryValue) {
            queryText += ` WHERE ${quoteIdentifier(selectedColumn)} = ?`;
            params.push(queryValue);
        }

        queryText += ";";

        setStatus("Querying...");
        // Here you would connect to SpacetimeDB WebSocket
        // For now, just show a message with placeholders and params
        const display =
            params.length > 0
                ? `${queryText} Params: ${JSON.stringify(params)}`
                : queryText;
        setStatus(`Would execute: ${display}`);
    };

    const columns =
        selectedTable && schema ? getTableColumns(schema, selectedTable) : [];

    const paginatedResults = results.slice(
        currentPage * pageSize,
        (currentPage + 1) * pageSize
    );

    return (
        <div className="min-h-screen bg-gray-900 text-gray-200 p-4 flex items-center justify-center">
            <div className="w-full max-w-6xl bg-gray-800 rounded-xl shadow-2xl p-6">
                <h1 className="text-3xl font-bold text-center text-cyan-400 mb-6">
                    SpacetimeDB SQL Explorer
                </h1>

                {/* Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
                    <select
                        value={selectedTable}
                        onChange={e => {
                            setSelectedTable(e.target.value);
                            setSelectedColumn("ALL");
                            setQueryValue("");
                        }}
                        className="bg-gray-700 border border-gray-600 text-white rounded-lg p-2.5 focus:ring-cyan-500 focus:border-cyan-500"
                    >
                        <option value="">Choose a table</option>
                        {tables.map(table => (
                            <option key={table} value={table}>
                                {table}
                            </option>
                        ))}
                    </select>

                    <select
                        value={selectedColumn}
                        onChange={e => setSelectedColumn(e.target.value)}
                        className="bg-gray-700 border border-gray-600 text-white rounded-lg p-2.5 focus:ring-cyan-500 focus:border-cyan-500"
                        disabled={!selectedTable}
                    >
                        <option value="ALL">ALL</option>
                        {columns.map(col => (
                            <option key={col} value={col}>
                                {col}
                            </option>
                        ))}
                    </select>

                    <input
                        type="text"
                        value={queryValue}
                        onChange={e => setQueryValue(e.target.value)}
                        placeholder="Enter value..."
                        disabled={selectedColumn === "ALL"}
                        className="bg-gray-700 border border-gray-600 text-white rounded-lg p-2.5 disabled:opacity-50"
                    />

                    <button
                        onClick={handleQuery}
                        disabled={!selectedTable}
                        className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Query
                    </button>
                </div>

                {/* Results Display */}
                <div className="bg-gray-900 rounded-lg p-4 min-h-[400px] overflow-x-auto">
                    <pre className="text-sm whitespace-pre-wrap">
                        {results.length > 0 ? (
                            paginatedResults.map((row, i) => (
                                <div
                                    key={i}
                                    className="mb-4 border-b border-gray-700 pb-2"
                                >
                                    {JSON.stringify(row, null, 2)}
                                </div>
                            ))
                        ) : (
                            <div className="text-gray-500">{status}</div>
                        )}
                    </pre>
                </div>

                {/* Pagination */}
                {results.length > 0 && (
                    <div className="flex justify-between items-center mt-4">
                        <button
                            onClick={() =>
                                setCurrentPage(p => Math.max(0, p - 1))
                            }
                            disabled={currentPage === 0}
                            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <span className="text-gray-400">
                            Page {currentPage + 1} of {totalPages}
                        </span>
                        <button
                            onClick={() =>
                                setCurrentPage(p =>
                                    Math.min(totalPages - 1, p + 1)
                                )
                            }
                            disabled={currentPage >= totalPages - 1}
                            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                )}

                {/* Status Bar */}
                <div className="text-center text-gray-500 text-xs mt-6 border-t border-gray-700 pt-2">
                    {status}
                </div>
            </div>
        </div>
    );
}

function getTableColumns(
    schema: SchemaData | null,
    tableName: string
): string[] {
    if (!schema) return [];

    const v9Schema = schema.V9 || schema;
    const table = v9Schema?.tables?.find(t => t.name === tableName);
    if (!table || table.product_type_ref == null) return [];

    const typeRef = table.product_type_ref;
    const types = v9Schema?.typespace?.types || [];

    if (!types[typeRef]?.Product?.elements) return [];

    return types[typeRef].Product.elements
        .map(el => el.name?.some)
        .filter((name): name is string => Boolean(name));
}

function quoteIdentifier(identifier: string): string {
    return `"${identifier.replace(/"/g, '""')}"`;
}
