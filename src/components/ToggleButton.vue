<template>
  <div class="toggle-container">
    <input type="checkbox" id="toggle-switch" v-model="vmCheckBox" />
    <label for="toggle-switch" class="toggle-label"></label>
  </div>
</template>

<script>
export default {
	name: 'ToggleButton',
	data() {
		return {
			vmCheckBox: false,
		};
	},
	watch: {
		async vmCheckBox(to) {
      // 権限を持っていて ON にした時
			if (to && this.$store.getters.checkPermission) this.$emit('on');
      // 権限を持っていないのに ON にした時
      else if (to) {
        this.$nextTick(() => {
          this.vmCheckBox = false;
        });
        await this.$dialog.alert('権限がありません。有効化するためにログインしてください。');
      }
      // それ以外の時
			else this.$emit('off');
		},
	},
};
</script>

<style lang="scss" scoped>
// 変数
$toggle-width: 60px;
$toggle-height: 30px;
$toggle-padding: 3px; // 内側の余白
$toggle-radius: 15px; // height / 2

$handle-size: $toggle-height - ($toggle-padding * 2); // 24px (30 - 3*2)
$handle-radius: 50%; // 円形

$color-on: #42b983; // ONの状態の色
$color-off: #ccc; // OFFの状態の色
$color-handle: #fff; // ハンドルの色

body {
  font-family: Arial, sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  margin: 0;
  background-color: #f0f0f0;
}

h1 {
  margin-bottom: 30px;
  color: #333;
}

p {
  margin-top: 30px;
  font-size: 1.1em;
  color: #555;
}

.toggle-container {
  /* トグルボタン全体を囲むコンテナ */
  display: inline-block; /* 必要であれば */
}

/* 実際のチェックボックスを隠す */
#toggle-switch {
  display: none;
}

/* トグルの見た目をカスタマイズするラベル */
.toggle-label {
  display: block;
  width: $toggle-width;
  height: $toggle-height;
  background-color: $color-off;
  border-radius: $toggle-radius;
  position: relative;
  cursor: pointer;
  transition: background-color 0.3s ease; /* 背景色の変化を滑らかに */
}

/* トグルの「つまみ」（ハンドル）部分 */
.toggle-label::before {
  content: "";
  position: absolute;
  top: $toggle-padding;
  left: $toggle-padding;
  width: $handle-size;
  height: $handle-size;
  background-color: $color-handle;
  border-radius: $handle-radius;
  transition: transform 0.3s ease; /* ハンドルの動きを滑らかに */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* チェックされた（ONの）状態 */
#toggle-switch:checked + .toggle-label {
  background-color: $color-on; /* ON時の背景色 */
}

/* チェックされた（ONの）状態でのハンドルの位置 */
#toggle-switch:checked + .toggle-label::before {
  transform: translateX(
    $toggle-width - $handle-size - ($toggle-padding * 2)
  ); /* 右端に移動 */
}
</style>