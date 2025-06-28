export interface Commentary {
    over: number;
    ball: number;
    eventType: 'run' | 'wicket' | 'wide' | 'no-ball' | 'dot' | 'boundary' | 'six' | 'bye' | 'leg-bye';
    description: string;
    timestamp: Date;
    commentaryId: number;
    runs?: number;
    player?: string;
  }
  
  export interface Match {
    teamA: string;
    teamB: string;
    date: Date;
    matchId: number;
    commentary: Commentary[];
  }
  
  export interface SocketEvents {
    // Client to Server
    joinMatch: (data: { matchId: number }) => void;
    leaveMatch: (data: { matchId: number }) => void;
    getMatchStats: () => void;
  
    // Server to Client
    activeMatches: (data: { matches: Match[] }) => void;
    matchStarted: (data: { match: Match; timestamp: Date }) => void;
    newCommentary: (data: { matchId: number; commentary: Commentary; timestamp: Date }) => void;
    recentCommentary: (data: { matchId: number; commentary: Commentary[] }) => void;
    joinedMatch: (data: { matchId: number; message: string; clientsInRoom: number }) => void;
    matchStats: (stats: { totalConnectedClients: number; activeMatches: Match[] }) => void;
    connect: () => void;
    disconnect: () => void;
  }