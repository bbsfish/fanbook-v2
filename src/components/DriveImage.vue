<template>
  <img :src="imgData" />
</template>

<script>
export default {
  name: 'DriveImage',
  props: {
    fid: {
      type: String,
      default: '',
    },
  },
  computed: {
    imgData: function() {
      const target = this.$store.getters.getFiles.find((f) => f.file_id === this.fid);
      return target.data;
    },
  },
};
</script>
