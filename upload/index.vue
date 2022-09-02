<template>
  <div class="picture-info">
    <div class="picture-item">
      <div style="display: flex; justify-content: space-between;">
        <p class="title-header-wrap">
          <span class="house-upload-title">{{ sourceData.name }}</span>
          <span class="picture-item-num">
            （拖动图片可调整位置，只能上传jpg/png/jpeg文件，且单张不超过20M
            /宽高要求尺寸需为1920x1440 当前共有{{ pictureList.length }}张 ）
          </span>
          <span
            v-if="showRemoveGardenBtn && operateType === 'add'"
            class="delete-garden-btn"
            @click="removeGarden"
          >
            不属于该小区
          </span>
        </p>
        <div
          class="picture-item-title"
          v-show="pictureList.length && sourceData.auditStatus !== 'PASS'"
        >
          <span class="select-all">
            <el-checkbox @change="handleSelectPictureAll" v-model="selectAll">
              全选
            </el-checkbox>
          </span>
          <span class="delete-btn" @click="handleDeletePicture">
            <i class="el-icon-delete"></i>
            删除
          </span>
        </div>
      </div>

      <div class="picture-item-upload-box">
        <div
          class="upload-container-wrap"
          v-if="sourceData.auditStatus !== 'PASS'"
        >
          <!-- 上传按钮 -->
          <el-upload
            action=""
            class="upload-box"
            accept=".png,.jpg,.jpeg,.mp4"
            :http-request="customizeUploadImgRequest"
            list-type="picture-card"
            :multiple="true"
            :headers="headers"
            :show-file-list="false"
            :before-upload="beforeUpload"
            :on-progress="onProgress"
            :on-success="handleUploadSuccess"
            :on-error="onError"
          >
            <div class="upload-wrapper">
              <i class="el-icon-plus"></i>
              <span>上传图片/视频</span>
            </div>
          </el-upload>

          <!-- 上传中列表  -->
          <k-progress
            :uploadList="uploadList"
            v-if="uploadList.length"
          ></k-progress>
        </div>

        <!-- 上传成功图片列表 状态为待补拍和审核通过都现实为审核通过 -->
        <k-draggable
          :pictureList="pictureList"
          :imageTypeList="imageTypeList"
          :checkedPictureIds.sync="checkedPictureIds"
          :selectAll.sync="selectAll"
        ></k-draggable>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { Component, Prop, Watch, Model } from 'vue-property-decorator'
import { mixins } from 'vue-class-component'
import { headers } from '@/utils/tools/index'
import UploadMixin from '@/utils/mixins/upload-mixin'
import type {
  FileType,
  UplaodInformationType,
  UploadingType,
  UplaodInformation,
} from './type'
const COMPONENT_NAME = 'Upload'

const LIMIT_IMAGE_SIZE = 20 * 1024 * 1024
const LIMIT_VIDEO_SIZE = 500 * 1024 * 1024
const EFFECTIVE_IMAGE_TYPE = ['image/png', 'image/jpeg', 'image/jpg']
const EFFECTIVE_VIDEO_TYPE = ['video/mp4']

@Component({
  name: COMPONENT_NAME,
  components: {
    KfDraggable: () =>
      import('kfang-saas-common').then((mod) => mod.KfDraggable),
    KfVideoPlayer: () =>
      import('kfang-saas-common').then((mod) => mod.KfVideoPlayer),
    KProgress: () => import('./progress.vue'),
    KDraggable: () => import('./draggable.vue'),
  },
})
export default class extends mixins(UploadMixin) {
  @Prop({
    required: false,
    type: Array,
    default: () => {
      return []
    },
  })
  imageTypeList!: Array<UplaodInformationType> // 图片类型下拉List

  @Prop({
    required: false,
    type: Array,
    default: () => {
      return []
    },
  })
  echoList!: Array<UplaodInformation> // <!--回显list -->

  @Prop({
    required: false,
    default: () => {
      return {}
    },
  })
  sourceData!: UplaodInformation
  @Prop({ required: false, default: true }) showRemoveGardenBtn!: boolean

  @Prop({ required: false, default: 'add' }) operateType!: string

  @Model('update', { type: Array }) readonly list!: Array<UplaodInformation>

  @Watch('pictureList')
  handleChangePictureList() {
    this.$emit('update', this.hasOptionPictureList)
  }

  @Watch('echoList', { immediate: true })
  handleChangeEchoList(newVal: UplaodInformation[]) {
    this.pictureList = newVal
  }

  private selectAll = false // 全选
  private checkedPictureIds: string[] = [] // 勾选中的图片id
  private uploadList: UploadingType[] = [] // 上传中的图片
  private pictureList: UplaodInformation[] = [] // 上传成功图片
  private headers = headers // 上传图片所带token

  // 获取有操作权限的图片
  get hasOptionPictureList() {
    return this.pictureList.filter(
      (item: Record<string, any>) =>
        !['PASS', 'AUDITING'].includes(item.auditStatus) ||
        !item.isTransfer ||
        item.type === 'NEW',
    )
  }

  //通过创建临时文件流来获取图片的宽度和高度及宽高比例 及 检查图片上传文件的大小
  getImageWidthAndHeight(file: FileType) {
    return new Promise((resolve, reject) => {
      if (file.size > LIMIT_IMAGE_SIZE) {
        this.$message({
          message: `上传的图片大小不能超过${LIMIT_IMAGE_SIZE / 1024 / 1024}M`,
          type: 'warning',
          duration: 1000,
        })
        reject(false)
      } else {
        //获取图片宽高比例
        const reader = new FileReader()
        reader.readAsDataURL(file)

        reader.onload = () => {
          const img = new Image()
          img.src = reader.result as string
          //如果图片由于缓存已加载完毕，complete 就是true
          if (img.complete) {
            const width = img.width
            const height = img.height
            if (width !== 1920 || height !== 1440) {
              this.$message.error(
                `图片尺寸需为1920*1440,当前图片尺寸为${width}*${height}`,
              )
              reject(false)
            } else {
              const item = {
                progress: 0,
                uid: file.uid,
              }
              this.uploadList.unshift(item)
              resolve(true)
            }
          } else {
            img.onload = () => {
              const width = img.width
              const height = img.height
              if (width !== 1920 || height !== 1440) {
                this.$message.error(
                  `图片尺寸需为1920*1440,当前图片尺寸为${width}*${height}`,
                )
                reject(false)
              } else {
                const item = {
                  progress: 0,
                  uid: file.uid,
                }
                this.uploadList.unshift(item)
                resolve(true)
              }
            }
          }
        }
      }
    })
  }

  //通过创建临时文件流来获取图片的宽度和高度及宽高比例 及 检查视频上传文件的大小
  getVideoWidthAndHeight(file: FileType) {
    return new Promise((resolve, reject) => {
      if (file.size > LIMIT_VIDEO_SIZE) {
        this.$message({
          message: `上传的视频大小不能超过${LIMIT_VIDEO_SIZE / 1024 / 2024}M`,
          type: 'warning',
          duration: 1000,
        })
        reject(false)
      } else {
        const videoElement = document.createElement('video')
        videoElement.src = URL.createObjectURL(file)
        videoElement.addEventListener('loadedmetadata', () => {
          const width = videoElement.videoWidth
          const height = videoElement.videoHeight
          if (width !== 1920 || height !== 1080) {
            this.$message.error(
              `视频尺寸需为1920*1080,当前视频尺寸为${width}*${height}`,
            )
            reject(false)
          } else {
            const item = {
              progress: 0,
              uid: file.uid,
            }
            this.uploadList.unshift(item)
            resolve(true)
          }
        })
      }
    })
  }

  // 上传之前
  async beforeUpload(file: FileType) {
    const { type } = file
    const isImage = EFFECTIVE_IMAGE_TYPE.includes(type)
    const isVideo = EFFECTIVE_VIDEO_TYPE.includes(type)
    if (isVideo) {
      //检查视频的规则
      return await this.getVideoWidthAndHeight(file)
    } else if (isImage) {
      //检查图片的规则
      return await this.getImageWidthAndHeight(file)
    } else {
      if (!isVideo && !isImage) {
        //检查上传文件的格式
        this.$message.error('只支持上传png/jpeg/jpg/mp4格式')
        return false
      }
    }
  }

  // 上传进度
  onProgress(event: Record<string, any>, file: FileType) {
    for (let i = 0; i < this.uploadList.length; i++) {
      if (this.uploadList[i].uid === file.uid) {
        this.uploadList[i].progress =
          event.percent > 99 ? 99 : parseInt(event.percent) // 将上传进度赋值
        break
      }
    }
  }

  // 上传成功
  handleUploadSuccess(result: Record<string, any>, file: FileType) {
    const { type } = file.raw
    const isImage = EFFECTIVE_IMAGE_TYPE.includes(type)
    // 查找待上传数组中文件
    for (let i = 0; i < this.uploadList.length; i++) {
      if (this.uploadList[i].uid === file.uid) {
        const pictureChildren: UplaodInformation = {
          url: isImage ? result : result.url,
          seq: 1, //序号
          checked: false, //是否勾选
          tag: isImage ? 0 : 1, //0 代表图片，1代表视频
          typeId: this.sourceData.typeId,
          labelId: '', //图片或者视频 属于哪个类型
          type: 'NEW', //专门用来标记是新图片
          uid: file.uid, // 图片临时id
          matching: this.sourceData.matching ? true : false, //是否为周边配套
          supportId: this.sourceData?.supportId || '', //周边配套ID
          videoImageUrl: !isImage ? result.videoImageUrl : '',
          title: this.sourceData?.name || '', //配套或楼盘标题
        }
        this.selectAll = false
        this.pictureList.unshift(pictureChildren) // 将图片添加到已上传完成数组
        this.uploadList.splice(i, 1)
        break
      }
    }
  }

  // 上传失败
  onError(err: Error, file: FileType) {
    for (let i = 0; i < this.uploadList.length; i++) {
      if (this.uploadList[i].uid === file.uid) {
        this.uploadList.splice(i, 1)
        // 删除指定文件
        this.$message({
          message: '上传失败',
          type: 'warning',
        })
        break
      }
    }
  }

  // 全选
  handleSelectPictureAll(checked: boolean) {
    const arr = []
    for (let i = 0; i < this.hasOptionPictureList.length; i++) {
      this.hasOptionPictureList[i].checked = checked
      checked && arr.push(this.hasOptionPictureList[i].uid)
    }
    this.checkedPictureIds = arr
  }

  // 删除图片
  handleDeletePicture() {
    if (!this.checkedPictureIds.length) {
      this.$message({
        type: 'warning',
        message: '请选择需要删除的图片',
      })
      return
    }
    this.$confirm('确定删除图片？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
      .then(() => {
        // 删除成功
        for (let i = 0; i < this.checkedPictureIds.length; i++) {
          const uid = this.checkedPictureIds[i]
          const index = this.pictureList.findIndex(
            (list: UplaodInformation) => list.uid === uid,
          )
          this.pictureList.splice(index, 1)
        }
        this.checkedPictureIds = [] //清空所有选择的数据
        this.selectAll = false // 全选判断为false
        this.$message.success('操作成功')
      })
      .catch(() => {
        console.log('取消删除')
      })
  }

  //不属于该小区的操作
  removeGarden() {
    this.$confirm('确定要移除吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
      .then(() => {
        this.$emit('remove', this.sourceData)
      })
      .catch(() => {
        console.log('取消移除')
      })
  }
}
</script>
<style lang="scss" scoped>
::v-deep .el-image {
  height: 102.11px;
}
::v-deep .el-upload--picture-card {
  width: 130px;
  height: 130px;
}
.house-upload-title {
  font-size: 16px;
  color: #333;
  display: flex;
  align-items: center;
  font-weight: 900;
  &::before {
    content: '';
    display: inline-block;
    width: 5px;
    height: 18px;
    background-color: #00b9ef;
    margin-right: 10px;
  }
}
.upload-container-wrap {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 10px;
}
.picture-info {
  width: 100%;
  border: 1px solid #dfe4ed;
  padding: 10px;
  border-radius: 10px;
  margin-bottom: 15px;
  margin-top: 20px;
}
.title-header-wrap {
  display: flex;
  align-items: center;
  .picture-item-num {
    font-size: 12px;
    color: #999;
  }
}
.picture-item {
  margin-bottom: 10px;
  .delete-garden-btn {
    font-size: 12px;
    color: #ff5050;
    align-self: center;
    cursor: pointer;
  }
  .picture-item-title {
    font-size: 16px;
    color: #333;
    display: flex;
    justify-content: space-between;
    align-items: center;
    .select-all {
      margin-right: 10px;
      align-self: center;
      cursor: pointer;
    }
    .delete-btn {
      font-size: 14px;
      color: #1a66b3;
      cursor: pointer;
      align-self: center;
    }
  }
  .upload-wrapper {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100%;
    > span {
      line-height: 1.2;
      color: #1baef1;
      font-size: 14px;
      margin-top: 15px;
    }
    > i {
      color: #1baef1;
      font-weight: bold;
    }
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

      .picture {
        width: 100%;
        object-fit: cover;
      }

      .picture-item-list-item-up {
        position: relative;
        font-size: 0;
        width: 130px;
        .check-box {
          position: absolute;
          top: 5px;
          left: 10px;
        }
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
}
::v-deep .el-image.picture {
  width: 100%;
  -o-object-fit: contain;
  object-fit: contain;
  height: 100px;
  border: 1px solid #e5e5e5;
  img {
    width: 100%;
    -o-object-fit: contain;
    object-fit: contain;
    height: 100%;
  }
}
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
</style>
