<template>
  <div class="index-view">
    <p class="delete-toggle-button">削除ボタンを表示する:<ToggleButton @on="isDeleteButtonView = true" @off="isDeleteButtonView = false" /></p>
    <div class="filters">
      <label>
        <span>サークル</span>
        <select v-model="vmCercleId" @change="sortFilesByCercle">
          <option value="all" selected>全て</option>
          <option v-for="(c, i) of cercles" :value="c.cercle_id" :key="i">{{ c.name }}</option>
        </select>
      </label>
      <label>
        <span>カテゴリ</span>
        <select v-model="vmCategoryId" @change="sortFilesByCategory">
          <option value="all" selected>全て</option>
          <option v-for="(a, i) of categories" :value="a.category_id" :key="i">{{ a.name }}</option>
        </select>
      </label>
    </div>
    <div class="gallery">
      <div class="image-wrap" v-for="(f, i) of sortedFiles" :key="i">
        <div class="image-placeholder">
          <DriveImage :fid="f.file_id" />
        </div>
        <p>{{ f.title }}</p>
        <button v-if="isDeleteButtonView" @click="removeFile(i)">削除</button>
      </div>
    </div>
  </div>
</template>

<script>
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import ToggleButton from '@/components/ToggleButton.vue';
import DriveImage from '@/components/DriveImage.vue';
import api from '@/lib/api.js';

export default {
  name: 'IndexView',
  components: {
    LoadingSpinner,
    ToggleButton,
    DriveImage,
  },
  data() {
    return {
      vmCercleId: 'all',
      vmCategoryId: 'all',
      sortedFiles: [],
      sortedFilesByCercle: [],
      sortedFilesByCategory: [],
      isSortedFilesUpdated: false,
      isFilesUpdated: false,
      isDeleteButtonView: false,
    };
  },
  computed: {
    cercles: function() {
      return this.$store.getters.getCercles;
    },
    categories: function() {
      return this.$store.getters.getCategories;
    },
    files: function() {
      return this.$store.getters.getFiles;
    },
  },
  mounted() {
    this.sortedFilesByCercle = this.files;
    this.sortedFilesByCategory = this.files;
    this.isSortedFilesUpdated = true;
    this.$store.watch(
      (state, getters) => getters.getFiles,
      (to) => {
        this.sortedFilesByCercle = to;
        this.sortedFilesByCategory = to;
        this.isSortedFilesUpdated = true;
      }
    );
  },
  methods: {
    async removeFile(index) {
      this.isLoading = true;
      const target = this.sortedFiles[index];
      const result = await api.post(api.REMOVE_CONTENT, { fileId: target.file_id });
      if (result.status === 'success') {
        const newFiles = this.files.filter((f) => f.file_id !== target.file_id);
        this.$store.commit('setFiles', newFiles);
        this.isFilesUpdated = true;
      } else {
        throw new Error(result.message || 'Unknown error occurred.');
      }
      this.isLoading = false;
    },
    sortFilesByCercle() {
      if (this.vmCercleId === 'all') this.sortedFilesByCercle = this.files;
      else this.sortedFilesByCercle = this.files.filter((f) => f.cercle_id === this.vmCercleId);
      this.isSortedFilesUpdated = true;
    },
    sortFilesByCategory() {
      if (this.vmCategoryId === 'all') this.sortedFilesByCategory = this.files;
      else this.sortedFilesByCategory = this.files.filter((f) => f.category_id === this.vmCategoryId);
      this.isSortedFilesUpdated = true;
    },
  },
  watch: {
    isSortedFilesUpdated(to) {
      if (to) {
        const fileIdsSortedByCercle = this.sortedFilesByCercle.map((f) => f.file_id);
        const and = this.sortedFilesByCategory.filter((f) => fileIdsSortedByCercle.includes(f.file_id));
        this.sortedFiles = and;
        this.isSortedFilesUpdated = false;
      }
    },
    isFilesUpdated(to) {
      if (to) {
        this.sortFilesByCercle();
        this.sortFilesByCategory();
        this.isSortedFilesUpdated = true;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.delete-toggle-button {
  display: flex;
}
.gallery {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  .image-wrap {
    .image-placeholder {
      width: 20rem;
      height: 25rem;
      background-image: linear-gradient(90deg, #fff 0%, #888 50%, #fff 100%);
      background-position: 0% 0%;
      background-size: 3000px 100%;
      animation: Grad 2.5s linear infinite;
      animation-delay:0.5s;
      img {
        width: 20rem;
        height: 25rem;
      }
    }
    p {
      display: block;
      width: 20rem;
      overflow: hidden;
    }
    button {
      margin-bottom: 1rem;
    }
  }
}

@keyframes Grad {
	0% {
		background-position: 0 0%;
	}
	100% {
		background-position: 3000px 0%;
	}
}

.filters {
  label {
    display: inline-block;
    margin-bottom: 1rem;
  }
}
</style>