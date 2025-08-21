<template>
    <div class="container-fluid">
        <div class="row">
            <div v-if="!$root.isMobile" class="col-12 col-md-5 col-xl-4">
                <div>
                    <router-link to="/add" class="btn btn-primary mb-3"><font-awesome-icon icon="plus" /> {{ $t("Add New Monitor") }}</router-link>
                </div>

                <!-- Credit Balance Component -->
                <CreditBalance
                    :session-id="anonymousSessionId"
                    :user-id="userId"
                />

                <MonitorList :scrollbar="true" />
            </div>

            <div ref="container" class="col-12 col-md-7 col-xl-8 mb-3">
                <!-- Add :key to disable vue router re-use the same component -->
                <router-view :key="$route.fullPath" :calculatedHeight="height" />
            </div>
        </div>
    </div>
</template>

<script>

import MonitorList from "../components/MonitorList.vue";
import CreditBalance from "../components/CreditBalance.vue";

export default {
    components: {
        MonitorList,
        CreditBalance,
    },
    data() {
        return {
            height: 0,
            anonymousSessionId: null,
            userId: null
        };
    },
    mounted() {
        this.height = this.$refs.container.offsetHeight;
        this.initializeSession();
    },
    methods: {
        async initializeSession() {
            // Check if user is logged in
            if (this.$root.userID) {
                this.userId = this.$root.userID;
                return;
            }

            // Check for anonymous session
            const sessionId = localStorage.getItem('anonymous_session_id');
            if (sessionId) {
                this.anonymousSessionId = sessionId;
            } else {
                // Create new anonymous session
                await this.createAnonymousSession();
            }
        },

        async createAnonymousSession() {
            try {
                const response = await fetch('/api/anonymous-session', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });

                const data = await response.json();
                if (data.session_id) {
                    this.anonymousSessionId = data.session_id;
                    localStorage.setItem('anonymous_session_id', data.session_id);
                }
            } catch (error) {
                console.error('Failed to create anonymous session:', error);
            }
        }
    }
};
</script>

<style lang="scss" scoped>
.container-fluid {
    width: 98%;
}
</style>
