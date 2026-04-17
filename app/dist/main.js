"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const dotenv_1 = require("dotenv");
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const envPaths = [
    (0, node_path_1.resolve)(__dirname, '../../.env'),
    (0, node_path_1.resolve)(process.cwd(), '.env'),
];
const envPath = envPaths.find((pathToEnv) => (0, node_fs_1.existsSync)(pathToEnv));
if (envPath) {
    (0, dotenv_1.config)({ path: envPath });
}
const MAX_PORT_ATTEMPTS = 20;
const bootstrapLogger = new common_1.Logger('Bootstrap');
const resolveInitialPort = () => {
    const parsedPort = Number.parseInt(process.env.PORT ?? '3000', 10);
    return Number.isNaN(parsedPort) ? 3000 : parsedPort;
};
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const initialPort = resolveInitialPort();
    for (let attempt = 0; attempt < MAX_PORT_ATTEMPTS; attempt += 1) {
        const port = initialPort + attempt;
        try {
            await app.listen(port);
            bootstrapLogger.log(`Application is running on port ${port}`);
            return;
        }
        catch (error) {
            if (error instanceof Error &&
                'code' in error &&
                error.code === 'EADDRINUSE') {
                bootstrapLogger.warn(`Port ${port} is busy. Trying ${port + 1}...`);
                continue;
            }
            throw error;
        }
    }
    throw new Error(`Unable to start server. No free port in range ${initialPort}-${initialPort + MAX_PORT_ATTEMPTS - 1}.`);
}
bootstrap();
//# sourceMappingURL=main.js.map