import { io } from 'socket.io-client';
import {socketURL} from "utils/env"
const socket=io(socketURL, {forceNew: true, secure: true});
export {
	socket
}