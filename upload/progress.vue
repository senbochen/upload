<template>
  <div class="picture-item-upload-progress">
    <div v-for="item in uploadList" :key="item.uid">
      <el-progress
        v-if="!item.status"
        type="circle"
        class="upload-progress"
        :percentage="item.progress"
        :width="100"
        :color="colors"
      ></el-progress>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Prop, Component } from 'vue-property-decorator'
import type { UploadingType } from './type'
const COMPONENT_NAME = 'Progress'
@Component({
  name: COMPONENT_NAME,
})
export default class extends Vue {
  @Prop({
    required: false,
    type: Array,
    default: () => {
      return []
    },
  })
  uploadList!: Array<UploadingType> //正在上传中的list
  private colors = [{ color: '#1baef1' }] // 上传进度条颜色
}
</script>
<style scoped lang="scss">
.picture-item-upload-progress {
  width: 130px;
  height: 130px;
  margin: 0 6px 10px 0;
  border: 1px dashed #e5e5e5;
  display: flex;
  justify-content: center;
  align-items: center;
  .upload-progress {
    display: flex;
    align-self: center;
    justify-content: center;
  }
}
</style>
