class GameApiClient {
    // Use environment variable or default to /api for Kubernetes Ingress
    static SERVER_URL = process.env.REACT_APP_API_URL || 'http://localhost/api';
    static GET_LEADERBOARD = '/leaders';

    static leaderBoard(): Promise<Response> {
        return fetch(GameApiClient.SERVER_URL +
            GameApiClient.GET_LEADERBOARD);
    }

}

export default GameApiClient;