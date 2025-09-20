import { createStore } from 'vuex'

export default createStore({
  state: () => ({
    /** @type {{ file_id: String, file_name: String, mime_type: String, uploaded_datetime: String, title: String, cercle_id: String, category_id: String, data: String }[]} コンテンツ情報 */
    files: [],
    /** @type {{ cercle_id: String, name: String, author: String, twitter_link: String, melonbooks_link: String }[]} サークル情報 */
    cercles: [],
    /** @type {{ category_id: String, name: String }[]} カテゴリ情報 */
    categories: [],
    /** @type { Boolean } 管理者（コンテンツ削除などが可能）かどうか */
    hasPermission: false,
  }),
  getters: {
    getFiles: (state) => state.files,
    getCercles: (state) => state.cercles,
    getCategories: (state) => state.categories,
    checkPermission: (state) => state.hasPermission,
  },
  mutations: {
    setFiles(state, data) {
      state.files = data;
    },
    setCercles(state, data) {
      state.cercles = data;
    },
    updateCercle(state, data) {
      const index = state.cercles.findIndex((c) => c.cercle_id === data.cercle_id);
      if (index === -1) return;
      Object.assign(state.cercles[index], data);
    },
    setCategories(state, data) {
      state.categories = data;
    },
    setPermission(state, flag) {
      state.hasPermission = flag;
    },
  },
  actions: {
  },
  modules: {
  }
})
