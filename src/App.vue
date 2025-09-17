<template>
  <header>
    <AppHeader />
  </header>
  <main ref="top">
    <router-view />
  </main>
  <footer>
    <AppFooter />
  </footer>
  <div class="loading-spinner-wrap" v-if="isPreLoading">
    <LoadingSpinner />
  </div>
</template>

<script>
import AppHeader from '@/components/AppHeader.vue';
import AppFooter from '@/components/AppFooter.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import api from '@/lib/api.js';

export default {
  name: 'App',
  components: {
    AppHeader,
    AppFooter,
    LoadingSpinner,
  },
  data() {
    return {
      prevPageName: 'Index', // 前回ページの名前
      isTopButtonVisible: false, // トップへ戻るボタンの表示設定
      lastScrollY: 0, // 前回のスクロール位置
      isPreLoading: true,
    };
  },
  methods: {
    handleScroll() {
      const currentScrollY = window.scrollY;

      if (currentScrollY <= 100) {
        // ページ上部では常に非表示
        this.isTopButtonVisible = false;
      } else if (currentScrollY < this.lastScrollY) {
        // スクロールアップした場合
        this.isTopButtonVisible = true;
      } else {
        // スクロールダウンした場合
        this.isTopButtonVisible = false;
        // hash に #top がある場合それを除去
        if (this.$route.hash === '#top') {
          this.$router.push({ hash: '' });
        }
      }
      this.lastScrollY = currentScrollY;
    },
    goPageTop() {
      this.$refs.top.scrollIntoView({
        behavior: 'smooth',
      });
    },
  },
  watch: {
    $route(to) {
      if (to.name !== this.prevPageName) {
        this.$refs.top.scrollIntoView({
          behavior: 'smooth',
        });
        this.prevPageName = to.name;
      }
      if (to.hash === '#top') {
        this.$refs.top.scrollIntoView({
          behavior: 'smooth',
        });
      }
    },
  },
  async mounted() {
    window.addEventListener('scroll', this.handleScroll);
    // files, cercles, categories のフェッチ
    try {
      const filesResult = await api.get(`${api.LIST}?scope=file`);
      const cerclesResult = await api.get(`${api.LIST}?scope=cercle`);
      const categoriesResult = await api.get(`${api.LIST}?scope=category`);
      this.$store.commit('setFiles', filesResult.data);
      this.$store.commit('setCercles', cerclesResult.data);
      this.$store.commit('setCategories', categoriesResult.data);
    } catch (error) {
      console.error(error.message || 'Unknown error occurred.');
    } finally {
      this.isPreLoading = false;
    }

    try {
      const files = this.$store.getters.getFiles;
      files.forEach(async (f, i) => {
        files[i].data = await api.getText(`${api.IMAGE_DELIVERY}?id=${f.file_id}`);
      });
      this.$store.commit('setFiles', files);
    } catch (error) {
      console.error(error.message || 'Unknown error occurred.');
    } finally {
      this.$store.commit('setImageDataInsert', true);
    }
  },
  beforeUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
  },
};
</script>

<style lang="scss">
@use '@/styles/variables.scss' as var;

*,
*::before,
*::after {
  zoom: 1;
  box-sizing: border-box;
}
html, body {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #333;
  padding: 0;
  margin: 0;
  height: 100%;
  scroll-behavior: smooth;
  font-size: 16px;
}
#app {
  display: flex;
  flex-direction: column; // 子要素を縦に並べる
  min-height: 100vh; // コンテナの高さを最低でも画面の高さにする
}
main {
  margin-top: 60px;
  padding: 0 1rem;
}
footer {
  flex-grow: 1; 
  background-color: #00aeff;
  padding: 1rem;
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.1);
  margin-top: 1rem;
}
.go-top-button {
  position: fixed;
  width: 5rem;
  height: 4rem;
  right: 1rem;
  bottom: 1rem;
  background-color: white;
  opacity: 0.6;
  &:hover {
    cursor: pointer;
    transform: scale(1.1);
    opacity: 1;
  }
  @include var.mq('tab') {
    right: 3rem;
    bottom: 6rem;
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
