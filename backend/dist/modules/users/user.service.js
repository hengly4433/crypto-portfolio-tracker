"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const db_1 = require("../../config/db");
class UserService {
    async createUser(email, passwordHash, fullName) {
        return db_1.prisma.user.create({
            data: {
                email,
                passwordHash,
                fullName,
            },
        });
    }
    async findUserByEmail(email) {
        return db_1.prisma.user.findUnique({
            where: { email },
        });
    }
    async findUserById(id) {
        return db_1.prisma.user.findUnique({
            where: { id },
        });
    }
}
exports.UserService = UserService;
