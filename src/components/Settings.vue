<template>
    <form class="row g-3">
        <div class="col-12">
            <label for="theme" class="form-label">Color Theme</label>
            <select v-model="value.theme" id="theme" class="form-control">
                <option v-for="(details, option) in themeOptions" :key="option" :value="option">{{ details.label }}</option>
            </select>
        </div>
        <div class="col-12">
            <div class="form-check">
                <input type="checkbox" v-model="value.pickDate" id="pickDate" class="form-check-input">
                <label for="pickDate" class="form-check-label">
                    Allow to pick a date. (Otherwise 'today' is used).
                </label>
            </div>
        </div>
        <div class="col-12">
            <div class="form-check">
                <input type="checkbox" v-model="value.showDateNav" id="showDateNav" class="form-check-input" :disabled="!value.pickDate">
                <label for="showDateNav" class="form-check-label">
                    Show previous/next day buttons. <span class="form-text">(You can always use the date navigation keyboard shortcuts).</span>
                </label>
            </div>
            <div class="form-text" v-if="!value.pickDate">Only available when <a href="#pickDate" class="link-secondary">Allow to pick a date</a> is enabled. (See above)</div>
        </div>
        <div class="col-12">
            <div class="form-check">
                <input type="checkbox" v-model="value.jiraSetStarted" id="jiraSetStarted" class="form-check-input">
                <label for="jiraSetStarted" class="form-check-label">
                    Set <em>started</em> field of Jira <em>Worklog</em> as (beginning of) picked date.
                </label>
            </div>
        </div>
        <!--<div class="col-12">
            <label for="dateOffsetWarning" class="form-label">Warn if date offset is more that this many days from today</label>
            <input type="number" v-model.number="value.dateOffsetWarning" id="dateOffsetWarning" min="0" class="form-control">
            <div class="form-text">Leave empty to disable warning. Set to 0 to warn if committing timer for day other that today.</div>
        </div>-->
        <div class="col-12">
            <div class="form-check">
                <input type="checkbox" v-model="value.groupByProject" id="groupByProject" class="form-check-input">
                <label for="groupByProject" class="form-check-label">
                    Group/sort entries by project
                </label>
            </div>
        </div>
        <div class="col-12">
            <div class="form-check">
                <input type="checkbox" v-model="value.requireComment" id="requireComment" class="form-check-input">
                <label for="requireComment" class="form-check-label">
                    Require comment
                </label>
            </div>
        </div>
        <div class="col-12">
            <div class="form-check">
                <input type="checkbox" v-model="value.commentBeforeJira" id="commentBeforeJira" class="form-check-input">
                <label for="commentBeforeJira" class="form-check-label">
                    <em>Comment</em> before <em>Jira Issue</em>
                </label>
            </div>
        </div>
        <div class="col-12">
            <div class="form-check">
                <input type="checkbox" v-model="value.prefixCommentIssue" id="prefixCommentIssue" class="form-check-input">
                <label for="prefixCommentIssue" class="form-check-label">
                    Prefix comment with Jira issue
                </label>
            </div>
        </div>
        <div class="col-12">
            <div class="form-check">
                <input type="checkbox" v-model="value.warnAboutUnmappedProject" id="warnAboutUnmappedProject" class="form-check-input">
                <label for="warnAboutUnmappedProject" class="form-check-label">
                    Warn about selected 'unmapped' project.
                </label>
            </div>
        </div>
        <div class="col-12">
            <label for="hoursDisplayMode" class="form-label">Hours display mode</label>
            <select v-model="value.hoursDisplayMode" id="hoursDisplayMode" class="form-control">
                <option value="hm">2h 15m</option>
                <option value="clock">2:15</option>
                <option value="decimal">2.25</option>
            </select>
            <div class="form-text">Regardless of display mode, you can still input hours in either format.</div>
        </div>
        <div class="col-12">
            <label for="preferredServiceRegex" class="form-label">Preferred service types (Regex)</label>
            <textarea v-model="value.preferredServiceRegex" @change="value.preferredServiceRegex = value.preferredServiceRegex.trim()" :rows="preferredServiceRegexes.length || 1" :class="{'is-invalid': preferredServiceRegexInvalid.length }" id="preferredServiceRegex" class="form-control" />
            <div class="form-text">
                When a <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions">valid regular expression</a>
                is given the first service type (name) that matches wil be automatically selected when the project changes.
                You can enter multiple patterns, one on each line. Where the first line has the highest priority.
                <br>
                Note that the patterns are handled as <em>string</em> argument to <code>RegExp</code> constructor with the <code>i</code> flag.
                <br>
                The input <code>Development</code> will be used as <code>new RegExp('Development', 'i')</code> which means <code>/Development/i</code>
                <br>
                Leave empty to disable auto selecting a preferred service type.
            </div>
            <ul v-if="preferredServiceRegexInvalid" class="invalid-feedback">
                <li v-for="(regex, i) in preferredServiceRegexInvalid" :key="i">
                    Invalid regular expression; (<code>new RegExp('{{ regex }}', 'iu')</code> failed)
                </li>
            </ul>
        </div>
        <div class="col-12">
            <label for="preferredHoursTypeRegex" class="form-label">Preferred hours types (Regex)</label>
            <textarea v-model="value.preferredHoursTypeRegex" @change="value.preferredHoursTypeRegex = value.preferredHoursTypeRegex.trim()" :rows="preferredHoursTypeRegexes.length || 1" :class="{'is-invalid': preferredHoursTypeRegexInvalid.length }" id="preferredHoursTypeRegex" class="form-control" />
            <div class="form-text">
                Same as above, but for the 'hours type' field.
            </div>
            <ul v-if="preferredHoursTypeRegexInvalid" class="invalid-feedback">
                <li v-for="(regex, i) in preferredHoursTypeRegexInvalid" :key="i">
                    Invalid regular expression; (<code>new RegExp('{{ regex }}', 'iu')</code> failed)
                </li>
            </ul>
        </div>
        <div class="col-12">
            <div class="form-check">
                <input type="checkbox" v-model="value.focusPostSubmit" id="focusPostSubmit" class="form-check-input">
                <label for="focusPostSubmit" class="form-check-label">
                    Focus project selector after <em>Submit & clear</em>.
                </label>
            </div>
        </div>
        <div class="col-12">
            <div class="form-check">
                <input type="checkbox" v-model="value.showWeekSums" id="showWeekSums" class="form-check-input">
                <label for="showWeekSums" class="form-check-label">
                    Show project <em>week totals</em>.
                </label>
            </div>
        </div>
        <div class="col-12">
            <div class="form-check">
                <input type="checkbox" v-model="value.showSubmissions" id="showSubmissions" class="form-check-input" :disabled="!value.showWeekSums">
                <label for="showSubmissions" class="form-check-label">
                    Show week <em>submission</em> status/button.
                </label>
            </div>
            <div class="form-text" v-if="!value.showWeekSums">Only available when <a href="#showWeekSums" class="link-secondary">Show project week totals</a> is enabled. (See above)</div>
        </div>
        <div class="col-12">
            <div class="form-check">
                <input type="checkbox" v-model="value.hideLoggedService" id="hideLoggedService" class="form-check-input">
                <label for="hideLoggedService" class="form-check-label">
                    Hide <em>Service</em> column in logged hours table
                </label>
            </div>
        </div>
        <div class="col-12">
            <div class="form-check">
                <input type="checkbox" v-model="value.hideLoggedType" id="hideLoggedType" class="form-check-input">
                <label for="hideLoggedType" class="form-check-label">
                    Hide <em>Type</em> column in logged hours table
                </label>
            </div>
        </div>
        <div class="col-12">
            <label for="apiUrl" class="form-label">Simplicate API URL</label>
            <input type="url" v-model.lazy="value.apiUrl" id="apiUrl" required class="form-control">
        </div>
        <div class="col-12">
            <label for="jiraApiUrl" class="form-label">Jira API URL</label>
            <input type="url" v-model.lazy="value.jiraApiUrl" id="jiraApiUrl" required class="form-control">
        </div>
        <div class="col-12">
            <label for="jiraProjectKeyPattern" class="form-label">Jira Project Key Pattern</label>
            <input type="text" v-model.lazy="value.jiraProjectKeyPattern" id="jiraProjectKeyPattern" required class="form-control" :class="{'is-invalid': jiraProjectKeyPatternInvalid}">
            <div class="form-text">
                Should match your Jira configuration. Must be a valid regex (without beginning/end of input matching, i.e. <code>^</code>, <code>$</code>).<br>
                Usually one of these, or something similar:
                <ul class="list-inline d-inline">
                    <li v-for="pattern in jiraProjectKeyPatternExamples" :key="pattern" class="list-inline-item">
                        <code title="Click to use this setting" @click="value.jiraProjectKeyPattern = pattern">{{ pattern }}</code>
                    </li>
                </ul>
            </div>
            <div v-if="jiraProjectKeyPatternInvalid" class="invalid-feedback">Invalid regular expression; (<code>new RegExp('{{ value.jiraProjectKeyPattern }}')</code> failed)</div>
        </div>

        <div class="col-12">
            <hr>
        </div>

        <div class="col-12">
            <div class="form-check">
                <input type="checkbox" v-model="value.confirmPosts" id="confirmPosts" class="form-check-input">
                <label for="confirmPosts" class="form-check-label">
                    Ask confirmation before sending data to Simplicate/Jira
                    <span class="badge bg-secondary">dev</span>
                </label>
            </div>
        </div>

        <div class="col-12 text-center text-muted" v-if="version">
            <hr>
            <code><span class="text-muted">version/build:</span> {{ version }}</code>
        </div>
    </form>
</template>

<script>
import themeSelector from '@/lib/themeSelector';

export default {
    name: 'Settings',
    data: () => {
        return {
            themeOptions: themeSelector.themes,
        };
    },
    props: {
        value: {
            type: Object,
            required: true
        },
        version: {
            type: String,
            required: false,
        },
        jiraProjectKeyPatternExamples: {
            type: Array,
            required: false,
            default: () => ['[A-Z][A-Z_0-9]+', '[A-Z][A-Z]+', '[A-Z]{2}[0-9]{2}'],
        },
    },
    computed: {
        preferredServiceRegexes () {
            return (this.value.preferredServiceRegex || '').split('\n');
        },
        preferredServiceRegexInvalid () {
            return this.preferredServiceRegexes
                .filter(val => val && !this.isValidRegex(val, 'iu'));
        },
        preferredHoursTypeRegexes () {
            return (this.value.preferredHoursTypeRegex || '').split('\n');
        },
        preferredHoursTypeRegexInvalid () {
            return this.preferredHoursTypeRegexes
                .filter(val => val && !this.isValidRegex(val, 'iu'));
        },
        jiraProjectKeyPatternInvalid () {
            return !this.isValidRegex(this.value.jiraProjectKeyPattern);
        }
    },
    methods: {
        isValidRegex (pattern, flags) {
            if (!pattern) {
                return false;
            }
            try {
                new RegExp(pattern, flags);
            } catch {
                return false;
            }
            return true;
        },
    },
}
</script>
