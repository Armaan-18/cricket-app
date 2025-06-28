
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Match } from '../../../types';
import socketService from '../utils/socket';
import axios from 'axios';

interface MatchStats {
  totalConnectedClients: number;
  activeMatches: Match[];
}

export default function Home() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [connectedClients, setConnectedClients] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatches = async () => {
      try {

        let response;
        try {
          response = await axios.get('http://localhost:3000/matches/ongoing/today');
          console.log('Fetched ongoing matches:', response.data);
        } catch (ongoingErr) {
          console.log('No ongoing matches, fetching all matches');
          response = await axios.get('http://localhost:3000/matches');
          console.log('Fetched all matches:', response.data);
        }
        
        if (response.data) {
          setMatches(Array.isArray(response.data) ? response.data : []);
          setLoading(false);
          setError(null);
        } else {
          setMatches([]);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to fetch matches via HTTP:', err);
        if (err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'data' in err.response && err.response.data && typeof err.response.data === 'object' && 'message' in err.response.data) {
          setError(`Failed to load matches: ${(err as any).response.data.message}`);
        } else if (err && typeof err === 'object' && 'message' in err) {
          setError(`Failed to load matches: ${(err as any).message}`);
        } else {
          setError('Failed to load matches: Unknown error');
        }
        setLoading(false);
      }
    };

    const initializeSocket = () => {
      const socket = socketService.getSocket();
      
      if (socket) {
        socket.on('connect', () => {
          console.log('Socket connected');
          socket.emit('getMatchStats');
          setError(null);
        });

        socket.on('disconnect', () => {
          console.log('Socket disconnected');
          setError('Connection lost');
        });

        socket.on('activeMatches', (data) => {
          console.log('Received active matches:', data);
          const matchesArray = data.matches || data || [];
          setMatches(Array.isArray(matchesArray) ? matchesArray : []);
          setLoading(false);
          setError(null);
        });

        socket.on('matchStarted', (data) => {
          console.log('New match started:', data);
          setMatches(prev => {
            const exists = prev.some(match => match.matchId === data.match.matchId);
            if (!exists) {
              return [...prev, data.match];
            }
            return prev;
          });
        });

        socket.on('matchStats', (stats: MatchStats) => {
          console.log('Received match stats:', stats);
          setConnectedClients(stats.totalConnectedClients);
          if (stats.activeMatches) {
            setMatches(Array.isArray(stats.activeMatches) ? stats.activeMatches : []);
            setLoading(false);
          }
        });

        socket.on('connect_error', (error: any) => {
          console.error('Socket connection error:', error);
          setError('Connection error');
          setLoading(false);
        });


        if (socket.connected) {
          socket.emit('getMatchStats');
        }
      } else {
        console.error('Failed to initialize socket');
        setError('Failed to connect to server');
        fetchMatches(); 
      }
    };

    initializeSocket();
    
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.log('Timeout reached, fetching via HTTP');
        fetchMatches();
      }
    }, 5000);

    return () => {
      clearTimeout(timeoutId);
      const socket = socketService.getSocket();
      if (socket) {
        socket.off('connect');
        socket.off('disconnect');
        socket.off('activeMatches');
        socket.off('matchStarted');
        socket.off('matchStats');
        socket.off('connect_error');
      }
    };
  }, []);

  const formatDate = (dateString: string | Date): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          Loading matches...
          {error && <div className="error">{error}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <header className="header">
        <h1>🏏 Live Cricket Commentary</h1>
        <div className="stats">
          <span className="stat">Connected Users: {connectedClients}</span>
          <span className="stat">Active Matches: {matches.length}</span>
        </div>
        {error && <div className="error-banner">{error}</div>}
      </header>

      <main className="main">
        <h2>Ongoing Matches</h2>
        
        {matches.length === 0 ? (
          <div className="no-matches">
            <p>No matches currently active</p>
            <button onClick={() => window.location.reload()}>Refresh</button>
          </div>
        ) : (
          <div className="matches-grid">
            {matches.map((match) => (
              <Link href={`/match/${match.matchId}`} key={match.matchId}>
                <div className="match-card">
                  <div className="match-header">
                    <span className="match-id">Match #{match.matchId}</span>
                    <span className="live-indicator">🔴 LIVE</span>
                  </div>
                  <div className="match-teams">
                    <h3>{match.teamA} vs {match.teamB}</h3>
                  </div>
                  <div className="match-date">
                    {formatDate(match.date)}
                  </div>
                  <div className="match-commentary-count">
                    {match.commentary ? match.commentary.length : 0} Commentary Updates
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}