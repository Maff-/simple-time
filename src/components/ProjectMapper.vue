<template>
    <div>
        <div class="alert alert-info">
            Here you can create a (many-to-many) mapping between projects from Simplicate and Jira.<br>
            Doing so will limit the Jira issue search, improving your changes of quickly finding the correct item by summary.
        </div>
        <div class="row">
            <div class="col"><strong>Simplicate</strong></div>
            <div class="col"><strong>Jira</strong></div>
        </div>
        <div v-for="([simplicate, jira], index) in value" :key="index" class="row mt-3">
            <div class="col">
                <v-select
                    :uid="`pm-simplicate-project-selector-${index}`"
                    :input-id="`pm-simplicate-project-search-${index}`"
                    placeholder="Simplicate Project"
                    multiple
                    required
                    :value="simplicate"
                    @input="onSimplicateInput(index, $event)"
                    :options="simplicateProjects"
                    :selectable="selectableCb(simplicate)"
                    label="name"
                    :reduce="p => p.id"
                    :select-on-tab="true"
                    :clear-search-on-blur="() => true"
                    :clear-search-on-select="false"
                    :close-on-select="false"
                    ref="simplicateProjectSelect"
                >
                    <template #option="option">
                        <code class="me-2">{{ option.project_number }}</code>
                        <span class="me-2">{{ option.project_name.replace(/\s*\(\d+\)$/, '') }}</span>
                        <span class="text-muted">{{ option.organization ? option.organization.name : '' }}</span>
                    </template>
                    <template #selected-option="option">
                        <span
                            v-if="option.project_name"
                            :title="`${option.project_name} - ${option.organization ? option.organization.name : ''}`.trim()"
                        >{{ option.project_name.replace(/\s*\(\d+\)$/, '') }}</span>
                        <template v-else>{{ option.name }}</template>
                    </template>
                </v-select>
            </div>
            <div class="col">
                <v-select
                    :uid="`pm-jira-project-selector-${index}`"
                    :input-id="`pm-jira-project-search-${index}`"
                    placeholder="Jira Project"
                    multiple
                    required
                    :value="jira"
                    @input="onJiraInput(index, $event)"
                    :options="jiraProjects"
                    :selectable="selectableCb(jira)"
                    label="name"
                    :reduce="p => p.id"
                    :select-on-tab="true"
                    :clear-search-on-blur="() => true"
                    :clear-search-on-select="false"
                    :close-on-select="false"
                >
                    <template #option="option">
                        <code class="me-2">{{ option.key }}</code>
                        <span class="me-2">{{ option.name }}</span>
                        <code class="text-muted" v-if="option.projectKeys.filter(k => k !== option.key).length">({{ option.projectKeys.filter(k => k !== option.key).join(', ') }})</code>
                    </template>
                </v-select>
            </div>
            <div class="col-auto">
                <button type="button" @click="confirmRemoval(index)" class="btn btn-sm btn-outline-danger" title="Remove entry"><i class="bi-trash"></i></button>
            </div>
        </div>
        <div class="mt-3">
            <button type="button" @click="addNew" class="btn btn-primary w-100">Add new mapping</button>
        </div>
        <div class="mt-3">
            <button type="button" @click="exportToClipboard($event)" class="btn btn-outline-secondary">
                Export <i class="ms-1 bi" :class="justExported ? 'bi-check' : 'bi-clipboard'"></i>
            </button>
            <button type="button" @click="importPrompt" class="btn btn-outline-secondary">
                Import <i class="ms-1 bi bi-box-arrow-in-down"></i>
            </button>
        </div>
    </div>
</template>

<script>
export default {
    name: 'ProjectMapper',
    props: {
        value: {
            type: Array,
            required: true,
        },
        simplicateProjects: {
            type: Array,
            required: true,
        },
        jiraProjects: {
            type: Array,
            required: true,
        },
    },
    data () {
        return {
            justExported: false,
        };
    },
    methods: {
        // TODO: stop modifying value prop directly
        addNew () {
            this.value.push([[],[]]);
            this.$nextTick(() => {
                const [newSimplicateProjectSelect] = this.$refs.simplicateProjectSelect?.slice(-1) || [];
                newSimplicateProjectSelect?.$refs.search?.focus();
            });
            this.emitInput();
        },
        onSimplicateInput (index, projects) {
            this.value[index].splice(0, 1, projects);
        },
        onJiraInput (index, projects) {
            this.value[index].splice(1, 1, projects);
        },
        selectableCb (selected) {
            return option => { return !selected.includes(option.id); };
        },
        confirmRemoval (index) {
            const [s, j] = this.value[index];
            if ((s.length || j.length) && !confirm('Are you sure?')) {
                return;
            }
            this.value.splice(index, 1);
            this.emitInput();
        },
        exportToClipboard (event) {
            navigator.clipboard
                .writeText(JSON.stringify(this.value))
                .then(() => {
                    this.justExported = true;
                    event.target.blur();
                    setTimeout(() => this.justExported = false, 5000);
                });
        },
        importPrompt () {
            const json = window.prompt('Paste your mapping JSON here...', '[]');
            if (json === null) {
                return; // prompt canceled
            }
            let imported;
            try {
                imported = JSON.parse(json);
                if (!Array.isArray(imported)) {
                    throw new Error('Invalid mapping; not an array');
                }
                // Some basic validation
                const isString = (value) => typeof value === 'string';
                imported.forEach((mapping, index) => {
                    if (!Array.isArray(mapping) || mapping.length !== 2 || !Array.isArray(mapping[0]) || !Array.isArray(mapping[1]) || !mapping[0].every(isString) || !mapping[1].every(isString)) {
                        throw new Error('Invalid mapping at index ' + index);
                    }
                });
            } catch (e) {
                console.error(e);
                window.alert('Could not parse or import mapping');
                return;
            }
            if (this.value.length && !window.confirm(`Are you sure you want to ${imported.length ? 'overwrite' : 'clear'} the existing mapping?`)) {
                return;
            }
            this.value = imported;
            this.emitInput();
        },
        emitInput () {
            this.$emit('input', this.value);
        }
    },
}
</script>
