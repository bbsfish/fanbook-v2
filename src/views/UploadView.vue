<template>
  <div class="upload-view">
    <h2>Uploader</h2>
    <form @submit.prevent="handleUpload">
      <div class="camera-container">
        <div v-if="capturedImage" class="preview-active">
          <p>プレビュー:</p>
          <img :src="capturedImage" alt="Captured preview" class="preview-image">
          <div class="button-group">
            <button type="button" @click="retakePhoto" class="action-button">🔄 再撮影</button>
            <button type="button" @click="selectFromFile" class="action-button">📁 ファイルから選択</button>
          </div>
        </div>

        <div v-else-if="isCameraOpen" class="camera-active">
          <video ref="videoPlayer" class="video-preview" autoplay playsinline></video>
          <div class="button-group">
            <button type="button" @click="capturePhoto" class="action-button capture-button">⚪️ 撮影</button>
            <button type="button" @click="stopCameraStream" class="action-button secondary">閉じる</button>
          </div>
        </div>
        
        <div v-else class="camera-idle">
          <p v-if="selectedFile" class="selected-file-name">選択中のファイル: {{ selectedFileName }}</p>
          <p v-else class="input-placeholder">画像をアップロードしてください</p>
          <div class="button-group">
            <button type="button" @click="openCamera" class="action-button">📷 カメラを起動</button>
            <button type="button" @click="triggerFileInput" class="action-button">📁 ファイルを選択</button>
          </div>
        </div>
      </div>

      <input type="file" ref="fileInput" @change="handleFileChange" accept="image/*" style="display: none;">

      <div class="meta-wrapper" v-if="capturedImage || selectedFile">
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

      <button type="submit" :disabled="isLoading || !isInputOk" v-if="capturedImage || selectedFile">
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
      
      // selectedFileとselectedFileNameは、撮影/ファイル選択で共有
      selectedFile: null,
      selectedFileName: '', 
      
      isLoading: false,
      uploadedFileId: null,
      errorMessage: null,
      
      isCameraOpen: false, 
      stream: null,         
      capturedImage: null,  // 撮影した画像のDataURL
    };
  },
  computed: {
    cercles: function() {
      return this.$store.getters.getCercles;
    },
    categories: function() {
      return this.$store.getters.getCategories;
    },
    isInputOk: function() {
      if (this.vmTitle === '') return false;
      if (this.vmCategory === '') return false;
      if (this.vmCategory === 'new' && this.vmNewCategory === '') return false;
      if (this.vmCercle === '') return false;
      if (this.vmCercle === 'new' && this.vmNewCercle === '') return false;
      if (!this.selectedFile) return false; // 撮影済みか、ファイル選択済みか
      return true;
    },
  },
  methods: {
    // ファイル選択のトリガー
    triggerFileInput() {
      this.stopCameraStream(); // カメラが起動していたら停止
      this.capturedImage = null; // 撮影済み画像があればリセット
      this.selectedFile = null;
      this.selectedFileName = '';
      this.$refs.fileInput.click();
    },
    
    // ファイル選択時の処理 (input[type="file"]のchangeイベント)
    async handleFileChange(event) {
      const file = event.target.files[0];
      if (file) {
        this.selectedFile = file;
        this.selectedFileName = file.name;
        this.uploadedFileId = null;
        this.errorMessage = null;

        // プレビュー用に画像を読み込み、必要ならトリミング
        const reader = new FileReader();
        reader.onload = async (e) => {
          this.capturedImage = await this.processImageForPreview(e.target.result);
        };
        reader.readAsDataURL(file);
      }
      // 同じファイルを選択できるようにinputの値をリセット
      event.target.value = '';
    },
    
    // ファイル選択ボタンからカメラ起動時への切り替え
    selectFromFile() {
      this.triggerFileInput();
    },

    // カメラの起動
    async openCamera() {
      this.stopCameraStream(); // 念のため既存のストリームを停止
      this.capturedImage = null; // 撮影済み画像があればリセット
      this.selectedFile = null;
      this.selectedFileName = '';
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }, 
          audio: false,
        });
        this.isCameraOpen = true;

        this.$nextTick(() => {
          this.$refs.videoPlayer.srcObject = this.stream;
          // iOS Safariで自動再生されない場合の対策
          this.$refs.videoPlayer.play().catch(e => console.error("Video play failed:", e));
        });
      } catch (error) {
        this.errorMessage = 'カメラの起動に失敗しました。アクセスを許可してください。';
        console.error('getUserMedia error:', error);
      }
    },
    
    // カメラの停止
    stopCameraStream() {
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
      }
      this.isCameraOpen = false;
      this.stream = null;
    },

    // 写真撮影
    async capturePhoto() {
      const video = this.$refs.videoPlayer;
      if (!video) return;

      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;

      // 3:4の比率でトリミングする領域を計算
      const targetRatio = 3 / 4; // width / height
      let sourceX = 0, sourceY = 0, sourceWidth = videoWidth, sourceHeight = videoHeight;

      if (videoWidth / videoHeight > targetRatio) {
        // 映像が横長すぎる場合、左右をトリミング
        sourceHeight = videoHeight;
        sourceWidth = videoHeight * targetRatio;
        sourceX = (videoWidth - sourceWidth) / 2;
      } else {
        // 映像が縦長すぎる場合、上下をトリミング
        sourceWidth = videoWidth;
        sourceHeight = videoWidth / targetRatio;
        sourceY = (videoHeight - sourceHeight) / 2;
      }

      const canvas = document.createElement('canvas');
      canvas.width = sourceWidth;  // トリミング後の幅
      canvas.height = sourceHeight; // トリミング後の高さ
      const context = canvas.getContext('2d');
      
      // 元の映像から計算した領域をcanvas全体に描画
      context.drawImage(video, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);

      // canvasからPNG形式のDataURLを生成
      this.capturedImage = canvas.toDataURL('image/png');
      
      // DataURLをFileオブジェクトに変換してアップロード用に保持
      const fileName = `photo_${Date.now()}.png`;
      this.selectedFile = this.dataURLtoFile(this.capturedImage, fileName);
      this.selectedFileName = fileName;

      this.stopCameraStream(); // カメラを停止
    },

    // 再撮影
    retakePhoto() {
      this.capturedImage = null;
      this.selectedFile = null;
      this.selectedFileName = '';
      this.openCamera(); // 再びカメラを起動
    },
    
    // DataURLをFileオブジェクトに変換するヘルパー関数
    dataURLtoFile(dataurl, filename) {
        const arr = dataurl.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, { type: mime });
    },

    // アップロード処理 (変更なし)
    async handleUpload() {
      if (!this.selectedFile) return;

      this.isLoading = true;
      this.errorMessage = null;
      
      try {
        const base64Data = await this.fileToBase64(this.selectedFile);
        
        const payload = {
          file_name: this.selectedFile.name,
          mime_type: this.selectedFile.type,
          image: base64Data.split(',')[1],
          title: this.vmTitle,
          cercle_id: this.vmCercle,
          new_cercle_name: this.vmNewCercle,
          category_id: this.vmCategory,
          new_category_name: this.vmNewCategory,
        };

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
        this.selectedFileName = '';
        this.capturedImage = null; // リセット
      } catch (error) {
        this.errorMessage = error.message;
        console.error('Upload failed:', error);
      } finally {
        this.isLoading = false;
      }
    },

    // FileオブジェクトをBase64文字列に変換するヘルパーメソッド (変更なし)
    fileToBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
      });
    },

    // ファイル選択で読み込んだ画像を3:4にトリミングしてDataURLを返す
    processImageForPreview(dataUrl) {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const originalWidth = img.width;
          const originalHeight = img.height;

          const targetRatio = 3 / 4; // width / height
          let sourceX = 0, sourceY = 0, sourceWidth = originalWidth, sourceHeight = originalHeight;

          if (originalWidth / originalHeight > targetRatio) {
            // 元画像が横長すぎる場合、左右をトリミング
            sourceHeight = originalHeight;
            sourceWidth = originalHeight * targetRatio;
            sourceX = (originalWidth - sourceWidth) / 2;
          } else {
            // 元画像が縦長すぎる場合、上下をトリミング
            sourceWidth = originalWidth;
            sourceHeight = originalWidth / targetRatio;
            sourceY = (originalHeight - sourceHeight) / 2;
          }

          const canvas = document.createElement('canvas');
          canvas.width = sourceWidth;
          canvas.height = sourceHeight;
          const context = canvas.getContext('2d');
          context.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/png'));
        };
        img.src = dataUrl;
      });
    }
  },

  beforeUnmount() {
    this.stopCameraStream();
  }
};
</script>

<style lang="scss" scoped>
/* ...既存のスタイル... */
.upload-view { max-width: 500px; margin: 2rem auto; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); font-family: sans-serif; text-align: center; }
h2 { color: #2c3e50; }
form { display: flex; flex-direction: column; gap: 1.5rem; }
.meta-wrapper { display: flex; flex-direction: column; label { display: block; margin: 0.5rem 0; span { display: block; } input, select { width: 100%; padding: 0.1rem 0.2rem; } } }
button { padding: 0.8rem 1.5rem; border: none; background-color: #42b983; color: white; border-radius: 8px; font-size: 1rem; cursor: pointer; transition: background-color 0.3s; &:disabled { background-color: #ccc; cursor: not-allowed; } &:not(:disabled):hover { background-color: #36a473; } }
.result { margin-top: 1.5rem; padding: 1rem; border-radius: 8px; word-break: break-all; &.success { background-color: #e8f5e9; border: 1px solid #c8e6c9; } &.error { background-color: #ffebee; border: 1px solid #ffcdd2; color: #c62828; } }

/* カメラ・ファイル選択用のスタイル */
.camera-container {
  border: 2px dashed #ccc;
  border-radius: 8px;
  padding: 1rem;
  background-color: #f9f9f9;
  min-height: 250px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 1rem;
}

.video-preview, .preview-image {
  max-width: 100%;
  max-height: 300px; /* プレビューの最大高さを設定 */
  border-radius: 6px;
  border: 1px solid #ddd;
  object-fit: contain; /* 映像/画像がトリミングされるが、枠には収まるように */
  background-color: black; /* レターボックス/ピラーボックス対策 */
}

/* ビデオプレビューで3:4に近づけるためのスタイル。実際にトリミングされるのは撮影時。 */
.video-preview {
    aspect-ratio: 3 / 4; /* カメラ起動中のプレビューを3:4に近づける */
    object-fit: cover; /* プレビューを枠に合わせて拡大表示（一部がはみ出る） */
}

.preview-active, .camera-active, .camera-idle {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.button-group {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap; /* ボタンが多すぎるときに折り返す */
}

.action-button {
  background-color: #f0f0f0;
  color: #333;
  border: 1px solid #ccc;
  flex: 1; /* グループ内のボタンを均等幅に */
  min-width: 120px; /* 小さくなりすぎないように */
  &:hover { background-color: #e0e0e0; }
  &.capture-button {
    background-color: #ff4d4d;
    color: white;
    border: 2px solid white;
    border-radius: 50%;
    width: 60px;
    height: 60px;
    padding: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    flex: none; /* captureボタンは固定サイズ */
    &:hover { background-color: #e60000; }
  }
  &.secondary {
    background-color: transparent;
    border: none;
    color: #666;
    &:hover { text-decoration: underline; }
  }
}
.input-placeholder, .selected-file-name {
  margin: 0;
  font-size: 0.9rem;
  color: #666;
  min-height: 1.2em;
}

.selected-file-name {
  color: #2c3e50;
  font-weight: bold;
}
</style>