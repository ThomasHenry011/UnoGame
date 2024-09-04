const {
    joinServer,
    createServer,
    addBots,
    initGame,
    startGame,
    move,
    leaveServer,
  } = require('./api');
  const { getServer, setServer, deleteServer } = require('./DB/Servers');
  const { addPlayer, removePlayer, getPlayer } = require('./DB/PlayersSockets');
  
  jest.mock('./DB/Servers');
  jest.mock('./DB/PlayersSockets');
  jest.mock('./DB/Cards');
  jest.mock('./DB/Bots');
  jest.mock('./server', () => ({
    io: {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    },
  }));
  
  describe('API Tests', () => {
    it('should create a server', () => {
      const serverId = createServer({ serverName: 'Test Server', serverPassword: '123' });
      expect(serverId).toBeDefined();
      expect(setServer).toHaveBeenCalled();
    });
  
    it('should join a server', () => {
      getServer.mockReturnValue({
        serverPassword: '123',
        players: [],
        numberOfPlayers: 4,
        joinPlayer: jest.fn().mockReturnValue('playerId'),
      });
      const cb = jest.fn();
      const socket = { id: 'socketId', join: jest.fn() };
      joinServer({
        serverId: 'server1',
        serverPassword: '123',
        player: { name: 'Player' },
        socket,
        cb,
      });
      expect(cb).toHaveBeenCalledWith(null, 'playerId');
      expect(socket.join).toHaveBeenCalledWith('server1');
    });
  
    it('should not join a server with invalid password', () => {
      getServer.mockReturnValue({
        serverPassword: 'wrongPassword',
      });
      expect(() => {
        joinServer({
          serverId: 'server1',
          serverPassword: '123',
          player: { name: 'Player' },
        });
      }).toThrow('Invalid Server Password');
    });
  
    it('should start a game', () => {
      getServer.mockReturnValue({
        gameRunning: false,
        players: [{}, { disconnected: false, isBot: false }],
        onFinish: jest.fn(),
      });
      startGame('server1');
      expect(getServer().gameRunning).toBe(true);
    });
  
    it('should move a player', () => {
      getServer.mockReturnValue({
        players: [{ id: 'player1', socketId: 'socket1' }],
        curPlayer: 0,
        move: jest.fn().mockReturnValue({ nxtPlayer: 1, cardsToDraw: [] }),
      });
      getPlayer.mockReturnValue({ playerId: 'player1', serverId: 'server1' });
      const socket = { id: 'socket1', emit: jest.fn(), broadcast: { to: jest.fn().mockReturnThis() } };
      move({ socket, cardId: 'card1', draw: 0 });
      expect(socket.emit).toHaveBeenCalled();
    });
  });
  