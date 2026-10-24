import type { DuplicateKeys } from './duplicate-keys';

/**
 * Проверяет, что у каждого action/effect не больше одного владельца среди таблиц.
 * DuplicateKeys находит повторяющиеся ключи, а Unique требует для них значение
 * never в каждой таблице. Обычный обработчик этому требованию не соответствует,
 * поэтому reducing/effecting отклоняют композицию с дублями.
 *
 * @example
 * type ApiHandlers = { ApiEffect: () => void };
 * type DispatchHandlers = { DispatchActionEffect: () => void };
 *
 * type Valid = Unique<readonly [ApiHandlers, DispatchHandlers]>;
 * // Ключи разные: таблицы принимаются без дополнительных требований.
 *
 * type Invalid = Unique<readonly [ApiHandlers, ApiHandlers]>;
 * // Каждая позиция получает пересечение с { ApiEffect: never }:
 * // передать ApiEffect: () => void больше нельзя.
 *
 * Проверка рассчитана на кортежи с известными позициями: их индексы — строки
 * "0", "1" и т.д. Числовой индекс обозначает динамические элементы массива
 * или rest-хвоста; для них задаётся never, поскольку уникальность не доказана.
 *
 * Unique не проверяет наличие всех объявленных обработчиков. Вместе с Complete
 * он задаёт правило «у каждого объявленного action/effect ровно один владелец».
 */
export type Unique<THandlerTables extends readonly unknown[]> = {
  [TIndex in keyof THandlerTables]: THandlerTables[TIndex] & (
    TIndex extends number ? never : { [TDuplicateKey in DuplicateKeys<THandlerTables>]: never }
  );
};
