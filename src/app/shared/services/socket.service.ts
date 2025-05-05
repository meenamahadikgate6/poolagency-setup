import { environment } from './../../../environments/environments';
import { Injectable } from '@angular/core';
import { io } from 'socket.io-client';
import { AuthService } from '../../auth/services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket: any;
  public onlineServiceMang: any[] = [];
  public onlineServiceMangProcessing = false;

  constructor(private authService: AuthService) {}

  initializeSocket() {
    
    const session = this.authService.getSession();
    if (!session) return;

    let userId = session.userIdForSocket || session.userId;
    let requestedCompanyId = session.parentCompanyId || session.companyId;

    if (session.companyId === session.parentCompanyId) {
      userId = session.loggedInUserId;
    }

    const socketServer = environment.socketBaseUrl;
    console.log(`Trying to connect socket: ${socketServer}?userId=${userId}&requestedCompanyId=${requestedCompanyId}`);

    this.socket = io(`${socketServer}?userId=${userId}&requestedCompanyId=${requestedCompanyId}`, {
      transports: ['websocket'],
    });

    this.onlineServiceMangProcessing = true;

    this.socket.on("connect", () => {
      console.log("Socket connected!!!");
      this.socket.emit("refreshManagerList");
    });

    this.socket.on("disconnect", () => {
      console.log("Socket disconnected!!!");
    });

    this.socket.on("refreshManagerList", (data: any) => {
      this.onlineServiceMang = Object.keys(data.users).map((key) => data.users[key]);
      this.onlineServiceMangProcessing = false;
    });
  }

  getSocketInstance() {
    return this.socket;
  }

  getOnlineManagers() {
    return this.onlineServiceMang;
  }

  getProcessingStatus() {
    return this.onlineServiceMangProcessing;
  }
}
