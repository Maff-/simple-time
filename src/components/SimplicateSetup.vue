<template>
    <div>

        <p class="lead">
            We need to get access to your Simplicate account. This will be done via the simple OAuth2 'code flow'.
            Because we don't have this app registered with Simplicate and therefore no 'own' client id/secret we're
            'borrowing' those credentials from the official <a href="https://chrome.google.com/webstore/detail/simplicate/lnmfbaobeliahpkiakfgfephfechelhn?hl=nl" class="link-secondary" target="_blank">Simplicate Chrome extension</a>.
            <br>
            This will mean the setup is a little different that you might be used to 😉. Still, it's only 3 simple steps:
        </p>

        <p>
            <strong>You don't have to install Chrome and/or the Simplicate Extension!</strong>
        </p>

        <ol>
            <li :class="{'text-decoration-line-through': authStarted, 'disabled': !simplicateAuthUrl}">Click <a :href="simplicateAuthUrl" @click="authStarted = true" :disabled="!simplicateAuthUrl" target="_blank" rel="noreferrer">here</a> to start the auth flow in a new tab.</li>
            <li>
                Login and grant the Chrome extension Simplicate access.
                <br>
                <em>The browser should now redirect to <span>{{ redirectUri }}?state=nope&code=...</span>, which won't be able to load.</em>
            </li>
            <li>Extract the <code>code</code> value from query string of the redirect url and enter it below.</li>
        </ol>

        <div class="row">
            <div class="col">
                <input type="text" v-model="simplicateAuthCode" :class="{'is-valid': validCode, 'is-invalid': simplicateAuthCode && !validCode}" class="form-control" placeholder="Code from redirect url..." pattern="[A-Za-z0-9]{32}">
            </div>
            <div class="col-auto">
                <button type="button" @click="submitSimplicateAuthCode" :disabled="!simplicateAuthCode" class="btn" :class="simplicateAuthCode ? 'btn-primary' : 'btn-secondary'">Check Code</button>
            </div>
        </div>

        <hr class="my-4">

        <p v-if="!showAdvanced" class="text-muted">Having trouble connecting your account? There might be another way... click <a href="#" @click.prevent="enabledShowAdvanced" class="text-body">here</a> to open the advanced options.</p>

        <section v-else>

            <h3 class="h5" :ref="'advancedHeader'">Alternative/advanced authentication options</h3>

            <p>
                <strong>Option 1:</strong><br>
                Simply try again with a newly generated <em>code challenge</em>.
            </p>

            <p>Click the button below and try above three steps again.</p>

            <button type="button" class="btn btn-danger" :disabled="!(codeChallenge || codeVerifier)" @click="resetCodeVerifier">Reset code challenge</button>

            <p class="mt-5">
                <strong>Option 2:</strong><br>
                Manually provide your <em>authentication key and secret</em>.
            </p>

            <p>
                This key and secret can be obtained by creating/requesting an API key. Creating the key can be done in the Simplicate settings<span class="text-muted" title="Available to the account administrator">*</span>.

                Check <a href="https://support.simplicate.nl/nl/articles/6693108-api-key-aanmaken-en-verwijderen" class="link-secondary" target="_blank">this support article</a> for more info.
            </p>

            <p>
                <span class="badge bg-danger">Nerd Alert</span>
                Alternatively you can inspect your network traffic with Simplicate when interacting with the browser extension. Extract the key and secret from the authorization request header and provide them in the form below.<br>
                This should be something line <code>Authorization: Bearer &lt;key&gt;:&lt;secret&gt;</code>.
            </p>

            <div class="row g-3">
                <div class="col-md">
                    <input type="text" v-model.lazy="authKey" @change="handleAuthChange" class="form-control" placeholder="Authentication key">
                </div>
                <div class="col-md">
                    <input type="text" v-model.lazy="authSecret" @change="handleAuthChange" class="form-control" placeholder="Authentication secret">
                </div>
                <div class="col-md-auto">
                    <button type="button" @click="handleAuthChange" class="btn btn-primary" :disabled="!authKey || !authSecret">Submit</button>
                </div>
            </div>

            <hr class="my-4">

            <p class="text-center">
                <a href="#" @click.prevent="showAdvanced = false" class="text-body">Close advanced options</a>
            </p>
        </section>

    </div>
</template>

<script>

import axios from 'axios';

// Stolen from Simplicate Chrome extension (lnmfbaobeliahpkiakfgfephfechelhn)...
const clientId = process.env.VUE_APP_SIMPLICATE_CLIENT_ID;
const clientSecret = process.env.VUE_APP_SIMPLICATE_CLIENT_SECRET;
const redirectUri = process.env.VUE_APP_SIMPLICATE_REDIRECT_URL;
const oauthUri = 'https://auth.simplicateapp.com/oauth';
const oauthAuthorizeUri = process.env.VUE_APP_SIMPLICATE_OAUTH_AUTHORIZE_URL || `${oauthUri}/authorize`;
const oauthTokenUri = process.env.VUE_APP_SIMPLICATE_OAUTH_TOKEN_URL || `${oauthUri}/token`;
const codeRegex = /^[A-Za-z0-9]{32}$/;

export default {
    name: 'SimplicateSetup',
    props: {
        settings: {
            type: Object,
            required: true,
        },
        redirectUri: {
            type: String,
            default: redirectUri,
        },
    },
    data () {
        return {
            codeVerifier: window.localStorage.getItem('codeVerifier') || null,
            codeChallenge: window.localStorage.getItem('codeChallenge') || null,
            showAdvanced: false,
            simplicateAuthCode: null,
            authStarted: false,
            authKey: null,
            authSecret: null,
        };
    },
    async mounted () {
        if (!this.codeVerifier || !this.codeChallenge) {
            await this.initCodeVerifierAndChallenge();
        }
    },
    computed: {
        simplicateAuthUrl () {
            if (!this.codeChallenge) return;
            const params = new URLSearchParams({
                client_id: clientId,
                code_challenge: this.codeChallenge,
                response_type: 'code',
                code_challenge_method: 'S256',
                state: 'nope',
                redirect_uri: this.redirectUri,
                scope: 'all'
            });
            return `${oauthAuthorizeUri}?${params.toString()}`;
        },
        validCode () {
            return this.simplicateAuthCode && codeRegex.test(this.simplicateAuthCode);
        },
    },
    watch: {
        simplicateAuthCode (value) {
            // check if the whole redirect url was pasted, if so extract the code
            if (value && !this.validCode) {
                try {
                    const url = new URL(value, 'http://localhost'); // Make it work even if only the path+query is given.
                    const code = url.searchParams.has('code') ? url.searchParams.get('code') : null;
                    if (code && codeRegex.test(code)) {
                        this.simplicateAuthCode = code;
                    }
                } catch {
                    // no-op
                }
            }
        },
        validCode (valid) {
            if (valid) {
                this.submitSimplicateAuthCode();
            }
        },
    },
    methods: {
        async initCodeVerifierAndChallenge () {
            const verifierData = new Uint8Array(64);
            crypto.getRandomValues(verifierData);
            this.codeVerifier = this.base64urlEncode(String.fromCharCode.apply(null, verifierData));
            window.localStorage.setItem('codeVerifier', this.codeVerifier);

            this.codeChallenge = await this.generateCodeChallenge(this.codeVerifier)
            window.localStorage.setItem('codeChallenge', this.codeChallenge);
        },
        async generateCodeChallenge (code_verifier) {
            // convoluted native browser implementation; https://stackoverflow.com/a/48161723
            const data = (new TextEncoder()).encode(code_verifier);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashHexStr = this.hexString(new Uint8Array(hashBuffer));
            // return this.base64urlEncode(hashHexStr);
            // OAuth spec indicates the code_verifier hash should be 'base64url-encoded',
            // but Simplicate seems to do a 'regular' base64 encode via btoa.
            return btoa(hashHexStr);
        },
        hexString (arr) {
            return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
        },
        base64urlEncode (str) {
            return btoa(str)
                .replace(/\+/g, "-")
                .replace(/\//g, "_")
                .replace(/=/g, "");
        },
        async submitSimplicateAuthCode () {
            const data = {
                grant_type: 'authorization_code',
                redirect_uri: redirectUri,
                client_id: clientId,
                code: this.simplicateAuthCode,
                code_verifier: this.codeVerifier,
                client_secret: clientSecret,
            };
            axios.post(oauthTokenUri, data)
                .then(resp => {
                    if (!resp.data || resp.data.error || !resp.data.authentication_key || !resp.data.authentication_secret) {
                        console.error(resp.data);
                        alert('Authentication failed, please try again and/or see the advanced options.\n\n(The console log may contain additional information about the failure).');
                        throw new Error('Failed to get authentication_key/authentication_secret');
                    }
                    this.$emit('change', resp.data.authentication_key, resp.data.authentication_secret, resp.data.expires_in || null, resp.data);
                });
        },
        handleAuthChange () {
            if (this.authKey && this.authSecret) {
                this.$emit('change', this.authKey, this.authSecret, null);
            }
        },
        resetCodeVerifier () {
            this.showAdvanced = false;
            this.authStarted = false;
            this.simplicateAuthCode = null;
            this.initCodeVerifierAndChallenge();
        },
        enabledShowAdvanced () {
            this.showAdvanced = true;
            this.$nextTick(() => {
                this.$refs.advancedHeader.scrollIntoView();
            });
        },
    },
}
</script>
