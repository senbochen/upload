#### Upload组件



## Props

| Prop name        | Description                     | Type         | Values           | Default  |
| ---------------- | ------------------------        | ------------ | ---------------- | -------- |
| v-model          |  更新完毕后可以提交审核的操作列表     |      Array    |                  |  []       |
| sourceData       | 组件需要的一些基本信息              |     Object    | 具体值请看源代码   |          |
| echoList         | 回显的待补拍图片列表                |     Array     | 具体值请看源代码    | []      |
| operateType      | 操作类型                          | String       |  add:新增,显示不属于该小区的操作按钮 ， edit:编辑待补拍状态则不显示不属于该小区的操作按钮    |  add        |
| showRemoveGardenBtn| 是否显示不属于该小区的操作按钮      | Boolean       |  true             |    ture            |
| imageTypeList      | 楼盘详情的下拉类型选择             | Array          |                   |    []            |




## Methods

> @remove 移除不属于该配套的方法返回该配套的信息，进行remove操作

```
//不属于该小区的操作移除小区
  removeCallback(res: any) {
    const index = this.multipleList[this.activeName]['data'].findIndex(
      (item: any) => {
        return item.supportId === res.supportId
      },
    )
    this.cancelBindGardenHandler(res, index)
  }

```



> demo

`
 <upload
  v-for="item in multipleList['TRAFFIC_FACILITIES'].data"
  :key="item.uid"
  v-model="item.list"
  :sourceData="item"
  :echoList="multipleList['TRAFFIC_FACILITIES'].picList[item.name]"
  :operateType="showAddOperation ? 'add' : 'edit'"
  @remove="removeCallback"
></upload>
`
