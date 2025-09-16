<template>
  <div class="login-view">
    <h2>Login</h2>
    <form @submit.prevent="handleUpload">
			<div class="input-wrap">
				<label>
					<span>パスワードを更新する</span>
					<input type="checkbox" v-model="vmPassUpdate" />
				</label>
				<label>
					<span>パスワード</span>
					<input type="password" v-model="vmPassword" />
				</label>
				<label v-if="vmPassUpdate">
					<span>新しいパスワード</span>
					<input type="password" v-model="vmNewPassword" />
				</label>
			</div>
			<button type="submit" :disabled="isLoading || !isInputOk">
				<span v-if="isLoading">Loading...</span>
				<span v-else>ログイン</span>
			</button>
		</form>
    <LoadingSpinner v-if="isLoading" />
		<div v-if="isAuthorized" class="result success">
      <p>✅ Login Successful!</p>
    </div>
    <div v-if="errorMessage" class="result error">
      <p>❌ Error: {{ errorMessage }}</p>
    </div>
	</div>
</template>

<script>
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import api from '@/lib/api.js';

export default {
	name: 'LoginView',
	components: {
    LoadingSpinner,
  },
	data() {
    return {
			vmPassword: '',
			vmNewPassword: '',
			vmPassUpdate: false,
      isLoading: false,
			isAuthorized: false,
      errorMessage: null,
    };
  },
	computed: {
		isInputOk: function() {
			if (this.vmPassword === '') return false;
			if (this.vmPassUpdate && this.vmNewPassword === '') return false;
			return true;
		},
	},
	methods: {
		async handleUpload() {
      this.isLoading = true;
      this.errorMessage = null;

      try {
        // パスワードをSHA256でハッシュ化
				const payload = {};
        payload.passwd = await this.sha256(this.vmPassword);
				if (this.vmPassUpdate) {
					payload.update = await this.sha256(this.vmNewPassword);
				}

        // Fetch APIでGASにPOSTリクエストを送信
        const result = await api.post(api.AUTHORIZE_USER, payload);
				if (result.status === 'success') {
					this.isAuthorized = true;
					this.$store.commit('setPermission', true);
				} else {
					throw new Error(result.message);
				}
      } catch (error) {
        this.errorMessage = error.message;
        console.error('Auth failed:', error);
      } finally {
        this.isLoading = false;
        this.vmPassword = '';
        this.vmNewPassword = '';
        this.vmPassUpdate = false;
      }
    },
		async sha256(text) {
			const uint8  = new TextEncoder().encode(text);
			const digest = await crypto.subtle.digest('SHA-256', uint8);
			return Array.from(new Uint8Array(digest)).map(v => v.toString(16).padStart(2,'0')).join('');
		},
	},
}
</script>

<style lang="scss" scoped>
.login-view {
  max-width: 500px;
  margin: 2rem auto;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  font-family: sans-serif;
  text-align: center;
}

h2 {
  color: #2c3e50;
}

form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

input {
	width: 100%;
}

button {
  padding: 0.8rem 1.5rem;
  border: none;
  background-color: #42b983;
  color: white;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }

  &:not(:disabled):hover {
    background-color: #36a473;
  }
}

.result {
  margin-top: 1.5rem;
  padding: 1rem;
  border-radius: 8px;
  word-break: break-all;

  &.success {
    background-color: #e8f5e9;
    border: 1px solid #c8e6c9;
  }

  &.error {
    background-color: #ffebee;
    border: 1px solid #ffcdd2;
    color: #c62828;
  }
}
</style>
