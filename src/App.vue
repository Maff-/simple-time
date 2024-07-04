<template>
    <div id="app" class="container-lg mb-3">

        <h1 class="my-3 text-center text-muted">
            <img class="d-inline-block d-md-none" src="./assets/logo.svg" style="height: 1.5em" alt="Simple Simplicate Time-logging tool (SSTt)">
            <span class="d-none d-md-inline">Simple Simplicate Time-logging tool (SSTt)</span>
        </h1>

        <div v-if="!authSecret || !authKey || (!user && !userLoading)">
            <h2 class="text-center mb-3">Hi there! This app needs to connect to your Simplicate account.</h2>
            <simplicate-setup :settings="settings" @change="onAuthChange" />
        </div>

        <div v-if="user">

        <section class="row g-3 mb-3">
            <div class="col-auto" v-if="settings.pickDate && settings.showDateNav">
                <button type="button" id="prev-day" @click="prevDay" class="btn btn-gray" tabindex="1-"><i class="bi-arrow-left"></i></button>
            </div>
            <div class="col" v-if="settings.pickDate">
              <div class="input-group">
                <span class="input-group-text font-monospace">{{ day }}</span>
                <input type="date" id="date-input" ref="dateInput" :value="dateValue" @input="onDateInput" :class="{'is-warning': !isToday}" class="form-control" tabindex="-1" :title="!isToday ? 'Look out! You\'re working on another day.' : null">
              </div>
            </div>
            <div class="col-auto" v-if="settings.pickDate">
                <button type="button" id="today" @click="setToday" :disabled="isToday" class="btn btn-secondary">Today</button>
            </div>
            <div class="col-auto" v-if="settings.pickDate && settings.showDateNav">
                <button type="button" id="next-day" @click="nextDay" class="btn btn-gray" tabindex="1-"><i class="bi-arrow-right"></i></button>
            </div>
            <div class="col-12" v-if="!settings.pickDate && !isToday">
                <div class="alert alert-sm alert-warning mb-0 py-2" role="alert">
                    <strong>Look out!</strong> You're working on another day; {{ date.toDateString() }}.
                </div>
            </div>

            <div class="col-12">
                <v-select
                    uid="project-selector"
                    input-id="project-search"
                    ref="projectSelector"
                    class="vs--single-line"
                    :class="{'is-warning': settings.warnAboutUnmappedProject && projectIsUnmapped}"
                    :title="settings.warnAboutUnmappedProject && projectIsUnmapped ? 'Project has no mapping, this might result in reduced Jira issue search.' : null"
                    @hook:mounted="onSelectMounted('projectSelector')"
                    placeholder="Project"
                    required
                    v-model="project"
                    :options="projectOptions"
                    label="name"
                    :reduce="p => p.id"
                    :filter="filterProjects"
                    :selectable="p => !p.disabled"
                    :threshold="0.1"
                    :select-on-tab="true"
                    autofocus
                >
                    <template #option="option">
                        <code class="me-2">{{ option.project_number }}</code>
                        <span class="me-2">{{ option.project_name.replace(/\s*\(\d+\)$/, '') }}</span>
                        <span class="text-muted">{{ option.organization ? option.organization.name : '' }}</span>
                        <i v-if="settings.warnAboutUnmappedProject && option.mapped" class="bi-arrows text-body-tertiary ms-1" title="Mapped project"></i>
                    </template>
                    <template #selected-option="option">
                        <code class="me-2">{{ option.project_number }}</code>
                        <span class="me-2">{{ option.project_name.replace(/\s*\(\d+\)$/, '') }}</span>
                        <span class="text-muted">{{ option.organization ? option.organization.name : '' }}</span>
                        <i v-if="settings.warnAboutUnmappedProject && option.mapped" class="bi-arrows text-body-tertiary ms-1" title="Mapped project"></i>
                    </template>
                </v-select>
            </div>
            <div class="col-sm-4 col-md-5">
                <v-select
                    uid="service-selector"
                    input-id="service-search"
                    ref="serviceSelector"
                    class="vs--single-line"
                    :class="{'is-warning': higherPriorityServiceAvailable}"
                    :title="higherPriorityServiceAvailable ? 'A more preferred option is available but not selected!' : null"
                    @hook:mounted="onSelectMounted('serviceSelector')"
                    placeholder="Service"
                    required
                    v-model="service"
                    :options="prioritizedServices"
                    label="name"
                    :reduce="s => s.id"
                    :select-on-tab="true"
                >
                    <template #option="option">
                        {{ option.name }}
                        <i v-if="option.priority === 1" class="bi-filter-left text-muted" title="Preferred option (based on regex defined in settings)"></i>
                    </template>
                    <template #selected-option="option">
                        {{ option.name }}
                        <i v-if="option.priority === 1" class="bi-filter-left text-muted" title="Preferred option (based on regex defined in settings)"></i>
                    </template>
                    <template #no-options>
                        {{ project ? 'No options found' : 'Select a project first' }}
                    </template>
                </v-select>
            </div>
            <div class="col-sm-4 col-md-5">
                <v-select
                    uid="hours-type-selector"
                    input-id="hours-type-search"
                    ref="hoursTypeSelector"
                    class="vs--single-line"
                    :class="{'is-warning': higherPriorityHoursTypeAvailable}"
                    :title="higherPriorityHoursTypeAvailable ? 'A more preferred option is available but not selected!' : null"
                    @hook:mounted="onSelectMounted('hoursTypeSelector')"
                    placeholder="Type"
                    required
                    v-model="hoursType"
                    :options="prioritizedHoursTypes"
                    :reduce="h => h.id"
                    :select-on-tab="true"
                >
                    <template #option="option">
                        <span class="color-label" :style="{ backgroundColor: option.color }"></span>
                        {{ option.label }}
                        <i v-if="option.priority === 1" class="bi-filter-left text-muted" title="Preferred option (based on regex defined in settings)"></i>
                    </template>
                    <template #selected-option="option">
                        <span class="color-label" :style="{ backgroundColor: option.color }"></span>
                        {{ option.label }}
                        <i v-if="option.priority === 1" class="bi-filter-left text-muted" title="Preferred option (based on regex defined in settings)"></i>
                    </template>
                    <template #no-options>
                        {{ service ? 'No options found' : 'Select a service first' }}
                    </template>
                </v-select>
            </div>
            <div class="col-sm-4 col-md-2">
                <hours-input
                    id="hours-input"
                    ref="hoursInput"
                    v-model="hours"
                    :display-mode="settings.hoursDisplayMode"
                    placeholder="Hours"
                />
            </div>
            <div :class="inputOrder.length > 1 ? 'col-sm-6' : 'col-sm-12'" v-for="inputName in inputOrder" :key="inputName">
                <v-select
                    v-if="inputName === 'jiraIssue'"
                    uid="jira-issue-selector"
                    input-id="jira-issue-search"
                    ref="jiraIssueSelector"
                    class="vs--single-line"
                    @hook:mounted="onSelectMounted('jiraIssueSelector')"
                    :placeholder="'Jira issue' + (!jiraUser ? ' - Not logged in' : '')"
                    v-model="jiraIssue"
                    :options="jiraIssues"
                    :reduce="i => i.key"
                    :filter="filterJiraSearch"
                    @search="onJiraSearch"
                    :select-on-tab="true"
                    :disabled="!jiraUser"
                >
                    <template #option="option">
                        <template v-if="option.key !== undefined">
                            <code class="me-2">{{ option.key }}</code>
                            <span class="me-2">{{ option.fields.summary.replace(`${option.key}: `, '') }}</span>
                        </template>
                        <template v-else-if="option.label !== undefined">{{ option.label }}</template>
                        <template v-else>{{ option }}</template>
                    </template>
                    <template #selected-option="option">
                        <template v-if="option.key !== undefined">
                            <code class="me-2">{{ option.key }}</code>
                            <span class="me-2">{{ option.fields.summary.replace(`${option.key}: `, '') }}</span>
                        </template>
                        <template v-else-if="option.label !== undefined">{{ option.label }}</template>
                        <template v-else>{{ option }}</template>
                    </template>
                    <template #no-options>
                        {{ project ? 'Start typing to search for a Jira issue' : 'Select a project first, or start typing to search' }}
                    </template>
                </v-select>
                <input type="text"
                       v-if="inputName === 'comment'"
                       id="comment-input"
                       ref="commentInput"
                       placeholder="Description"
                       v-model.trim="comment"
                       :required="settings.commentRequired"
                       class="form-control">
            </div>
            <div class="col-6 col-sm-4 col-md-6 order-4">
                <button type="submit" id="submit" @click="submit()" :disabled="!isValid || submitting" :class="id ? 'btn-warning' : 'btn-primary'" class="btn d-block w-100">
                    {{ id ? 'Submit changes' : 'Submit' }}
                </button>
            </div>
            <div class="col-6 col-sm-4 col-md-3 order-4">
                <button type="submit" id="submit-clear" @click="submitAndClear" :disabled="!isValid || submitting" :class="id ? 'btn-warning' : 'btn-primary'" class="btn btn-primary d-block w-100">
                    {{ id ? 'Submit changes & clear' : 'Submit & clear' }}
                </button>
            </div>
            <div class="col-sm-4 col-md-3 order-4">
                <button type="reset" id="clear" @click="clear" :disabled="submitting" class="btn btn-secondary d-block w-100">
                    {{ id ? 'Cancel' : 'Clear' }}
                </button>
            </div>
        </section>

        <hr>

        <div class="position-relative">
            <div id="logged-hours" class="table-responsive" v-if="loggedHours.length">
            <table class="table mb-0">
                <!-- TODO: use 'fixed' column widths to prevent annoying jumps when switching between days -->
                <thead>
                <tr>
                    <th>
                        Project
                        <button type="button" @click="settings.groupByProject = !settings.groupByProject" class="button-clear" title="Toggle grouping">
                            <i class="bi" :class="settings.groupByProject ? 'bi-collection-fill' : 'bi-collection'"></i>
                        </button>
                    </th>
                    <th v-if="!settings.hideLoggedService">Service</th>
                    <th v-if="!settings.hideLoggedType">
                        <abbr class="d-lg-none" title="Type">T</abbr>
                        <span class="d-none d-lg-inline">Type</span>
                    </th>
                    <th style="width:0.1%">Hours</th>
                    <th>Description</th>
                    <th v-if="!settings.jiraDisabled" style="width:0.1%">Jira issue</th>
                    <th style="width:0.1%">
                        <abbr class="d-xl-none" title="Actions">Act.</abbr>
                        <span class="d-none d-xl-inline">Actions</span>
                    </th>
                </tr>
                </thead>
                <tbody>
                <tr v-for="hours in loggedHoursSorted" :key="hours.id" :class="{'table-light': !id && hours.project.id === project, 'table-warning': id === hours.id}">
                    <td>
                        <span
                            :title="`${hours.project.project_number} - ${hours.project.organization.name} / ${hours.type.label} / ${hours.projectservice.name}`"
                        >{{ hours.project.name }}</span>
                    </td>
                    <td v-if="!settings.hideLoggedService" class="text-truncate" style="max-width: 20vw">{{ hours.projectservice.name }}</td>
                    <td v-if="!settings.hideLoggedType" class="text-nowrap">
                        <span v-if="hours.type.color" :title="hours.type.label" class="color-label me-0" :style="{ backgroundColor: hours.type.color }"></span>
                        <span class="ms-2" :class="{'d-none d-lg-inline': hours.type.color}">{{ hours.type.label }}</span>
                    </td>
                    <td class="text-nowrap" :title="hours.status">
                        <span>{{ hours.hours.toFixed(2) }}</span><!-- TODO: use same formatting as in HoursInput -->
                        <small v-if="hours.status === 'forwarded'"><i class="bi bi-arrow-right-short text-muted"></i></small>
                        <small v-else-if="hours.status === 'projectmanager_approved'"><i class="bi bi-check"></i></small>
                        <div class="progress" style="height: 1px">
                            <div class="progress-bar" role="progressbar" :style="{width: `${ Math.round(100 * hours.hours / hoursTarget ) }%`}"></div> <!-- What to use? loggedHoursSum/loggedHoursMax/hoursTarget/...?-->
                        </div>
                    </td>
                    <td>{{ hours.note }}</td>
                    <td v-if="!settings.jiraDisabled" :class="{'table-warning': hours.jiraKey && jiraIssue && hours.jiraKey === jiraIssue}" class="text-nowrap">
                        <a v-if="hours.jiraKey" :href="hours.externalUrl || `${jiraUrl}/browse/${hours.jiraKey}`" class="text-nowrap" target="_blank" rel="nofollow noopener">{{ hours.jiraKey }}</a>
                        <a v-else-if="hours.externalUrl" :href="hours.externalUrl" target="_blank" rel="nofollow noopener">link</a> <!-- TODO: some last part of url? -->
                    </td>
                    <td class="text-nowrap">
                        <div class="dropstart dropdown-expand-xl">
                            <button type="button" class="btn btn-sm btn-tertiary text-muted" title="Toggle actions" data-bs-toggle="dropdown" data-bs-offset="0,10"><i class="bi bi-three-dots"></i></button>
                            <div class="dropdown-menu p-0 border-0 text-nowrap" style="min-width: unset">
                                <button type="button" @click="confirmDeleteHours(hours.id, hours)" :disabled="hours.locked" class="btn btn-sm btn-outline-danger" title="Remove entry"><i class="bi-trash"></i></button>
                                <button type="button" @click="editHours(hours)" :disabled="hours.locked" class="ms-1 btn btn-sm btn-outline-warning" title="Edit entry"><i class="bi-pencil"></i></button>
                                <button type="button" @click="importHours(hours)" class="ms-1 btn btn-sm btn-outline-secondary" title="Import entry"><i class="bi bi-box-arrow-in-up"></i></button>
                            </div>
                        </div>
                    </td>
                </tr>
                </tbody>
                <tfoot>
                    <tr>
                        <td :colspan="1 + !settings.hideLoggedService + !settings.hideLoggedType"></td>
                        <td><strong>{{ loggedHoursSum.toFixed(2) }}</strong></td><!-- TODO: use same formatting as in HoursInput -->
                        <td colspan="3"></td>
                    </tr>
                </tfoot>
            </table>
            </div>
            <div v-else-if="date" class="alert alert-info">
                No logged hours yet for {{ date.toDateString() }}.
            </div>
            <div v-else class="alert alert-warning">
                Select a valid date to see the logged hours.
            </div>

            <!-- TODO: Show hour values as well -->
            <div class="progress mt-3" :title="`${loggedHoursSum.toFixed(2)} of ${hoursTarget.toFixed(2)} hours logged` + (hours ? ` + ${hours.toFixed(2)} pending = ${(loggedHoursSum + hours).toFixed(2)}` : '')">
                <div class="progress-bar" role="progressbar" :style="{width: `${loggedHoursPercentage}%`}"></div>
                <div v-if="loggedOvertimePercentage" class="progress-bar bg-dark" role="progressbar" :style="{width: `${loggedOvertimePercentage}%`}"></div>
                <div v-if="hoursPercentage" class="progress-bar progress-bar-striped bg-warning" role="progressbar" :style="{width: `${hoursPercentage}%`}"></div>
            </div>

            <div v-if="hoursLoading" class="loading-overlay">
                <div class="spinner-container">
                    <div class="spinner-border" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
        </div>

        <hr>

        <week-totals v-if="settings.showWeekSums" :hours="weekHours" :time-table="timeTable" :submissions="submissions" :disable-submissions="!settings.showSubmissions" :disable-navigation="!settings.pickDate" :loading="weekHoursLoading || submissionsLoading" @submit="submitLoggedWeekHours" @navigate="date = $event"/>

        <hr v-if="settings.showWeekSums">

        <footer class="d-flex justify-content-between text-muted">
            <nav class="d-flex flex-wrap gap-2">
                <a href="https://github.com/Maff-/simple-time" class="text-muted me-3" title="simple-time @ Github"><i class="bi-github"></i></a>
                <div class="dropup">
                    <a data-bs-toggle="dropdown" aria-expanded="false" id="theme-selector" href="#" class="text-muted" title="Theme selector">
                        <i :class="`bi-${themeOptions[theme]?.icon}`"></i>
                    </a>
                    <ul class="dropdown-menu" aria-labelledby="theme-selector">
                        <li v-for="(details, option) in themeOptions" :key="option">
                            <a @click.prevent="settings.theme = option" href="#" class="dropdown-item" :class="{ active: option === theme }">
                                <i :class="`bi-${details.icon}`"></i>
                                <span class="ms-2">{{ details.label }}</span>
                            </a>
                        </li>
                    </ul>
                </div>
                <a data-bs-toggle="modal" href="#settings" class="text-muted">Settings</a>
                <a data-bs-toggle="modal" href="#project-mapping" class="text-muted" v-if="!settings.jiraDisabled">Project Mapping</a>
                <a data-bs-toggle="modal" href="#shortcuts" class="text-muted">Shortcuts</a>
            </nav>
            <div v-if="user">
                <div class="dropup">
                    Logged in as
                    <a href="#" class="text-muted" data-bs-toggle="dropdown" aria-expanded="false">
                        <span>{{ employee ? employee.name : user.username }}</span>
<!--                        <img v-if="employee && employee.avatar && employee.avatar.url_small" :src="employee.avatar.url_small" class="rounded-circle ms-2" style="width: 2rem; height: 2rem" :alt="employee.avatar.initals">-->
                    </a>
                    <ul class="dropdown-menu dropdown-menu-end">
                        <li><a @click="confirmLogout" href="#" class="dropdown-item">Log out from Simplicate</a></li>
                    </ul>
                </div>
            </div>
        </footer>

        <nav v-if="settings.showEmployees && employees" class="d-flex flex-row flex-wrap mt-4">
            <button type="button" v-for="employee in employees" :key="employee.id" @click="employeeId = employee.id" :class="employeeId === employee.id ? 'btn-secondary' : 'btn-outline-light text-body'" class="btn me-2 mb-2">
                <img v-if="employee.avatar" :src="employee.avatar.url_small" class="rounded me-2" style="width: 2rem; height: 2rem" :style="{'background-color': employee.avatar.color}" :alt="employee.avatar.initals">
                <span>{{ employee.name }}</span>
            </button>
        </nav>

        </div>

        <div class="modal" id="settings" ref="settingsModal">
            <div class="modal-dialog modal-lg modal-fullscreen-md-down">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Settings</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">

                        <settings v-model="settings" :version="version"/>

                    </div>
                    <div class="modal-footer justify-content-center">
                        <em class="text-muted">Settings are saved automatically.</em>
                    </div>
                </div>
            </div>
        </div>

        <!-- FIXME: we must use a static backdrop and disable esc discarding to prevent v-select from triggering modal hide -->
        <div class="modal" id="project-mapping" ref="projectMappingModal" data-bs-backdrop="static" data-bs-keyboard="false" v-if="!settings.jiraDisabled">
            <div class="modal-dialog modal-xl modal-fullscreen-lg-down">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Simplicate ↔ Jira Project Mapping</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">

                        <project-mapper v-model="projectMapping" :simplicate-projects="projects" :jira-projects="jiraProjects"/>

                    </div>
                    <div class="modal-footer justify-content-center">
                        <em class="text-muted">
                            These mappings are saved automatically.
                            Click <a href="#" data-bs-dismiss="modal">here</a> or the &times; in top right corner to close.
                        </em>
                    </div>
                </div>
            </div>
        </div>

        <div class="modal" id="shortcuts" ref="shortcutsModal">
            <div class="modal-dialog modal-lg modal-fullscreen-md-down">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Keyboard Shortcuts</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body shortcuts-help-content small">

                        <shortcuts/>

                    </div>
                </div>
            </div>
        </div>

        <div  class="visually-hidden" v-if="version">
            Version: <code>{{ version }}</code>
        </div>

    </div>
</template>

<script>

import axios from 'axios';
import {Modal} from 'bootstrap';
import Fuse from 'fuse.js';
import HoursInput from '@/components/HoursInput';
import Settings from '@/components/Settings';
import Shortcuts from '@/components/Shortcuts';
import ProjectMapper from "@/components/ProjectMapper";
import SimplicateSetup from '@/components/SimplicateSetup';
import WeekTotals from "@/components/WeekTotals";
import debounce from '@/lib/debounce';
import dateWeekNumber from "@/lib/dateWeekNumber";
import dateUtil from "@/lib/dateUtil";
import themeSelector from "@/lib/themeSelector";

const jiraUrl = process.env.VUE_APP_JIRA_URL;
const version = process.env.VUE_APP_VERSION;

const defaultSettings = {
    apiUrl: `${process.env.VUE_APP_SIMPLICATE_URL}/api/v2`,
    jiraApiUrl: `${jiraUrl}/rest/api/2`,
    jiraProjectKeyPattern: '[A-Z][A-Z_0-9]+',
    projectsSort: 'project_name',
    jiraDebounce: 200, // ms
    jiraDisabled: false,
    pickDate: true,
    showDateNav: false,
    requireComment: true,
    prefixCommentIssue: false,
    commentBeforeJira: false,
    groupByProject: true,
    autofocusProjectSelect: false,
    focusPostSubmit: true,
    hoursDisplayMode: 'hm',
    warnAboutUnmappedProject: false,
    preferredServiceRegex: null,
    preferredHoursTypeRegex: null,
    jiraSetStarted: true,
    confirmPosts: false,
    showEmployees: false,
    showWeekSums: true,
    showSubmissions: true,
    hideLoggedService: false,
    hideLoggedType: false,
    theme: 'auto',
    fontSize: '1rem',
    sizing: 'regular',
};

export default {
    name: 'App',
    components: {WeekTotals, ProjectMapper, SimplicateSetup, HoursInput, Settings, Shortcuts},
    data () {
        return {

            version: version,
            debug: false,

            authKey: window.localStorage.getItem('authKey') || process.env.VUE_APP_SIMPLICATE_AUTH_KEY || null,
            authSecret: window.localStorage.getItem('authSecret') || process.env.VUE_APP_SIMPLICATE_AUTH_SECRET || null,

            jiraUrl,
            jiraConfig: {
                withCredentials: true,
            },

            user: null,
            userLoading: false,
            employeeId: null,
            timeTables: [],
            loggedHours: [],
            hoursLoading: false,
            weekHours: [],
            weekHoursLoading: false,
            submissions: [],
            submissionsLoading: false,

            settings: Object.assign({}, defaultSettings, JSON.parse(window.localStorage.getItem('settings') || '{}')),

            projectMapping: JSON.parse(window.localStorage.getItem('projectMapping') || '[]')
                .filter(([s, j]) => s.length || j.length),

            themeOptions: themeSelector.themes,

            id: null,
            date: new Date(),
            project: null,
            projects: [],
            service: null,
            serviceNext: null,
            services: [],
            servicesLoading: false,
            hoursType: null,
            hoursTypeNext: null,
            hoursTypes: [],
            hoursTypesLoading: false,
            hours: 0,
            jiraIssue: null,
            jiraIssues: [],
            jiraProjects: [],
            comment: null,

            submitting: false,

            employees: [],
            employeesLoading: false,

            jiraUser: null,
            jiraUserLoading: null,

            isTodayUpdate: 0,
        }
    },
    computed: {
        settingsString () {
            return JSON.stringify(this.settings);
        },
        employee () {
            return this.user && this.user.employee_id ? this.employees.find(e => e.id === this.user.employee_id) : null;
        },
        bearer () {
            return this.authKey && this.authSecret ? `${this.authKey}:${this.authSecret}` : null;
        },
        apiConfig () {
            return {
                headers: {
                    'X-Experimental-ISO-8601': 'true',
                    'Content-Type': 'application/json',
                    'Authentication-Key': this.authKey,
                    'Authentication-Secret': this.authSecret,
                }
            }
        },
        dateValue () {
            return dateUtil.formatDate(this.date);
        },
        weekOddness () {
            const [,week] = this.date ? dateWeekNumber(this.date) : [];
            if (week === null) {
                return null;
            }
            return week % 2 === 0 ? 'even' : 'odd';
        },
        isValid () {
            return this.date &&
                this.project &&
                this.hoursType &&
                this.hours > 0 &&
                this.service &&
                (!this.settings.requireComment || this.comment);
        },
        isToday () {
            this.isTodayUpdate; // 'use' an observed property, so we can trigger a recompute.
            const now = new Date();
            return this.date &&
                this.date.getDate() === now.getDate() &&
                this.date.getMonth() === now.getMonth() &&
                this.date.getFullYear() === now.getFullYear();
        },
        day () {
            return this.date ? this.date.toLocaleDateString('en', {weekday: 'short'}) : '   ';
        },
        weekStartEnd () {
            if (!this.date) {
                return null;
            }
            let [weekStart, weekEnd] = dateUtil.weekStartEnd(this.date);
            return [dateUtil.formatDate(weekStart), dateUtil.formatDate(weekEnd)];
        },
        state () {
            return {
                id: this.id,
                date: this.dateValue,
                project: this.project,
                service: this.service,
                hoursType: this.hoursType,
                hours: this.hours,
                jiraIssue: this.jiraIssue,
                comment: this.comment,
            };
        },
        projectOptions () {
            return this.projects.map((p) => {
                p.mapped = this.projectMapping && this.projectMapping.some(([s,]) => s.includes(p.id));
                return p;
            });
        },
        projectIsUnmapped () {
            return this.project && this.projectMapping && !this.projectMapping.some(([s,]) => s.includes(this.project));
        },
        jiraProjectsSelected () {
            if (this.project && this.projectMapping) {
                return this.projectMapping
                    .filter(([s,]) => s.includes(this.project))
                    .flatMap(([,j]) => j.map(id => this.jiraProjects.find(jO => jO.id === id)))
                    .filter(j => !!j);
            }
            return [];
        },
        jiraProjectKeys () {
            let keys = [];
            // TODO: add setting to control if all projectKeys are used, or only the current one.
            if (this.jiraProjectsSelected.length) {
                keys = this.jiraProjectsSelected
                    .flatMap(p => p.projectKeys);
            }
            return keys.length ? keys : this.jiraProjects.flatMap(p => p.projectKeys);
        },
        prioritizedServices () {
            const services = this.services.map(v => Object.assign({}, v));
            this.prioritizeOptions(services, 'name', this.preferredServiceRegexes);
            return services;
        },
        higherPriorityServiceAvailable () {
            const service = this.prioritizedServices.find(v => v.id === this.service);
            return service
                && this.prioritizedServices.length > 1
                && this.prioritizedServices.some(v => (service.priority == null && v.priority != null) || (v.priority && v.priority < service.priority));
        },
        prioritizedHoursTypes () {
            const hoursTypes = this.hoursTypes.map(v => Object.assign({}, v));
            this.prioritizeOptions(hoursTypes, 'label', this.preferredHoursTypeRegexes);
            return hoursTypes;
        },
        higherPriorityHoursTypeAvailable () {
            const hoursType = this.prioritizedHoursTypes.find(v => v.id === this.hoursType);
            return hoursType
                && this.prioritizedHoursTypes.length > 1
                && this.prioritizedHoursTypes.some(v => (hoursType.priority == null && v.priority != null) || (v.priority && v.priority < hoursType.priority));
        },
        timeTable () {
            if (!this.date || !this.weekOddness) {
                return null;
            }
            const timeTable = this.timeTables.find(tt => {
                const startDate = this.dateStrToObject(tt.start_date);
                const endDate = this.dateStrToObject(tt.end_date);
                return startDate <= this.date
                    && (endDate == null || endDate >= this.date);
            });
            if (!timeTable || !timeTable[`${this.weekOddness}_week`]) {
                return null;
            }
            return timeTable[`${this.weekOddness}_week`];
        },
        hoursTarget () {
            if (!this.date || !this.timeTable) {
                return 0;
            }
            const dayNr = this.date.getDay() || 7; // sunday 0 -> 7
            return this.timeTable[`day_${dayNr}`].hours;
        },
        loggedHoursSorted () {
            const hours = [...this.loggedHours];
            if (this.settings.groupByProject) {
                hours.sort((a, b) => {
                    const _a = a && a.project && a.project.project_number ? parseInt(a.project.project_number) : 9999999;
                    const _b = a && b.project && b.project.project_number ? parseInt(b.project.project_number) : 9999999;
                    return _a - _b;
                });
            }
            return hours;
        },
        loggedHoursSum () {
            const sum = this.loggedHours.reduce((sum, hours) => {
                return sum + (this.id && hours.id === this.id ? 0 : hours.hours);
            }, 0);
            return Math.round(sum * 60) / 60;
        },
        loggedHoursMax () {
            return Math.max(...this.loggedHours.map(h => h.hours));
        },
        loggedHoursPercentage () {
            return this.hoursTarget ? (this.loggedHoursSum - this.loggedOvertime) / this.hoursTarget * 100 : 0;
        },
        hoursPercentage () {
            return this.hours && this.hoursTarget ? (this.hours / this.hoursTarget * 100) : null;
        },
        loggedOvertime () {
            return Math.max(0, this.loggedHoursSum - this.hoursTarget);
        },
        loggedOvertimePercentage () {
            return this.hoursTarget ? this.loggedOvertime / this.hoursTarget * 100 : 0;
        },
        preferredServiceRegexes () {
            return this.getRegexes(this.settings.preferredServiceRegex);
        },
        preferredHoursTypeRegexes () {
            return this.getRegexes(this.settings.preferredHoursTypeRegex);
        },
        inputOrder () {
            if (this.settings.jiraDisabled) {
                return ['comment'];
            }
            const inputs = ['jiraIssue', 'comment'];
            if (this.settings.commentBeforeJira) {
                inputs.reverse();
            }
            return inputs;
        },
        theme () {
            return this.settings.theme ?? 'auto';
        },
        fontSize () {
            return this.settings.fontSize ?? '1rem';
        },
        sizing () {
            return this.settings.sizing ?? 'regular';
        },
    },
    watch: {
        user () {
            if (this.user) {
                this.employeeId = this.user.employee_id;
                if (!this.employee) {
                    this.fetchEmployee();
                }
                this.fetchHours();
                this.fetchTimetable();
                if (this.weekStartEnd) {
                    this.fetchHourSubmissions();
                    this.fetchWeekHours();
                }
            }
            if (this.user && this.projects.length === 0) {
                this.fetchProjects();
            }
        },
        dateValue (value) {
            window.history.replaceState(null, `SSTt ${value}`, value ? `#${value}` : '#');
            if (value && this.user && this.employeeId) {
                this.fetchHours();
            }
        },
        weekStartEnd (value, prev) {
            if (value && prev && value[0] === prev[0] && value[1] === prev[1]) {
                return;
            }
            if (value && this.user) {
                this.fetchHourSubmissions();
                this.fetchWeekHours();
            }
        },
        employeeId (value, prev) {
            if (value && prev && value !== prev) {
                this.fetchHours();
                this.fetchTimetable();
                this.fetchHourSubmissions();
                this.fetchWeekHours();
            }
        },
        project () {
            if (this.project) {
                this.fetchServices();
            } else {
                this.services = [];
            }
        },
        jiraProjectsSelected (projects) {
            if (projects.length > 0 && projects.length < 10) {
                const jql = `project IN (${this.jiraProjectsSelected.map(p => p.key).join(',')}) ORDER BY updated DESC`;
                const params = new URLSearchParams({
                    jql,
                    fields: 'summary',
                    maxResults: 200, // TODO: use setting
                });
                this.debounceFetchJiraIssues(params, () => {});
            }
        },
        jiraIssue (issue) {
            if (this.settings.prefixCommentIssue && issue && (!this.comment || this.comment === '' || this.comment.match(/^\w+-\d+(: )?$/))) {
                this.comment = issue + ': ';
            }
        },
        prioritizedServices (value, prev) {
            const [currentIds, prevIds] = [value.map(v => v.id), prev.map(v => v.id)];
            const sameSet = currentIds.length === prevIds.length && currentIds.every(id => prevIds.includes(id));

            // Keep/set option dictated via edit/import
            if (this.serviceNext) {
                const serviceNext = this.serviceNext;
                this.serviceNext = null;
                if (currentIds.includes(serviceNext)) {
                    this.service = serviceNext;
                    return;
                }
            }
            // Keep current selection if available options are the same
            if (this.service && sameSet && currentIds.includes(this.service)) {
                return;
            }
            // Clear if no options, otherwise pick the only option, or the first preferred option
            const service = (() => {
                if (this.prioritizedServices.length === 0) {
                    return null;
                }
                if (this.prioritizedServices.length === 1) {
                    return this.prioritizedServices.slice(0, 1)[0];
                }
                return this.prioritizedServices.find(v => v.priority === 1);
            })();
            this.service = service ? service.id : null;
        },
        service () {
            if (this.service) {
                this.fetchHoursTypes();
            } else {
                this.hoursTypes = [];
            }
        },
        prioritizedHoursTypes (value, prev) {
            const [currentIds, prevIds] = [value.map(v => v.id), prev.map(v => v.id)];
            const sameSet = currentIds.length === prevIds.length && currentIds.every(id => prevIds.includes(id));

            // Keep/set option dictated via edit/import
            if (this.hoursTypeNext) {
                const hoursTypeNext = this.hoursTypeNext;
                this.hoursTypeNext = null;
                if (currentIds.includes(hoursTypeNext)) {
                    this.hoursType = hoursTypeNext;
                    return;
                }
            }
            // Keep current selection if available options are the same
            if (this.hoursType && sameSet && currentIds.includes(this.hoursType)) {
                return;
            }
            // Clear if no options, otherwise pick the only option, or the first preferred option
            const hoursType = (() => {
                if (this.prioritizedHoursTypes.length === 0) {
                    return null;
                }
                if (this.prioritizedHoursTypes.length === 1) {
                    return this.prioritizedHoursTypes.slice(0, 1)[0];
                }
                return this.prioritizedHoursTypes.find(v => v.priority === 1);
            })();
            this.hoursType = hoursType ? hoursType.id : null;
        },
        settingsString: {
            handler (settingsString, prevString) {
                window.localStorage.setItem('settings', settingsString);
                const settings = JSON.parse(settingsString);
                const prev = JSON.parse(prevString);
                if (!prev.showWeekSums && settings.showWeekSums) {
                    this.fetchWeekHours();
                }
                if (!prev.showSubmissions && settings.showSubmissions) {
                    this.fetchHourSubmissions();
                }
            }
        },
        projectMapping: {
            deep: true,
            handler (mapping) {
                window.localStorage.setItem('projectMapping', JSON.stringify(mapping));
            }
        },
        theme: {
            immediate: true,
            handler (theme) {
                themeSelector.setTheme(theme);
            },
        },
        fontSize: {
            immediate: true,
            handler (fontSize) {
                document.documentElement.style.setProperty('--bs-root-font-size', fontSize);
            },
        },
        sizing: {
            immediate: true,
            handler (size) {
                document.documentElement.setAttribute('data-app-sizing', size);
            },
        },
    },
    methods: {
        confirmLogout() {
            if (window.confirm('Are you sure you want to log out from Simplicate?\n\nThis will require you to re-authorize this application if you want use it again.\n\n\nPlease note this does not revoke the application authorization or api key, it merely removes the locally stored user/auth information. Revoking api/app access can be done in the Simplicate interface.')) {
                this.logout();
            }
        },
        logout () {
            this.user = null;
            this.employeeId = null;
            this.authKey = null;
            this.authSecret = null;
            this.storeAuth();
            // TODO: check if we can revoke the used auth token
        },
        async submit (clearing) {
            if (!this.settings.pickDate) {
                this.setToday();
            }
            if (!this.isValid) {
                return;
            }
            if (this.id && this.jiraIssue && !confirm('This entry is linked to an Jira issue, which will not be updated!\nAre you sure you want to continue?')) {
                return;
            }
            this.submitting = true;
            try {
                await this.submitHours();
                if (this.jiraIssue && !this.id) { // TODO: allow updating/posting jiraWorklog
                    await this.postJiraWorklog();
                }
            } catch (error) {
                window.alert('An error occurred\n(check console for details)');
                console.error(error);
                this.submitting = false;
                return;
            }
            this.id = null;
            this.jiraIssue = null;
            this.comment = null;
            this.hours = 0;
            this.submitting = false;
            if (clearing !== true) {
                // NB: still focusing hours input regardless of focusPostSubmit setting, as the whole point is of the non-clear submit is be able to quickly add another entry.
                this.$nextTick(() => {
                    this.focusHoursInput();
                });
            }
            this.fetchHours(); // TODO: 'manually' add the just created hours record to the loggedHours array. (one less request)
            this.fetchWeekHours(); // TODO: 'manually' add the just created hours record to the loggedHours array. (another one less request)
            this.fetchHourSubmissions(); // TODO: 'manually' set update the day's submit status (another one less request)
        },
        async submitAndClear () {
            if (!this.isValid) {
                return;
            }
            await this.submit(true);
            this.clear();
            if (this.settings.focusPostSubmit) {
                this.$nextTick(() => {
                    this.focusProjectSelect();
                });
            }
        },
        clear () {
            this.restoreState({
                date: this.date,
            });
            // TODO: make configurable if date is reset to today
            // this.setToday();
        },
        confirmDeleteHours (id, hours) {
            // TODO: warn user if Jira issue is set.
            if (!confirm('Are you sure you want to remove this entry?')) {
                return;
            }
            this.deleteHours(id, hours);
        },
        editHours (hours) {
            this.importHours(hours, {
                id: hours.id,
            });
        },
        importHours (hours, ...more) {
            this.addUnknownProject(hours.project);
            this.restoreState(Object.assign({
                date: this.dateValue,
                project: hours.project ? hours.project.id : null,
                service: hours.projectservice ? hours.projectservice.id : null,
                hoursType: hours.type ? hours.type.id : null,
                hours: hours.hours,
                jiraIssue: hours.jiraKey,
                comment: hours.note,
            }, ...more));
        },
        restoreState (state) {
            this.id = state.id || null;
            this.date = this.dateStrToObject(state.date || null);
            this.project = state.project || null;
            this.service = state.service || null;
            this.serviceNext = this.service;
            this.hoursType = state.hoursType || null;
            this.hoursTypeNext = this.hoursType;
            this.hours = state.hours || 0;
            this.jiraIssue = state.jiraIssue || null;
            this.comment = state.comment || null;
        },
        addUnknownProject (project) {
            if (!project || !project.id) {
                return;
            }
            // Disabled/ended projects are probably missing, let's check...
            if (this.projects.some((p) => p.id === project.id)) {
                return;
            }
            if (project.project_name === undefined) {
                project = Object.assign({}, project, {
                    name: `<b>${project.organization.name}</b> '${project.name} (${project.project_number})'`,
                    project_name: `${project.name} (${project.project_number})`,
                });
            }
            project.disabled = true;
            this.projects.push(project);
        },
        storeAuth () {
            localStorage.setItem('authKey', this.authKey);
            localStorage.setItem('authSecret', this.authSecret);
            if (this.user) {
                localStorage.removeItem('codeVerifier');
                localStorage.removeItem('codeChallenge');
            }
        },
        setToday () {
            this.date = new Date();
        },
        dateStrToObject (value) {
            return value ? new Date(value) : null;
        },
        onDateInput (event) {
            const value = event.target.value;
            this.date = this.dateStrToObject(value);
        },
        filterProjects (options, search) {
            const enabledOptions = options.filter(p => !p.disabled);
            // TODO: use sort to add matching but disabled options to the bottom of the list? (instead of above filter)
            const fuse = new Fuse(enabledOptions, {
                keys: [{
                    name: 'project_name',
                    weight: 0.7,
                },{
                    name: 'organization.name',
                    weight: 0.3,
                }],
            });
            return search.length
                ? fuse.search(search).map(({item}) => item)
                : fuse.list;
        },
        filterJiraSearch (options, search) {
            const fuse = new Fuse(options, {
                keys: ['key', 'fields.summary'],
                shouldSort: true,
                // includeScore: true,
            });
            return search.length
                ? fuse.search(search).map(({item}) => item)
                : fuse.list;
        },
        onJiraSearch (search, loading) {
            if (search) {
                // TODO: finish this stuff :)
                if (this.jiraProjectsSelected.length && this.jiraProjectsSelected.length <= 10) {
                    // const jql = `project IN (${this.jiraProjectsSelected.map(p => p.key).join(',')}) ORDER BY updated DESC`;
                    // const params = new URLSearchParams({
                    //     jql,
                    //     fields: 'summary',
                    //     maxResults: 200, // TODO: use setting
                    // });
                    // this.debounceFetchJiraIssues(params, loading);

                    loading(false);
                    return;
                }
                const params = this.getJiraIssueSearchPrams(search);
                this.debounceFetchJiraIssues(params, loading);
            } else {
                // TODO: cancel current fetch request (if exists)
                loading(false);
            }
        },
        onHashChange () {
            const hash = window.location.hash;
            let match;
            if (hash && (match = hash.match(/(?<!\d)\d{4}-\d{1,2}-\d{1,2}(?!\d)/))) {
                try {
                    this.date = new Date(match[0]);
                } catch (e) {
                    console.error('Invalid date in location hash', e);
                }
            }
        },
        onKeyUp (event) {
            if (event.key === 'Enter' && (event.ctrlKey) && this.isValid) {
                if (event.shiftKey) {
                    this.submitAndClear();
                } else {
                    this.submit();
                }
            } else if (event.key === '?' && (event.target === document.body || event.target.matches(':not(input,select,option,textarea)'))) {
                this.getShortcutsModal().toggle();
            }  else if (event.key === 'Escape') {
                if (this.getShortcutsModal()._isShown) {
                    this.getShortcutsModal().hide();
                    return;
                }
                if (this.getSettingsModal()._isShown) {
                    this.getSettingsModal().hide();
                }
            } else if (event.key === 'a' && (event.altKey || event.target === document.body)) {
                event.preventDefault();
                this.focusDateInput();
            } else if (event.key === 'p' && (event.altKey || event.target === document.body)) {
                event.preventDefault();
                this.focusProjectSelect();
            } else if (event.key === 'i' && (event.altKey || event.target === document.body)) {
                event.preventDefault();
                this.focusServiceSelect();
            } else if (event.key === 'u' && (event.altKey || event.target === document.body)) {
                event.preventDefault();
                this.focusHoursTypeSelect();
            } else if (event.key === 'h' && (event.altKey || event.target === document.body)) {
                event.preventDefault();
                this.focusHoursInput();
            } else if (event.key === 'j' && (event.altKey || event.target === document.body)) {
                event.preventDefault();
                this.focusJiraIssueSelect();
            } else if (event.key === 'o' && (event.altKey || event.target === document.body)) {
                event.preventDefault();
                this.focusCommentInput();
            } else if (event.key === 't' && (event.altKey || event.target === document.body)) {
                event.preventDefault();
                this.setToday();
            } else if (event.key === 'ArrowLeft' && event.altKey && event.shiftKey) {
                event.preventDefault();
                this.stepDate(event.ctrlKey ? -7 : -1);
            } else if (event.key === 'ArrowRight' && event.altKey && event.shiftKey) {
                event.preventDefault();
                this.stepDate(event.ctrlKey ? +7 : +1);
            }
        },
        onAuthChange (authKey, authSecret) {
            this.authKey = authKey;
            this.authSecret = authSecret;
            this.fetchUser();
        },
        onSelectMounted(ref) {
            // Prevent tabbing to the clear button of the vue-select input
            const $ref = this.$refs[ref][0] ?? this.$refs[ref];
            if ($ref?.$refs?.clearButton) {
                $ref.$refs.clearButton.tabIndex = -1;
            }
        },
        onVisibilityChange () {
            if (document.visibilityState === 'visible') {
                this.isTodayUpdate++; // trigger recompute of isToday.
            }
        },
        async fetchPaginated (url, params, config = undefined, maxRequests = null) {
            if (params.has('offset')) {
                throw new Error('Offset parameter should nog be set!');
            }

            const metaParams = (params.get('metadata') || '').split(',').filter(e => e);
            if (!metaParams.includes('limit')) metaParams.push('limit');
            if (!metaParams.includes('count')) metaParams.push('count');
            params.set('metadata', metaParams.join(','));
            const limit = parseInt(params.get('limit') || '100');
            params.set('limit', `${limit}`);

            let resp;
            let offset = 0;
            const result = [];
            while (maxRequests == null || maxRequests >= 0) {
                params.set('offset', `${offset}`);
                resp = await axios.get(url.replace(/\?*$/, '?') + params, config || this.apiConfig);
                if (resp.data.errors) {
                    throw new Error(`Got errors while making request to ${url}?${params}`);
                }
                if (resp.data.data) {
                    result.push(...resp.data.data);
                }
                if ((resp.data.data && resp.data.data.leading < limit) || (resp.data.metadata.count != null && result.length >= resp.data.metadata.count)) {
                    break;
                }
                offset += limit;
                maxRequests--;
            }
            return result;
        },
        fetchUser () {
            this.userLoading = true;
            axios.get(this.settings.apiUrl + '/users/user', this.apiConfig).then(resp => {
                if (resp.data.data && !resp.data.errors) {
                    this.user = resp.data.data;
                    this.storeAuth();
                }
            }).finally(() => {
                this.userLoading = false;
            });
        },
        fetchTimetable () {
            if (!this.employeeId) {
                throw new Error('user employee_id must de available');
            }
            const params = new URLSearchParams({
                'sort': '-start_date',
                'q[employee.id]': this.employeeId,
            });
            axios.get(this.settings.apiUrl + '/hrm/timetable?' + params, this.apiConfig).then(resp => {
                if (resp.data.data && !resp.data.errors) {
                    this.timeTables = resp.data.data;
                }
            });
        },
        async fetchProjects () {
            if (!this.user || !this.employeeId) {
                throw new Error('user employee_id must de available');
            }
            const params = new URLSearchParams({
                'sort': 'project_name', // [start_date, name, project_name, project_number, ...?]
                'q[employee_id]': this.employeeId,
            });
            return axios.get(this.settings.apiUrl + '/hours/projects?' + params, this.apiConfig).then(resp => {
                if (resp.data.data && !resp.data.errors) {
                    this.projects = resp.data.data;
                }
            });
        },
        async fetchUnknownProject (id) {
            if (!this.user) {
                throw new Error('user must de available');
            }
            const params = new URLSearchParams({
                'q[project.id]': id,
                'limit': 1,
            });
            return axios.get(this.settings.apiUrl + '/hours/hours?' + params, this.apiConfig)
                .then(resp => {
                    if (resp.data && resp.data.data && resp.data.data[0]) {
                        this.addUnknownProject(resp.data.data[0].project);
                    }
                });
        },
        fetchServices () {
            if (!this.user || !this.employeeId || !this.project) {
                throw new Error('user employee_id and project-id must de available');
            }
            const params = new URLSearchParams({
                // 'sort': 'start_date',
                'q[employee_id]': this.employeeId,
                'q[start_date]': this.dateValue,
                'q[project_id]': this.project,
            });
            this.servicesLoading = true;
            axios.get(this.settings.apiUrl + '/hours/projectservices?' + params, this.apiConfig)
                .then(resp => {
                    if (resp.data.data && !resp.data.errors) {
                        this.services = resp.data.data;
                    }
                })
                .catch((err) => {
                    this.services = [];
                    throw err;
                })
                .finally(() => {
                    this.servicesLoading = false;
                });
        },
        fetchHoursTypes () {
            if (!this.user || !this.employeeId || !this.project || !this.service) {
                throw new Error('user employee_id, project_id and projectservice_id must de available');
            }
            const params = new URLSearchParams({
                // 'sort': 'start_date',
                'q[employee_id]': this.employeeId,
                'q[start_date]': this.dateValue,
                'q[project_id]': this.project,
                'q[projectservice_id]': this.service,
            });
            this.hoursTypesLoading = true;
            axios.get(this.settings.apiUrl + '/hours/projectservicehourstypes?' + params, this.apiConfig)
                .then(resp => {
                    if (resp.data.data && !resp.data.errors) {
                        this.hoursTypes = resp.data.data;
                    }
                })
                .finally(() => {
                    this.hoursTypesLoading = false;
                });
        },
        fetchHours() {
            if (!this.user || !this.employeeId || !this.date) {
                throw new Error('user employee_id and date must de available');
            }

            const params = new URLSearchParams({
                'sort': 'created_at',
                'q[employee.id]': this.employeeId,
                'q[start_date]': `${this.dateValue} *`,
                'limit': 100,
            });

            this.hoursLoading = true;

            const copyProps = ['id', 'project', 'projectservice', /*'hours', */'start_date', 'is_time_defined', 'note', 'status', 'locked'];

            this.fetchPaginated(this.settings.apiUrl + '/hours/hours', params, this.apiConfig)
                .then(result => {
                    this.loggedHours = result.map(entry => {
                        const externalUrlFields = (entry.custom_fields || []).filter(f => f.name === 'external_url' && f.value);
                        const externalUrl = entry.external_url ?? (externalUrlFields.length ? externalUrlFields[0].value : null);
                        const jiraKeyMatch = externalUrl ? externalUrl.match(/\/browse\/([A-Z][A-Z_0-9]+-\d+)/i) : null;
                        const jiraKey = jiraKeyMatch ? jiraKeyMatch[1] : null;

                        // copy some props from the 'type' object
                        const type = (({ id, label, color }) => ({ id, label, color }))(entry.type);

                        const hours = Math.round((entry.hours || 0) * 60) / 60;

                        return Object.assign(
                            {},
                            copyProps.reduce((result, prop) => { result[prop] = entry[prop]; return result }, {}),
                            {
                                hours,
                                type,
                                externalUrl,
                                jiraKey,
                            },
                        );
                    });
                })
                .finally(() => {
                    this.hoursLoading = false;
                });
        },
        fetchWeekHours () {
            if (!this.settings.showWeekSums) {
                return; // no need to fetch hours from the whole week if we're not showing the sums
            }

            if (!this.employeeId || !this.weekStartEnd) {
                throw new Error('user employee_id and date-range must de available');
            }

            const params = new URLSearchParams({
                'q[employee.id]': this.employeeId,
                'q[start_date][ge]': `${this.weekStartEnd[0]} 00:00:00`,
                'q[start_date][le]': `${this.weekStartEnd[1]} 23:59:59`,
                'select': 'id,project.,hours,start_date',
                'sort': 'project.project_number',
                'limit': 100,
            });

            this.weekHoursLoading = true;

            this.fetchPaginated(this.settings.apiUrl + '/hours/hours', params, this.apiConfig, 10)
                .then(result => {
                    this.weekHours = result;
                })
                .finally(() => {
                    this.weekHoursLoading = false;
                });
        },
        fetchHourSubmissions () {
            if (!this.settings.showSubmissions) {
                return; // no need to fetch submissions if we're not showing them
            }

            if (!this.employeeId || !this.weekStartEnd) {
                throw new Error('user employee_id and date-range must de available');
            }

            const params = new URLSearchParams({
                'q[employee_id]': this.employeeId,
                'q[start_date]': this.weekStartEnd[0],
                'q[end_date]': this.weekStartEnd[1],
            });

            this.submissionsLoading = true;

            axios.get(this.settings.apiUrl + '/hours/submission?' + params, this.apiConfig)
                .then(resp => {
                    if (resp.data.data && !resp.data.errors) {
                        this.submissions = resp.data.data;
                    }
                })
                .finally(() => {
                    this.submissionsLoading = false;
                });
        },
        fetchEmployee () {
            if (!this.user || !this.employeeId) {
                throw new Error('user employee id must de available');
            }
            const params = new URLSearchParams({
                'select': 'id,name,avatar.',
            });

            this.employeesLoading = true;

            axios.get(this.settings.apiUrl + '/hrm/employee/' + this.employeeId + '?' + params, this.apiConfig)
                .then(resp => {
                    if (resp.data.data && !resp.data.errors) {
                        this.employees = [resp.data.data];
                    }
                })
                .finally(() => {
                    this.employeesLoading = false;
                });
        },
        fetchAllEmployees () {
            const params = new URLSearchParams({
                'sort': 'name',
                'q[employment_status]': 'active',
                'select': 'id,name,avatar.',
            });

            this.employeesLoading = true;

            axios.get(this.settings.apiUrl + '/hrm/employee?' + params, this.apiConfig)
                .then(resp => {
                    if (resp.data.data && !resp.data.errors) {
                        this.employees = resp.data.data.filter(e => e.name != null && e.name !== '');
                    }
                })
                .finally(() => {
                    this.employeesLoading = false;
                });
        },
        getJiraIssueSearchPrams (search) {
            if (this.settings.jiraDisabled) {
                return;
            }
            //jql=summary~%27FOO%27%20ORDER%20BY%20key&fields=summary,created&maxResults=100&sort=foo
            const searchOr = [];
            const numberMatch = search.match(/^\d{2,}$/);
            if (numberMatch && this.jiraProjectKeys.length >= 1 && this.jiraProjectKeys.length < 10) {
                searchOr.push(`key IN (${this.jiraProjectKeys.map(k => `${k}-${search}`)})`);
            } else {
                searchOr.push(`text ~ '${escape(search)}'`);
            }
            const keyMatch = search.match(new RegExp(`^(${this.settings.jiraProjectKeyPattern})-\\d+$`, 'i'));
            if (keyMatch && this.jiraProjectKeys.includes(keyMatch[1].toUpperCase())) {
                searchOr.push(`key = ${escape(search)}`);
            }
            const projectMatch = search.match(new RegExp(`^${this.settings.jiraProjectKeyPattern}`, 'i'));
            if (projectMatch && this.jiraProjectKeys.includes(projectMatch[0].toUpperCase())) {
                searchOr.push(`project = ${escape(projectMatch[0].toUpperCase())}`);
            }
            return new URLSearchParams({
                jql: searchOr.join(' OR '),
                fields: 'summary',
                maxResults: 200, // TODO: use setting
            });
        },
        async fetchJiraIssues (params, loading) {
            if (this.settings.jiraDisabled) {
                return;
            }
            return axios.get(this.settings.jiraApiUrl + '/search?' + params, this.jiraConfig)
                .then(resp => {
                    // FIXME: The X-AUSERNAME header isn't whitelisted in Access-Control-Expose-Headers
                    const username = resp.headers['x-ausername'] || null;
                    if (/*!username || */username === 'anonymous') {
                        this.jiraUser = null;
                        throw new Error('Not logged in at Jira');
                    }
                    if (resp.data && resp.data.issues) {
                        this.jiraIssues = resp.data.issues.map(item => {
                            return Object.assign({}, item, {
                                label: `${item.key} ${item.fields.summary}`,
                            });
                        });
                    } else {
                        this.jiraIssues = [];
                    }
                })
                .catch(error => {
                    if (error.response && error.response.data && error.response.data.errorMessages) {
                        console.warn('Error fetching Jira issues;', error.response.data.errorMessages.join(', '));
                        console.debug(error);
                    } else {
                        console.error('Error fetching Jira issues;', error);
                    }
                })
                .finally(() => {
                    loading(false);
                });
        },
        fetchJiraProjects () {
            if (this.settings.jiraDisabled) {
                return;
            }
            const params = new URLSearchParams({
                expand: 'projectKeys',
                maxResults: 1000, // TODO: use setting, also I believe 200 is the max :P
            });
            axios.get(this.settings.jiraApiUrl + '/project?' + params, this.jiraConfig)
                .then(resp => {
                    this.jiraProjects = resp.data;
                })
        },
        fetchJiraUser () {
            if (this.settings.jiraDisabled) {
                return;
            }
            this.jiraUserLoading = true;
            axios.get(this.settings.jiraApiUrl + '/myself', this.jiraConfig)
                .then(resp => {
                    this.jiraUser = resp.data;
                })
                .catch((err) => {
                    console.error('Failed to load Jira user, not logged in?', err);
                    this.jiraUser = null;
                })
                .finally(() => {
                    this.jiraUserLoading = false;
                });
        },
        submitHours () {
            if (!this.isValid) {
                throw new Error('Form must be valid before it can be submitted to Simplicate');
            }
            if (!this.user || !this.employeeId || !this.project || !this.service || !this.hoursType) {
                throw new Error('user employee_id, project_id, projectservice_id, type_id must de available');
            }
            const data = {
                employee_id: this.employeeId,
                hours: this.hours,
                is_time_defined: false,
                start_date: this.dateValue,
                project_id: this.project,
                projectservice_id: this.service,
                type_id: this.hoursType,
            };
            if (this.comment && this.comment.length) {
                data.note = this.comment;
            }
            if (this.jiraIssue) {
                data.external_url = `${this.jiraUrl}/browse/${this.jiraIssue}`;
                data.custom_fields = [{
                    external_url: `${this.jiraUrl}/browse/${this.jiraIssue}`,
                }];
            }

            if (this.settings.confirmPosts && !window.confirm(`Are you sure you want to send ${JSON.stringify(data)}?`)) {
                console.warn('Cancelling Simplicate submit', data);
                return;
            }
            const method = this.id ? 'put' : 'post';
            let url = `${this.settings.apiUrl}/hours/hours`;
            if (this.id) {
                url += `/${this.id}`;
            }
            return axios(Object.assign({method, url, data}, this.apiConfig))
                .then(resp => {
                    console.info('Registered hours at Simplicate as %s', resp.data.data ? resp.data.data.id : null);
                    console.debug(resp);
                    return resp;
                });
        },
        deleteHours (id, hours) {
            id = id || hours.id;
            return axios.delete(`${this.settings.apiUrl}/hours/hours/${id}`, this.apiConfig)
                .then(resp => {
                    console.info('Deleted hours at Simplicate %s', id);
                    console.debug(resp);
                    return resp;
                })
                // TODO: show alert on error
                .finally(() => {
                    this.fetchHours();
                    this.fetchWeekHours();
                    this.fetchHourSubmissions();
                });
        },
        submitLoggedWeekHours () {
            if (!this.employeeId || !this.weekStartEnd) {
                throw new Error('user employee_id and date-range must de available');
            }

            const [start_date, end_date] = this.weekStartEnd;
            const data = {
                employee_id: this.employeeId,
                start_date,
                end_date,
            };

            if (this.settings.confirmPosts && !window.confirm(`Are you sure you want to send submission ${JSON.stringify(data)}?`)) {
                console.warn('Cancelling Simplicate hours submission', data);
                return;
            }

            axios.post(`${this.settings.apiUrl}/hours/submission`, data, this.apiConfig)
                .then(resp => {
                    console.info('Submitted hours at Simplicate.');
                    console.debug(resp);
                    return resp;
                }).finally(() => {
                    this.fetchHourSubmissions();
                    this.fetchHours(); // Fetch current days hours, to get updated statuses.
                });
        },
        postJiraWorklog () {
            if (this.settings.jiraDisabled) {
                return;
            }
            if (!this.isValid) {
                throw new Error('Form must be valid before it can be submitted to Simplicate');
            }
            if (!this.jiraIssue) {
                throw new Error('Jira issue key must be set');
            }

            // https://developer.atlassian.com/cloud/jira/platform/rest/v2/api-group-issue-worklogs/#api-rest-api-2-issue-issueidorkey-worklog-post
            const content = {
                timeSpentSeconds: Math.round(this.hours * 3600),
            };
            const comment = this.comment ? `${this.comment}`.trim(): null;
            if (comment && comment.length) {
                content.comment = comment;
            }
            if (!this.isToday && this.settings.jiraSetStarted && this.date) {
                content.started = this.date.toISOString().replace('Z', '+0000');
            }

            const url = `${this.settings.jiraApiUrl}/issue/${this.jiraIssue}/worklog`;

            if (this.settings.confirmPosts && !window.confirm(`Are you sure you want to send ${JSON.stringify(content)} to ${url}?`)) {
                console.warn('Cancelling Jira submit', content);
                return;
            }
            return axios.post(url, content, this.jiraConfig)
                .then(resp => {
                    console.info('Added worklog at Jira as #%d; %s', resp.data.id || null, resp.data.self || null);
                    console.debug(resp);
                    return resp;
                });
        },
        getRegexes (str) {
            return (str || '')
                .split('\n')
                .filter(val => val)
                .map(pattern => {
                    try {
                        return new RegExp(pattern, 'iu');
                    } catch {
                        return null;
                    }
                })
                .filter(regex => regex);
        },
        prioritizeOptions (options, property, regexes) {
            let priority = 1;
            for (const regex of regexes) {
                let match = false;
                for (const option of options.filter(o => o.priority == null)) {
                    if (regex.test(option[property])) {
                        match = true;
                        option.priority = priority;
                    }
                }
                if (match) {
                    priority++;
                }
            }
        },
        stepDate (days) {
            if (this.date && days) {
                this.date.setDate(this.date.getDate() + days);
                this.date = new Date(this.date);
            }
        },
        nextDay () {
            this.stepDate(+1);
        },
        prevDay () {
            this.stepDate(-1);
        },
        focusDateInput () {
            this.$refs.dateInput.focus();
        },
        focusProjectSelect () {
            this.$refs.projectSelector.$refs.search.focus();
        },
        focusServiceSelect () {
            this.$refs.serviceSelector.$refs.search.focus();
        },
        focusHoursTypeSelect () {
            this.$refs.hoursTypeSelector.$refs.search.focus();
        },
        focusHoursInput () {
            this.$refs.hoursInput.focus();
        },
        focusJiraIssueSelect () {
            if (!this.settings.jiraDisabled || this.$refs.jiraIssueSelector == null) {
                return;
            }
            // check for array, due to v-for
            (this.$refs.jiraIssueSelector[0] ?? this.$refs.jiraIssueSelector).$refs.search.focus();
        },
        focusCommentInput () {
            // check for array, due to v-for
            (this.$refs.commentInput[0] ?? this.$refs.commentInput).focus();
        },
        getSettingsModal () {
            return Modal.getInstance(this.$refs.settingsModal)
                || new Modal(this.$refs.settingsModal, {
                    keyboard: true,
                });
        },
        getShortcutsModal () {
            return Modal.getInstance(this.$refs.shortcutsModal)
                || new Modal(this.$refs.shortcutsModal, {
                    keyboard: true,
                });
        },
    },
    mounted () {
        if (!this.user && this.authKey && this.authSecret) {
            this.fetchUser();
        }
        this.fetchJiraUser();
        this.$refs.projectMappingModal?.addEventListener('show.bs.modal', () => {
            // Find 'unknown' projects
            if (this.projects.length && this.projectMapping.length) {
                const knownProjectIds = this.projects.map(p => p.id);
                this.projectMapping
                    .flatMap(m => m[0])
                    .filter(id => !knownProjectIds.includes(id))
                    .forEach(id => this.fetchUnknownProject(id));
            }
        });
        themeSelector.watchPreferredColorScheme(() => this.theme);
    },
    created () {
        document.addEventListener('visibilitychange', this.onVisibilityChange);
        window.addEventListener('keyup', this.onKeyUp);
        window.addEventListener('hashchange', this.onHashChange);
        this.onHashChange();
        this.debounceFetchJiraIssues = debounce(this.fetchJiraIssues, this.settings.jiraDebounce || defaultSettings.jiraDebounce);
        if (this.jiraProjects.length === 0) {
            this.fetchJiraProjects();
        }
    },
    destroyed () {
        document.removeEventListener('visibilitychange', this.onVisibilityChange);
        window.removeEventListener('keyup', this.onKeyUp);
        window.removeEventListener('hashchange', this.onHashChange);
    }
}
</script>
