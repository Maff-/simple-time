<template>
    <div>
        <template v-if="!accessToken && !cloudId && !error && !failed">
            <h2 class="text-center">Now let's connect to your Jira account.</h2>
            <p class="lead">
                Connecting with Jira allows you to select an issue for which you want to log your spent time.
                This will then automatically create a <em>worklog</em> entry as well.
            </p>
        </template>

        <div class="d-flex" v-if="!accessToken && !authCode && !error && !failed">
            <button type="button" class="btn btn-primary mx-auto" @click="startAuth">Connect with Jira</button>
        </div>

        <div v-if="accessibleResources.length >= 1">
            <h4>Your account is connected to multiple Jira instances, please select the one to use</h4>
            <div class="list-group mt-3">
                <a
                    v-for="resource in accessibleResources"
                    :key="resource.id"
                    class="list-group-item list-group-item-action d-flex"
                    href="#"
                    @click.prevent="selectResource(resource)"
                >
                    <img :src="resource.avatarUrl" class="rounded me-3" :alt="`${resource.name} avatar`" style="height: 3.5em">
                    <div>
                        <h5 class="mb-1">{{ resource.name }}</h5>
                        <span>{{ resource.url }}</span>
                    </div>
                </a>
            </div>
        </div>

        <div class="alert alert-danger" v-if="error">
            Whoops! Failed to authenticate with Jira; <code class="fw-bold">{{ error }}</code> {{ errorDescription ? `"${errorDescription}"` : '' }}.
            <a href="#" @click.prevent="startAuth" class="alert-link">Retry?</a>
        </div>

        <div class="alert alert-warning" v-if="failed">
            Whoops! The connection to Jira API was lost or an authentication problem occurred.
            Try to refresh the page, or <a href="#" @click.prevent="startAuth" class="alert-link">reconnect</a>.
        </div>

        <hr>

        <p class="text-muted">
            If you're not planning on using the the Jira integration, you also disable it altogether by clicking <a href="#" @click.prevent="disableIntegration" class="text-body">here</a>.
            <em>You can always re-enable it in the settings later.</em>
        </p>
    </div>
</template>

<script>
import {
    clientId,
    redirectUri,
    oauthAuthorizeUri,
    audience,
    scope,
} from '@/lib/jiraClient';

export default {
    name: 'JiraSetup',
    props: {
        accessToken: {
            type: String,
            default: null,
        },
        cloudId: {
            type: String,
            default: null,
        },
        failed: {
            type: Boolean,
            default: null,
        },
        settings: {
            type: Object,
            required: true,
        },
        redirectUri: {
            type: String,
            default: redirectUri || `${window.location.origin}${window.location.pathname}#/jira-auth/`,
        },
    },
    data () {
        return {
            showAdvanced: false,
            authCode: null,
            authStarted: false,
            accessibleResources: [],
            error: null,
            errorDescription: null,
        };
    },
    mounted () {
        if (window.location.hash.match(/\/jira-auth\//)) {
            const params = new URLSearchParams(window.location.search);
            const code = params.get('code');
            if (code) {
                this.authCode = code;
            } else if (params.has('error')) {
                this.error = params.get('error');
                this.errorDescription = params.get('error_description');
            }
        }
        if (!this.cloudId && this.accessToken) {
            this.fetchAccessibleResources();
        }
    },
    computed: {
        authUrl () {
            const params = new URLSearchParams({
                audience,
                client_id: clientId,
                scope: scope.join(' '),
                redirect_uri: this.redirectUri,
                state: 'jira-auth', // TODO: secure?
                response_type: 'code',
                prompt: 'consent',
            });
            return `${oauthAuthorizeUri}?${params.toString()}`;
        },
    },
    watch: {
        authCode (code) {
            if (this.accessToken == null && code) {
                this.fetchAccessToken();
            }
        },
        accessToken () {
            if (!this.cloudId && this.accessToken) {
                this.fetchAccessibleResources();
            }
        }
    },
    methods: {
        startAuth () {
            // Clear previous stored data
            this.authCode = null;
            this.$emit('auth', null, null);
            this.$emit('refresh', null);
            this.$emit('resource-change', null, null);
            // Redirect user to consent prompt
            window.location = this.authUrl;
        },
        fetchAccessToken () {
            this.$jiraClient.fetchAccessToken(this.authCode, this.redirectUri)
                .then(resp => {
                    if (!resp.data || resp.data.error || !resp.data.access_token) {
                        console.error(resp.data);
                        alert('Authorization failed, please try again.\n\n(The console log may contain additional information about the failure).');
                        throw new Error('Failed to get access_token');
                    }
                    this.$emit('auth', resp.data.access_token, resp.data.expires_in ?? null, resp.data.refresh_token ?? null, resp.data);
                })
                .catch(reason => {
                    console.error(reason);
                    alert('Authorization failed, please try again.\n\n(The console log may contain additional information about the failure).');
                    this.authCode = null;
                })
            ;
        },
        fetchAccessibleResources () {
            this.$jiraClient.fetchAccessibleResources()
                .then(resp => {
                    if (!resp.data || !Array.isArray(resp.data)) {
                        console.error(resp.data);
                        throw new Error('Failed to get accessible resources');
                    }
                    if (resp.data.length === 1) {
                        this.selectResource(resp.data[0]);
                    } else {
                        this.accessibleResources = resp.data;
                    }
                })
                .catch(reason => {
                    console.error(reason);
                    this.accessibleResources = [];
                })
            ;
        },
        selectResource (resource) {
            this.$emit('resource-change', resource.id, resource.url, resource);
            this.accessibleResources = [];
        },
        clearError () {
            this.error = null;
            this.errorDescription = null;
        },
        disableIntegration () {
            this.clearError();
            this.$emit('disable');
        },
    },
};
</script>
