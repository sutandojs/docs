<script setup>
import { useRoute } from 'vitepress'

const route = useRoute()

if (typeof _hmt != "undefined") {
  if (route?.path) {
    window._hmt.push(['_trackPageview', route.path]);
  }
}
</script>

# 更新日志

## v1.1.0

- feat：CLI 和迁移 by [@kiddyuchina](https://github.com/kiddyuchina) in [#4](https://github.com/sutandojs/sutando/pull/4)
- fix：在 `orWhere` 中使用 `scope` by [@kiddyuchina](https://github.com/kiddyuchina) in [#2](https://github.com/sutandojs/sutando/pull/2)

## v1.0.3

#### Bug 修复

- fix：更正内置时间戳格式

## v1.0.2

#### Bug 修复

- 重复的成员 `qualifyPivotColumn`
- 正确的模块路径

## v1.0.0

#### 重大变更

- 基于 Mixin 的插件功能（compose）
- 字符串作为主键
- 构建器支持自定义方法（macro）
- 新的访问器和修改器
- 支持模型转换
- 软删除需要作为插件使用

## v0.2.1

#### Bug修复

- 修复 PostgreSQL 无法使用 `save` 方法获取 id 来插入数据
- 修复使用“paginate”方法发生的 Postgresql 错误

#### 特征

- 添加 `ModelNotFoundError` 和 `RelationNotFoundError` 导出

## v0.2.0

#### 特征

- 添加模型挂钩（生命周期事件）

## v0.1.1

#### Bug修复

- 修复模型删除、恢复不支持 trx 的问题
- 修复了 Builder `findOrNew`、`firstOrNew` 方法错误

#### 特征

- 模型支持默认属性

## v0.1.0

- 最初的 Sutando 版本