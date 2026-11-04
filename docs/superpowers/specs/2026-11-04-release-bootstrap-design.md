# Исправление чистой подготовки релиза — #22

Владелец поручил обновить release PR #14 и довести его до merge/publication.
Release CI на main6723c38 проходит package/example checks, но version job
падает до обновления release branch: Changesets autoformat вызывает Prettier,
а root prettier.config.ts импортирует ещё не собранный workspace config.

## Минимальное исправление

Собирать только @gost-kit/prettier-config первым шагом version:packages,
до changeset version. После подготовки сохраняются прежние штатные команды
обновления обоих lockfiles. Альтернатива отключения formatting скрывает bootstrap
проблему; сборка всех runtime/config пакетов здесь не нужна.

Приватный root потребляет config workspaces через file:packages/<package>,
как example уже использует локальные file references. Публичные межпакетные
зависимости остаются SemVer и обновляются Changesets. Root source 0.0.0 pins
иначе перестают совпадать с workspace0.1.0 после version preparation.

Публичные config README не должны навсегда объявлять source0.0.0/unreleased;
сделать описание версии нейтральным, с указанием package.json/changelog.
Runtime API, правила, package versions и публикация этим fix не меняются.
Versions готовятся отдельно штатным release action, release PR merge запускает
публикацию по существующей схеме. Owner authorization для этого merge получено.

## Проверка

- RED: чистый disposable clone + npm ci + version:packages воспроизводит ошибку;
  прямой Prettier сообщает отсутствующий dist/prettier.config.js.
- GREEN: свежий clone с fix, чистый npm ci, version:packages, проверка пяти
  версий/ranges, повторный npm ci root/example, полный check и example build.
- Проверить только ожидаемые generated manifest/lock/changelog изменения,
  отсутствие новых root private registry pins, contents tarballs и сохранение
  Node version floors. Изменение version pipeline не вызывает npm publish в тесте.
- Независимое review fix и подготовленного результата до release merge.

Ожидаемый release: common0.2.0, svelte0.1.1, три configs0.1.0.
Источники: установленный Changesets3.0.3 и публичный changesets/action/version
v2.1.2; failed workflow41865012364. Публикационный job имеет отдельную ветвь
и не выполняется во время репетиции version.

## Свидетельства

Чистый RED подтвердил отсутствующий formatter dist. GREEN version preparation
и fresh npm ci обоих деревьев прошли: common0.2.0, svelte0.1.1 и configs0.1.0;
public ranges остаются SemVer, root private refs — локальными. Полный check282
и example build прошли. Независимое review не нашло блокеров. Замечание
о placeholder Unreleased в трёх initial config changelogs устранено удалением
заглушек до штатной генерации первых release notes; выпущенная история не удаляется.
