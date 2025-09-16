<template>
  <div class="cercles-view">
    <p class="edit-toggle-button">編集ボタンを表示する:<ToggleButton @on="isEditButtonView = true" @off="isEditButtonView = false" /></p>
    <table>
      <tbody>
        <tr>
          <th>サークル名</th><th>著者名</th><th>Twitter</th><th>Melonbooks</th><th v-if="isEditButtonView">編集</th>
        </tr>
        <tr v-for="(c, i) of cercles" :key="i">
          <td>
						<input type="text" v-if="inEditorMode === i" :value="c.name" @input="onNameChanged" />
						<span v-else>{{ c.name }}</span>
					</td>
          <td>
						<input type="text" v-if="inEditorMode === i" :value="c.author" @input="onAuthorChanged" />
						<span v-else>{{ (c.author === '') ? '-' : c.author }}</span>
					</td>
          <td>
						<input type="text" v-if="inEditorMode === i" :value="c.twitter_link" @input="onTwChanged" />
						<div v-else>
							<span v-if="c.twitter_link === ''">-</span>
							<a target="_blank" v-if="c.twitter_link !== ''" :href="c.twitter_link">Twitter</a>
						</div>
					</td>
          <td>
						<input type="text" v-if="inEditorMode === i" :value="c.melonbooks_link" @input="onMbChanged" />
						<div v-else>
							<span v-if="c.melonbooks_link === ''">-</span>
							<a target="_blank" v-else :href="c.melonbooks_link">Melonbooks</a>
						</div>
					</td>
          <td>
						<button class="button-save" v-if="isEditButtonView && inEditorMode === i" @click="onSave">保存</button>
						<button class="button-cancel" v-if="isEditButtonView && inEditorMode === i" @click="onCancel">キャンセル</button>
						<button class="button-edit" v-if="isEditButtonView && inEditorMode !== i" @click="inEditorMode = i">編集</button>
					</td>
        </tr>
      </tbody>
    </table>
		<div class="loading-spinner-wrap" v-if="isLoading">
			<LoadingSpinner />
		</div>
  </div>
</template>

<script>
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import ToggleButton from '@/components/ToggleButton.vue';
import api from '@/lib/api.js';

export default {
  name: "CerclesView",
	components: {
		LoadingSpinner,
		ToggleButton,
	},
	data() {
		return {
			isEditButtonView: false,
			inEditorMode: -1,
			currentValues: {
				name: '',
				author: '',
				twLink: '',
				mbLink: '',
			},
      isLoading: false,
		};
	},
  computed: {
    cercles: function () {
      return this.$store.getters.getCercles;
    },
  },
	methods: {
		async onSave() {
			this.isLoading = true;
			try {
				const cId = this.cercles[this.inEditorMode].cercle_id;
				const {
					name,	author,	twLink,	mbLink,
				} = this.currentValues;
				const result = await api.post(api.UPDATE_CERCLES, {
					cercle_id: cId,
					twitter_link: twLink,
					melonbooks_link: mbLink,
					name,
					author,
				});
				this.$store.commit('updateCercle', result);
			} catch (error) {
				console.error(error);
			} finally {
				this.currentValues.name = '';
				this.currentValues.author = '';
				this.currentValues.twLink = '';
				this.currentValues.mbLink = '';
				this.inEditorMode = -1;
				this.isLoading = false;
			}
		},
		onCancel() {
			this.currentValues.name = '';
			this.currentValues.author = '';
			this.currentValues.twLink = '';
			this.currentValues.mbLink = '';
			this.inEditorMode = -1;
		},
		onNameChanged(e) {
			this.currentValues.name = e.target.value;
		},
		onAuthorChanged(e) {
			this.currentValues.author = e.target.value;
		},
		onTwChanged(e) {
			this.currentValues.twLink = e.target.value;
		},
		onMbChanged(e) {
			this.currentValues.mbLink = e.target.value;
		},
	},
	watch: {
		inEditorMode(to) {
			if (to === -1) return;
			const target = this.cercles[to];
			this.currentValues.name = target.name;
			this.currentValues.author = target.author;
			this.currentValues.twLink = target.twitter_link;
			this.currentValues.mbLink = target.melonbooks_link;
		},
	},
};
</script>

<style lang="scss" scoped>
/* --- 変数定義 --- */
$primary: #42b983;      // メインカラー (Vueのグリーン)
$secondary: #6c757d;    // サブカラー (グレー)
$save-color: #3498db;   // 保存ボタンの色 (ブルー)
$cancel-color: #95a5a6; // キャンセルボタンの色 (アッシュ)
$edit-color: #f39c12;   // 編集ボタンの色 (オレンジ)

$light-gray: #f8f9fa;   // 明るいグレー (テーブルのストライプ用)
$border-color: #e9ecef; // 境界線の色
$text-color: #2c3e50;    // 基本の文字色
$white: #ffffff;        // 白色
$shadow-color: rgba(0, 0, 0, 0.08); // 影の色

/* --- 全体コンテナ --- */
.cercles-view {
  padding: 2rem;
  background: $white;
  border-radius: 12px;
  box-shadow: 0 6px 20px $shadow-color;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  color: $text-color;
  overflow-x: auto; // スマホ表示などでテーブルがはみ出た場合にスクロールさせる
}

/* --- 編集表示切り替え --- */
.edit-toggle-button {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  color: darken($secondary, 20%);
}

/* --- テーブル --- */
table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 1em;

  th,
  td {
    padding: 1rem 1.2rem;
    border-bottom: 1px solid $border-color;
    vertical-align: middle;
  }

  th {
    background-color: $light-gray;
    font-weight: 600;
  }

  tbody tr {
    transition: background-color 0.2s ease-in-out;

    &:nth-of-type(even) {
      background-color: $light-gray;
    }

    &:hover {
      background-color: lighten($primary, 42%);
    }

    &:last-of-type td {
      border-bottom: none;
    }
  }

  /* --- 編集中の入力フォーム --- */
  input[type="text"] {
    width: 100%;
    padding: 0.6rem 0.8rem;
    border: 1px solid $border-color;
    border-radius: 6px;
    font-size: inherit;
    transition: border-color 0.2s, box-shadow 0.2s;
    box-sizing: border-box;

    &:focus {
      outline: none;
      border-color: $primary;
      box-shadow: 0 0 0 3px lighten($primary, 35%);
    }
  }

  /* --- ボタン --- */
  td:last-child {
    // 編集ボタンのセルが複数にならないように調整
    white-space: nowrap;
  }

  button {
    padding: 0.6rem 1rem;
    border: none;
    border-radius: 6px;
    font-size: 0.9em;
    font-weight: 600;
    color: $white;
    cursor: pointer;
    transition: transform 0.1s ease, box-shadow 0.2s ease, background-color 0.2s;
    margin-right: 0.5rem;

    &:last-child {
      margin-right: 0;
    }

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }

    &:active {
      transform: translateY(0);
      box-shadow: none;
    }
  }

  .button-edit {
    background-color: $edit-color;
  }
  .button-save {
    background-color: $save-color;
  }
  .button-cancel {
    background-color: $cancel-color;
  }
}

.loading-spinner-wrap {
  position: fixed;
  background-color: rgba(255, 255, 255, 0.507);
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  .loading-spinner {
    position: relative;
    top: 45vh;
  }
}
</style>