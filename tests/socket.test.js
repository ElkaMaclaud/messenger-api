import { Server } from "socket.io";
import { createServer } from "http";
import { io as Client } from "socket.io-client";
import { createSocketServer } from "../services/socket";

const httpServer = createServer();
const socketServer = createSocketServer(httpServer);
const PORT = 3001;

httpServer.listen(PORT, () => {
    console.log(`Socket.IO server running on port ${PORT}`);
});

describe("Socket.IO Service Tests", () => {
    let clientSocket;

    beforeAll((done) => {
        clientSocket = Client(`http://localhost:${PORT}`, {
            transports: ["websocket"],
            auth: {
                token: "Bearer " 
            }
        });

        clientSocket.on("connect", () => {
            done();
        });
    });

    afterAll((done) => {
        clientSocket.disconnect();
        httpServer.close(done);
    });

    test("should join a room", (done) => {
        const chatId = "testChatId";
        clientSocket.emit("join room", chatId);

        clientSocket.on("connect", () => {
            expect(clientSocket.rooms.has(chatId)).toBe(true);
            done();
        });
    });

    test("should send and receive a chat message", (done) => {
        const chatId = "testChatId";
        const messageContent = "Hello, World!";

        clientSocket.emit("join room", chatId);

        clientSocket.on("chat message", (message) => {
            expect(message.content).toBe(messageContent);
            expect(message.status).toBe("sent");
            done();
        });

        clientSocket.emit("chat message", messageContent);
    });

    test("should mark a message as read", (done) => {
        const messageId = ""; 

        clientSocket.emit("message read", messageId);

        clientSocket.on("message status updated", (data) => {
            expect(data.messageId).toBe(messageId);
            expect(data.status).toBe("read");
            done();
        });
    });
});