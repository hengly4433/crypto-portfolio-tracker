"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const app_1 = __importDefault(require("./app"));
const db_1 = require("./config/db");
const job_manager_1 = require("./infrastructure/jobs/job-manager");
const PORT = process.env.PORT || 3001;
async function main() {
    try {
        // Test database connection
        // await prisma.$connect();
        // console.log('Connected to database');
        // Initialize scheduled jobs (price updates, alert checks, etc.)
        (0, job_manager_1.initializeAllJobs)();
        app_1.default.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
    finally {
        await db_1.prisma.$disconnect();
    }
}
main();
