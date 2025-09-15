'use strict';

import axios from 'axios';

export const jiraUrl = process.env.VUE_APP_JIRA_URL;
export const jiraApiUrlTemplate = 'https://api.atlassian.com/ex/jira/{id}/rest/api/2';

export const clientId = process.env.VUE_APP_JIRA_CLIENT_ID;
export const clientSecret = process.env.VUE_APP_JIRA_CLIENT_SECRET;
export const redirectUri = process.env.VUE_APP_JIRA_REDIRECT_URL;
export const oauthUri = 'https://auth.atlassian.com';
export const oauthAuthorizeUri = process.env.VUE_APP_JIRA_OAUTH_AUTHORIZE_URL || `${oauthUri}/authorize`;
export const oauthTokenUri = process.env.VUE_APP_JIRA_OAUTH_TOKEN_URL || `${oauthUri}/oauth/token`;
export const oauthAccessibleResourcesUri = process.env.VUE_APP_JIRA_OAUTH_ACCESSIBLE_RESOURCES_URL || `https://api.atlassian.com/oauth/token/accessible-resources`;
export const audience = 'api.atlassian.com';
export const scope = [
    'offline_access', // needed to get a refresh token
    // 'read:me',
    'read:jira-user',
    'read:jira-work',
    'write:jira-work',
    // TODO: use granular scope?
    // Granular scopes: // FIXME: mix&match with classic and granular doesn't seem to work properly
    // 'read:user:jira', // needed for /myself
    // 'read:avatar:jira', // needed for /myself
    // 'read:application-role:jira', // needed for /myself
    // 'read:group:jira', // needed for /myself
    // 'read:issue-worklog:jira',
    // 'write:issue-worklog:jira',
    // 'delete:issue-worklog:jira',
    // 'read:issue-worklog.property:jira',
    // 'write:issue-worklog.property:jira',
    // 'delete:issue-worklog.property:jira',
    // write:issue-worklog:jira, write:issue-worklog.property:jira, read:avatar:jira, read:group:jira, read:issue-worklog:jira, read:project-role:jira, read:user:jira, read:issue-worklog.property:jira // FIXME: add as array elements
];

export class JiraClient {
    axios;

    #refreshPromise = null;
    #refreshTimer = null;

    #accessToken;
    #accessTokenExpiry;
    #refreshToken;

    constructor (options = {}) {
        const defaultOptions = {
            // Api
            jiraUrl,
            jiraApiUrl: window.localStorage.getItem('jiraApiUrl') || process.env.VUE_APP_JIRA_API_URL || null,
            // Auth
            clientId,
            clientSecret,
            redirectUri,
            oauthUri,
            oauthAuthorizeUri,
            oauthTokenUri,
            oauthAccessibleResourcesUri,
            audience,
            scope,

            accessToken: window.localStorage.getItem('jiraAccessToken') || null,
            accessTokenExpiry: (value => value ? new Date(value) : null)(window.localStorage.getItem('jiraAccessTokenExpiry') || null),
            refreshToken: window.localStorage.getItem('jiraRefreshToken') || null,

            maxRetryCount: 1,
        };

        Object.assign(this, defaultOptions, options, {
            axios: options.axios ?? axios,
        });

        this.attachInterceptor();
        this.scheduleTokenRefresh();
    }

    set accessToken (token) {
        this.#accessToken = token;
        if (token) {
            window.localStorage.setItem('jiraAccessToken', token);
        } else {
            window.localStorage.removeItem('jiraAccessToken');
        }
    }

    get accessToken () {
        return this.#accessToken;
    }

    set accessTokenExpiry (expiry) {
        this.#accessTokenExpiry = expiry;
        if (expiry instanceof Date) {
            window.localStorage.setItem('jiraAccessTokenExpiry', expiry.toJSON());
            this.scheduleTokenRefresh();
        } else {
            window.localStorage.removeItem('jiraAccessTokenExpiry');
        }
    }

    get accessTokenExpiry () {
        return this.#accessTokenExpiry;
    }

    set refreshToken (token) {
        this.#refreshToken = token;
        if (token) {
            window.localStorage.setItem('jiraRefreshToken', token);
        } else {
            window.localStorage.removeItem('jiraRefreshToken');
        }
    }

    get refreshToken () {
        return this.#refreshToken;
    }

    patchOptions (options) {
        Object.assign(this, options);
    }

    attachInterceptor () {
        this.axios.interceptors.request.use(async (config) => {
            // Set Authorization header
            if (this.requestNeedsAuthorization(config) && !config.headers?.has('Authorization')) {
                // TODO: check accessTokenExpiry
                if (this.accessToken) {
                    config.headers.set('Authorization', `Bearer ${this.accessToken}`);
                } else if (this.refreshToken) {
                    await this.refreshAccessToken();
                    // TODO: queue request if accessToken is not (yet) available???
                }
            }
            return config;
        });

        this.axios.interceptors.response.use(
            this.onAxiosResponse.bind(this),
            this.onAxiosResponseError.bind(this),
        );
    }

    scheduleTokenRefresh () {
        if (this.#refreshTimer) {
            clearTimeout(this.#refreshTimer);
        }
        if (!this.accessTokenExpiry) {
            return;
        }

        // refresh 30s minute before expiry
        const ttl = Math.max((this.accessTokenExpiry - new Date()) - 30_000, 0);

        console.debug('Scheduling token refresh in %ds', ttl / 1000); // intentionally leaving this log message
        this.#refreshTimer = setTimeout(() => {
            this.refreshAccessToken();
        }, ttl);
    }

    /**
     * @param resp AxiosResponse
     */
    async onAxiosResponse (resp){
        if (resp.config?.url === this.oauthTokenUri && resp.data) {
            this.processTokenResponse(resp.data);
        }

        return resp;
    }

    /**
     * @param error AxiosError
     */
    async onAxiosResponseError (error) {
        const originalRequest = error.config;

        if (
            error.response?.status === 401
            && this.requestNeedsAuthorization(error.config)
            && this.refreshToken
            && (originalRequest?.retryCount ?? 0) < this.maxRetryCount
        ) {
            const originalAccessToken = this.accessToken;

            await this.refreshAccessToken();

            // Retry config, now we have a new accessToken
            if (!originalAccessToken !== this.accessToken) {
                originalRequest.headers.delete('Authorization'); // Let interceptor set the new one
                originalRequest.retryCount = (originalRequest.retryCount ?? 0) + 1;
                return this.axios(originalRequest);
            }
        }

        if (
            error.response?.status === 403
            && error.config?.url === this.oauthTokenUri
        ) {
            console.error('403 during access token fetch/refresh', error.response?.data);
            const errorDescription = error.response?.data?.error_description ?? null;
            if (errorDescription === 'refresh_token is invalid') {
                this.refreshToken = null;
            }
        }

        return Promise.reject(error);
    }

    /**
     * @param config InternalAxiosRequestConfig
     */
    requestNeedsAuthorization(config) {
        return config?.url === this.oauthAccessibleResourcesUri
            || config?.url?.startsWith(this.jiraApiUrl);
    }

    processTokenResponse (data) {
        if (data.access_token) {
            this.accessToken = data.access_token;
        }
        if (data.expires_in) {
            this.accessTokenExpiry = new Date((new Date()).getTime() + (data.expires_in * 1000));
        }
        if (data.refresh_token) {
            this.refreshToken = data.refresh_token;
        }
    }

    async refreshAccessToken () {
        if (!this.refreshToken) {
            throw new Error('A refresh token is required');
        }

        if (this.#refreshPromise) {
            return this.#refreshPromise;
        }

        const data = {
            grant_type: 'refresh_token',
            client_id: this.clientId,
            client_secret: this.clientSecret,
            refresh_token: this.refreshToken,
            redirect_uri: redirectUri,
        };

        return this.#refreshPromise = this.axios.post(this.oauthTokenUri, data).finally(() => {
            this.#refreshPromise = null;
        });
    }

    async fetchAccessToken (code, redirectUri) {
        const data = {
            grant_type: 'authorization_code',
            client_id: this.clientId,
            client_secret: this.clientSecret,
            code,
            redirect_uri: redirectUri,
        };

        return this.axios.post(this.oauthTokenUri, data);
    }

    async fetchAccessibleResources() {
        return this.axios.get(this.oauthAccessibleResourcesUri);
    }

    async fetchUser (){
        if (!this.jiraApiUrl) {
            throw new Error('The jiraApiUrl must be set before fetching the user.');
        }
        return this.axios.get(this.jiraApiUrl + '/myself');
    }

    async fetchProjects (params) {
        if (!this.jiraApiUrl) {
            throw new Error('The jiraApiUrl must be set before fetching projects.');
        }
        return this.axios.get(this.jiraApiUrl + '/project?' + params);
    }

    async fetchIssues (params) {
        if (!this.jiraApiUrl) {
            throw new Error('The jiraApiUrl must be set before fetching issues.');
        }
        return this.axios.get(this.jiraApiUrl + '/search/jql?' + params);
    }

    async postWorkLog (issueKey, content){
        if (!this.jiraApiUrl) {
            throw new Error('The jiraApiUrl must be set before posting a work log.');
        }
        return this.axios.post(this.jiraApiUrl + `/issue/${issueKey}/worklog`, content);
    }
}
