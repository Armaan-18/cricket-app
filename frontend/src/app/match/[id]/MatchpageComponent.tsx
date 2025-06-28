'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Commentary, Match } from '../../../../types';
import socketService from '../../utils/socket';
import axios from 'axios';

import { useParams } from 'next/navigation';

export default function MatchPageClient() {

  let working = 0;
  const params = useParams();
  const matchId = parseInt(params?.id as string, 10);


  const [commentary, setCommentary] = useState<Commentary[]>([]);
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [clientsInRoom, setClientsInRoom] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('Match ID from params:', params.id, 'Parsed:', matchId);
    
    if (!params.id) {
      setError('No match ID provided');
      setLoading(false);
      return;
    }
    
    if (!matchId || isNaN(matchId)) {
      setError(`Invalid match ID: ${params.id}`);
      setLoading(false);
      return;
    }

    const fetchMatchData = async () => {
      try {
        // Fetch match details via HTTP as fallback
        const matchResponse = await axios.get(`http://localhost:3000/matches/${matchId}`);
        console.log('Fetched match data:', matchResponse.data);
        
        if (matchResponse.data) {
          setMatch(matchResponse.data);
          // Set commentary from match data if available
          if (matchResponse.data.commentary) {
            setCommentary(Array.isArray(matchResponse.data.commentary) ? matchResponse.data.commentary : []);
          }
          setLoading(false);
          setError(null);
          working = 1;
        }
      } catch (err) {
        console.error('Failed to fetch match data:', err);
        if ((err as any).response?.status === 404) {
          setError('Match not found');
        } else {
          const errorMessage =
            (err as any).response?.data?.message ||
            (err as Error).message ||
            'Unknown error';
          setError(`Failed to load match: ${errorMessage}`);
        }
        setLoading(false);
      }
    };

    const initializeSocket = () => {
      const socket = socketService.getSocket();

      if (socket) {
        // Socket connection events
        socket.on('connect', () => {
          console.log('Socket connected for match', matchId);
          socketService.joinMatch(matchId);
          setError(null);
        });

        socket.on('disconnect', () => {
          console.log('Socket disconnected');
          setConnected(false);
        });

        socket.on('joinedMatch', (data) => {
          console.log('Joined match successfully:', data);
          setConnected(true);
          setClientsInRoom(data.clientsInRoom || 0);
          setLoading(false);
          setError(null);
        });

        socket.on('recentCommentary', (data) => {
          console.log('Received recent commentary:', data);
          if (data.matchId === matchId) {
            setCommentary(Array.isArray(data.commentary) ? data.commentary : []);
          }
        });

        socket.on('newCommentary', (data) => {
          console.log('New commentary received:', data);
          if (data.matchId === matchId) {
            setCommentary(prev => [data.commentary, ...prev]);
          }
        });

        socket.on('activeMatches', (data) => {
          console.log('Active matches updated:', data);
          const currentMatch = data.matches?.find(m => m.matchId === matchId);
          if (currentMatch) {
            setMatch(currentMatch);
            if (currentMatch.commentary) {
              setCommentary(Array.isArray(currentMatch.commentary) ? currentMatch.commentary : []);
            }
            setLoading(false);
            setError(null);
            working = 1;
          }
        });

        socket.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
          setError('Connection error');
        });

        if (socket.connected) {
          socketService.joinMatch(matchId);
        }
      } else {
        console.error('Failed to initialize socket');
        setError('Failed to connect to live updates');
      }
    };

    fetchMatchData();
    initializeSocket();

    const timeoutId = setTimeout(() => {
      if (loading) {
        console.log('Timeout reached, stopping loading');
        setLoading(false);
        if (working === 0) {
          setError('Unable to load match data');
        }
      }
    }, 1000);

    return () => {
      clearTimeout(timeoutId);
      const socket = socketService.getSocket();
      if (socket) {
        socketService.leaveMatch(matchId);
        socket.off('connect');
        socket.off('disconnect');
        socket.off('joinedMatch');
        socket.off('recentCommentary');
        socket.off('newCommentary');
        socket.off('activeMatches');
        socket.off('connect_error');
      }
    };
  }, [matchId]);

  const getEventIcon = (eventType: Commentary['eventType']): string => {
    const icons = {
      'run': '🏃',
      'wicket': '🎯',
      'wide': '↔️',
      'no-ball': '❌',
      'dot': '⚫',
      'boundary': '4️⃣',
      'six': '6️⃣',
      'bye': '🔄',
      'leg-bye': '🦵'
    };
    return icons[eventType] || '🏏';
  };

  const formatTime = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          Connecting to match...
          {error && <div className="error">{error}</div>}
        </div>
      </div>
    );
  }

  if (error && !match) {
    return (
      <div className="container">
        <header className="header">
          <Link href="/" className="back-button">← Back to Matches</Link>
          <h1>Match #{matchId}</h1>
        </header>
        <div className="error-container">
          <div className="error">{error}</div>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <header className="header">
        <Link href="/" className="back-button">← Back to Matches</Link>
        <div className="match-info">
          {match ? (
            <>
              <h1>{match.teamA} vs {match.teamB}</h1>
              <span className="match-id">Match #{matchId}</span>
            </>
          ) : (
            <h1>Match #{matchId}</h1>
          )}
        </div>
        <div className="connection-status">
          <span className={`status ${connected ? 'connected' : 'disconnected'}`}>
            {connected ? '🟢 Live' : '🟡 Loading'}
          </span>
          {connected && <span className="viewers">{clientsInRoom} viewers</span>}
        </div>
        {error && <div className="error-banner">{error}</div>}
      </header>

      <main className="match-main">
        <div className="commentary-section">
          <h2>Live Commentary</h2>
          {commentary.length === 0 ? (
            <div className="no-commentary">
              <p>No commentary available yet</p>
              {!connected && (
                <button onClick={() => window.location.reload()}>
                  Refresh for updates
                </button>
              )}
            </div>
          ) : (
            <div className="commentary-feed">
              {commentary.map((item, index) => (
                <div key={item.commentaryId || index} className="commentary-item">
                  <div className="commentary-header">
                    <span className="over-ball">{item.over}.{item.ball}</span>
                    <span className="event-type">{getEventIcon(item.eventType)} {item.eventType}</span>
                    <span className="timestamp">{formatTime(item.timestamp)}</span>
                  </div>
                  <div className="commentary-description">{item.description}</div>
                  {item.runs !== undefined && <div className="runs">Runs: {item.runs}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}