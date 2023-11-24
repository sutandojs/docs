<script setup>
import { useRoute } from 'vitepress'

const route = useRoute()

if (typeof _hmt != "undefined") {
  if (route?.path) {
    window._hmt.push(['_trackPageview', route.path]);
  }
}
</script>

# Changelog

## v1.1.0

- feat: CLI & migration by [@kiddyuchina](https://github.com/kiddyuchina) in [#4](https://github.com/sutandojs/sutando/pull/4)
- fix: use scope in orWhere by [@kiddyuchina](https://github.com/kiddyuchina) in [#2](https://github.com/sutandojs/sutando/pull/2)

## v1.0.3

#### Bug Fixes

- fix: correct the built-in timestamps format

## v1.0.2

#### Bug Fixes

- duplicate member qualifyPivotColumn
- correct module path

## v1.0.0

#### Breaking Changes

- Mixin-based plugin functions (compose)
- String as primary key
- builder support custom method (macro)
- New accessors & mutators
- Support model casts
- Soft delete needs to be used as a plugin

## v0.2.1

#### Bug Fixes

- fix PostgreSQL can't get id using `save` method to insert data
- fix Postgresql error occurred using `paginate` method

#### Features

- add `ModelNotFoundError` & `RelationNotFoundError` export

## v0.2.0

#### Features

- Add Model hooks(lifecycle events)

## v0.1.1

#### Bug Fixes

- fix Model delete, restore cannot support trx
- ix Builder `findOrNew`, `firstOrNew` method error

#### Features

- Model support default attributes

## v0.1.0

- Initial Sutando release