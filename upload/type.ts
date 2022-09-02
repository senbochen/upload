
interface UplaodInformation {
  url: string //图片或视频的地址
  seq: number //序号
  checked: boolean //是否勾选
  tag: number //0 代表图片，1代表视频
  typeId: string | number
  labelId: string | number //图片或者视频 属于哪个类型
  type: string //专门用来标记是新图片
  uid: string // 图片临时id
  matching: boolean //是否为周边配套
  supportId: number | string //周边配套ID
  videoImageUrl: string
  title: string //配套或楼盘标题
  name?: string
  progress?: number
  isTransfer?: number
  auditStatus?: string
}

type UploadingType = Partial<UplaodInformation>

type UplaodInformationType = {
  createId: string
  createTime: null
  id: string
  level: number
  modifyId: string
  modifyTime: null
  name: string
  parentId: string
  parentName: string
  seq: number
  type: number
}

interface FileType extends File {
  [x: string]: any
  uid: string
}


export { FileType, UplaodInformationType, UploadingType, UplaodInformation }
