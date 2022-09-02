<template>
  <div>
    <!-- 上传成功图片列表 状态为待补拍和审核通过都现实为审核通过 -->
    <kf-draggable v-model="pictureList">
      <template v-for="(picture, index) in pictureList">
        <div class="picture-item-list-item" :key="index">
          <el-image
            class="picture"
            :src="handleRenderImage(picture)"
            :z-index="9999"
            :preview-src-list="previewList"
            alt="loading"
          >
            <div slot="placeholder" class="image-slot">
              <i class="el-icon-loading"></i>
            </div>
          </el-image>
          <el-checkbox
            class="check-box"
            v-if="picture.type === 'NEW'"
            :value="picture.checked"
            @change="(checked) => handleSelectPicture(picture, checked)"
          ></el-checkbox>
          <div class="video-warp" v-if="picture.videoImageUrl">
            <i class="iconfont iconzanting" @click="openVideo(picture)"></i>
          </div>

          <el-select
            v-if="imageTypeList.length"
            class="picture-item-list-select"
            placeholder="请选择类型"
            size="mini"
            clearable
            v-model="picture.labelId"
            @change="(event) => handleChangeType(event)"
            :disabled="getNoOperateStatus(picture)"
          >
            <el-option
              v-for="item in imageTypeList"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            ></el-option>
          </el-select>
        </div>
      </template>
    </kf-draggable>

    <!-- 播放视频 -->
    <kf-video-player
      class="kf-video-player-upload"
      :visible.sync="videoVisible"
      :autoplay="true"
      width="267px"
      height="477px"
      :video-url="videoUrl"
    />
  </div>
</template>

<script lang="ts">
import { Vue, Prop, Component, PropSync } from 'vue-property-decorator'
import type { UplaodInformation, UplaodInformationType } from './type'
const COMPONENT_NAME = 'Draggable'
@Component({
  name: COMPONENT_NAME,
  components: {
    KfVideoPlayer: () =>
      import('kfang-saas-common').then((mod) => mod.KfVideoPlayer),
    KfDraggable: () =>
      import('kfang-saas-common').then((mod) => mod.KfDraggable),
  },
})
export default class extends Vue {
  @Prop({
    required: false,
    type: Array,
    default: () => {
      return []
    },
  })
  pictureList!: Array<UplaodInformation>
  @Prop({
    required: false,
    type: Array,
    default: () => {
      return []
    },
  })
  imageTypeList!: Array<UplaodInformationType> // 图片类型下拉List

  @PropSync('checkedPictureIds', { type: Array }) syncCheckedPictureIds!: Array<
    string
  > // 用来实现组件的双向绑定

  @PropSync('selectAll', { type: Boolean }) syncSelectAll!: boolean // 用来实现组件的双向绑定
  private videoVisible = false
  private videoUrl = ''

  //根据图片是否审核，要不要加后缀
  handleRenderImage(item: UplaodInformation) {
    const url = item.tag ? item.videoImageUrl : item.url
    return item.isTransfer ? `${url}-p800x600` : url
  }
  // 预览图片(放大图片)
  get previewList() {
    const array = this.pictureList.map((item: UplaodInformation) => {
      return this.handleRenderImage(item)
    })
    return array
  }

  // 获取有操作权限的图片
  get hasOptionPictureList() {
    return this.pictureList.filter(
      (item: Record<string, any>) =>
        !['PASS', 'AUDITING'].includes(item.auditStatus) ||
        !item.isTransfer ||
        item.type === 'NEW',
    )
  }

  //播放视频
  openVideo(res: UplaodInformation) {
    if (res.tag && res.url) {
      this.videoUrl = res.url
      this.videoVisible = true
    }
  }

  // 勾选单张图片
  async handleSelectPicture(item: UplaodInformation, checked: boolean) {
    item.checked = checked
    if (checked) {
      this.syncCheckedPictureIds.push(item.uid)
      this.checkedPictureIds.length === this.hasOptionPictureList.length &&
        (this.syncSelectAll = true)
    } else {
      const index = this.checkedPictureIds.findIndex(
        (uid: string) => uid === item.uid,
      )
      index > -1 && this.syncCheckedPictureIds.splice(index, 1)
      this.syncSelectAll = false
    }
  }

  // 批量选择设置图片类型
  handleChangeType(value: string) {
    if (this.checkedPictureIds.length) {
      for (let i = 0; i < this.checkedPictureIds.length; i++) {
        const id = this.checkedPictureIds[i]
        const idx = this.hasOptionPictureList.findIndex(
          (list: UplaodInformation) => list.uid === id,
        )
        if (idx > -1) {
          this.hasOptionPictureList[idx].labelId = value
          this.hasOptionPictureList[idx].checked = false
        }
        this.syncCheckedPictureIds = []
        this.syncSelectAll = false
      }
    }
    this.$emit('update', this.hasOptionPictureList)
  }
}
</script>
<style scoped lang="scss">
.video-warp {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  top: 0;
  background-color: #0c0c0c;
  opacity: 0.3;
  color: black;
  display: flex;
  justify-content: center;
  .iconzanting {
    font-size: 30px;
    align-self: center;
    cursor: pointer;
    background: #ffff;
  }
}
.image-slot {
  font-size: 12px;
}

.picture-item-upload-box {
  .upload-box {
    width: 130px;
    height: 130px;
    margin-right: 6px;
    text-align: center;
  }
  .draggable-content-wrap {
    flex: 1;
  }

  .picture-item-list-item {
    position: relative;
    margin: 0 6px 15px 0;
    position: relative;
    flex: 0 0 136px;
    margin: 0 15px 15px 0;
    font-size: 0;
    .check-box {
      position: absolute;
      top: 5px;
      left: 10px;
    }
    .picture {
      width: 100%;
      height: 100%;
      object-fit: cover;
      min-height: 100px;
    }

    .picture-item-list-item-down {
      display: flex;
      .el-select.el-select--small {
        ::v-deep .el-input__inner {
          height: 30px;
          line-height: 30px;
          border: none;
        }
      }
      .delete-btn {
        width: 60px;
        height: 30px;
        line-height: 28px;
        font-size: 12px;
        text-align: center;
        color: #1baef1;
        border-left: 1px solid #eee;
      }
      .input-box {
        ::v-deep .el-input__inner {
          border: none;
        }
      }
    }
  }
}

.image-slot {
  display: flex;
  justify-content: center;
  width: 100%;
  height: 100%;
  .el-icon-loading {
    font-size: 22px;
    align-self: center;
  }
}
</style>
