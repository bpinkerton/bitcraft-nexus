/**
 * Base module class for setup automation
 * All setup modules should extend this class
 */

export interface ModuleResult {
    status: 'complete' | 'skipped' | 'failed';
    message: string;
}

export interface ModuleDependency {
    module: string;
    required: boolean;
}

export abstract class Module {
    abstract readonly name: string;
    abstract readonly description: string;

    /**
     * List of module dependencies
     * Modules will be executed in dependency order
     */
    readonly dependencies: ModuleDependency[] = [];

    /**
     * Check if this module needs to be run
     * @returns true if setup is needed, false if already complete
     */
    abstract isComplete(): Promise<boolean>;

    /**
     * Execute the module's setup process
     * Should be idempotent - safe to run multiple times
     */
    abstract run(): Promise<ModuleResult>;

    /**
     * Optional validation after setup
     * Override to add custom validation logic
     */
    async validate(): Promise<boolean> {
        return this.isComplete();
    }

    /**
     * Optional cleanup on failure
     * Override to implement rollback logic
     */
    async cleanup(): Promise<void> {
        // Default: no cleanup
    }
}
