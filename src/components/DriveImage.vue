<template>
  <img :src="imageData" />
</template>

<script>
import api from '@/lib/api.js';

export default {
  name: 'DriveImage',
  props: {
    fid: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      imageData: null,
    };
  },
  async mounted() {
    const result = await api.getText(`${api.IMAGE_DELIVERY}?id=${this.fid}`);
    this.imageData = result;
  },
};
</script>
