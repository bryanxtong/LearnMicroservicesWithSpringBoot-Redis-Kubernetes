import { getToken } from '../keycloak';

class ChallengeApiClient {
    // Use environment variable or default to /api for Kubernetes Ingress
    static SERVER_URL = process.env.REACT_APP_API_URL || 'http://localhost/api';
    static GET_CHALLENGE = '/challenges/random';
    static POST_RESULT = '/attempts';
    static GET_ATTEMPTS_BY_ALIAS = '/attempts?alias=';
    static GET_USERS_BY_IDS = '/users';

    static getAuthHeaders() {
        const token = getToken();
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }

    static challenge(): Promise<Response> {
        let res = fetch(ChallengeApiClient.SERVER_URL + ChallengeApiClient.GET_CHALLENGE);
        console.log(res);
        return res;
    }

    static sendGuess(user: string,
                     a: number,
                     b: number,
                     guess: number): Promise<Response>
    {
        return fetch(ChallengeApiClient.SERVER_URL + ChallengeApiClient.POST_RESULT,
    {
            method: 'POST',
            headers: ChallengeApiClient.getAuthHeaders(),
            body: JSON.stringify(
                { alias: user, factorA: a, factorB: b, guess: guess }
            )
        });
    }

    static getAttempts(alias: string): Promise<Response> {
        console.log('Get attempts for '+alias);
        return fetch(ChallengeApiClient.SERVER_URL +
            ChallengeApiClient.GET_ATTEMPTS_BY_ALIAS + alias, {
            headers: ChallengeApiClient.getAuthHeaders()
        });
    }

    static getUsers(userIds: number[]): Promise<Response> {
        return fetch(ChallengeApiClient.SERVER_URL +
            ChallengeApiClient.GET_USERS_BY_IDS +
            '/' + userIds.join(','), {
            headers: ChallengeApiClient.getAuthHeaders()
        });
    }

}
export default ChallengeApiClient;
