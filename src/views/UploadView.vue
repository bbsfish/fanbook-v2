<template>
  <div class="upload-view">
    <h2>Uploader</h2>
    <form @submit.prevent="handleUpload">
      <div class="meta-wrapper">
        <label>
          <span>タイトル</span>
          <input type="text" required v-model="vmTitle" />
        </label>
        <label>
          <span>カテゴリ</span>
          <select required v-model="vmCategory">
            <option v-for="(a, i) of categories" :value="a.category_id" :key="i">{{ a.name }}</option>
            <option value="new">新しいカテゴリを入力</option>
          </select>
        </label>
        <label v-if="vmCategory === 'new'">
          <span>新しいカテゴリ</span>
          <input type="text" v-model="vmNewCategory" />
        </label>
        <label>
          <span>サークル</span>
          <select required v-model="vmCercle">
            <option v-for="(c, i) of cercles" :value="c.cercle_id" :key="i">{{ c.name }}</option>
            <option value="new">新しいサークルを入力</option>
          </select>
        </label>
        <label v-if="vmCercle === 'new'">
          <span>新しいサークル</span>
          <input type="text" v-model="vmNewCercle" />
        </label>
      </div>
      <div class="file-input-wrapper">
        <input 
          type="file" 
          @change="handleFileChange" 
          accept="image/*" 
          ref="fileInput"
          required
        />
        <label>{{ selectedFileName }}</label>
      </div>
      <div v-if="previewUrl" class="preview-wrapper">
        <p>プレビュー:</p>
        <img :src="previewUrl" alt="Image preview" class="preview-image">
      </div>
      <button type="submit" :disabled="isLoading || !isInputOk">
        <span v-if="isLoading">Uploading...</span>
        <span v-else>Upload</span>
      </button>
    </form>

    <LoadingSpinner v-if="isLoading" />

    <div v-if="uploadedFileId" class="result success">
      <p>✅ Upload Successful!</p>
      <DriveImage class="preview-image" :fid="uploadedFileId" />
    </div>

    <div v-if="errorMessage" class="result error">
      <p>❌ Error: {{ errorMessage }}</p>
    </div>
  </div>
</template>

<script>
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import DriveImage from '@/components/DriveImage.vue';
import api from '@/lib/api.js';

export default {
  name: 'UploadView',
  components: {
    LoadingSpinner,
    DriveImage,
  },
  data() {
    return {
      vmTitle: '',
      vmCercle: '',
      vmNewCercle: '',
      vmCategory: '',
      vmNewCategory: '',
      selectedFile: null,
      selectedFileName: 'Click to select an image',
      isLoading: false,
      uploadedFileId: null,
      errorMessage: null,
      previewUrl: null,
    };
  },
  computed: {
    /** @type {{ cercle_id: String, name: String }[]} */
    cercles: function() {
      return this.$store.getters.getCercles;
    },
    /** @type {{ category_id: String, name: String }[]} */
    categories: function() {
      return this.$store.getters.getCategories;
    },
    /** @type { Boolean } */
    isInputOk: function() {
      if (this.vmTitle === '') return false;
      if (this.vmCategory === '') return false;
      if (this.vmCategory === 'new' && this.vmNewCategory === '') return false;
      if (this.vmCercle === '') return false;
      if (this.vmCercle === 'new' && this.vmNewCercle === '') return false;
      if (!this.selectedFile) return false;
      return true;
    },
  },
  methods: {
    handleFileChange(event) {
      const file = event.target.files[0];
      if (file) {
        this.selectedFile = file;
        this.selectedFileName = file.name;
        this.uploadedFileId = null;
        this.errorMessage = null;
        this.previewUrl = URL.createObjectURL(file);
      }
    },
    async handleUpload() {
      if (!this.selectedFile) return;

      this.isLoading = true;
      this.errorMessage = null;
      this.previewUrl = null;

      try {
        // FileReaderを使ってファイルをBase64に変換
        const base64Data = await this.fileToBase64(this.selectedFile);
        
        const payload = {
          file_name: this.selectedFile.name,
          mime_type: this.selectedFile.type,
          // "data:image/png;base64," のようなプレフィックス部分を削除
          image: base64Data.split(',')[1],
          title: this.vmTitle,
          cercle_id: this.vmCercle,
          new_cercle_name: this.vmNewCercle,
          category_id: this.vmCategory,
          new_category_name: this.vmNewCategory,
        };

        // Fetch APIでGASにPOSTリクエストを送信
        const result = await api.post(api.IMAGE_UPLOADER, payload);
        this.uploadedFileId = result.file_id;
        if (result.is_new_cercle) {
          const cercles = this.cercles;
          cercles.push({ cercle_id: result.cercle_id, name: this.vmNewCercle });
          this.$store.commit('setCercles', cercles);
        }
        if (result.is_new_category) {
          const categories = this.categories;
          categories.push({ category_id: result.category_id, name: this.vmNewCategory });
          this.$store.commit('setCategories', categories);
        }
        this.vmTitle = '';
        this.vmCercle = '';
        this.vmNewCercle = '';
        this.vmCategory = '';
        this.vmNewCategory = '';
        this.selectedFile = null;
        this.selectedFileName = 'Click to select an image';
      } catch (error) {
        this.errorMessage = error.message;
        console.error('Upload failed:', error);
      } finally {
        this.isLoading = false;
      }
    },
    // ファイルをBase64文字列に変換するヘルパーメソッド
    fileToBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.upload-view {
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

.file-input-wrapper {
  position: relative;
  border: 2px dashed #ccc;
  border-radius: 8px;
  padding: 2rem;
  cursor: pointer;
  transition: border-color 0.3s;

  &:hover {
    border-color: #42b983;
  }

  input[type="file"] {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
  }
}

.meta-wrapper {
  display: flex;
  flex-direction: column;

  label {
    display: block;
    margin: 0.5rem 0;
    span {
      display: block;
    }
    input, select {
      width: 100%;
      padding: 0.1rem 0.2rem;
    }
  }
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
.preview-wrapper {
  margin-bottom: 1.5rem;
  text-align: center;
}
.preview-image {
  max-width: 100%;
  max-height: 250px;
  border-radius: 6px;
  border: 1px solid #ddd;
}
</style>