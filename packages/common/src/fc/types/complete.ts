import type { AnyFn } from '../../types';
import type { Trigger } from './trigger';

type RequiredHandlerKeys<THandlerTable> = keyof {
  [TKey in keyof THandlerTable as THandlerTable[TKey] extends AnyFn ? TKey : never]: unknown;
};

// Every possible tuple must cover the trigger union.
type MissingHandlerKeys<THandlerTables extends readonly object[], TTrigger extends Trigger> =
  THandlerTables extends unknown
    ? Exclude<TTrigger['type'], {
        [TIndex in keyof THandlerTables]: RequiredHandlerKeys<THandlerTables[TIndex]>;
      }[number]>
    : never;

/**
 * Проверяет, что подключённые таблицы покрывают каждый type из TTrigger.
 * Учитываются только гарантированно присутствующие функции: необязательное
 * свойство или функция | undefined не обеспечивают наличие обработчика.
 *
 * MissingHandlerKeys вычисляет разницу между TTrigger['type'] и ключами
 * обработчиков. Если таблица или весь кортеж представлены union, покрытие
 * должно быть полным в каждом возможном варианте, а не только в их сумме.
 *
 * @example
 * type Effects = { type: 'ApiEffect' } | { type: 'DispatchActionEffect' };
 * type ApiHandlers = { ApiEffect: () => void };
 * type DispatchHandlers = { DispatchActionEffect: () => void };
 *
 * type Valid = Complete<readonly [ApiHandlers, DispatchHandlers], Effects>;
 * // Record<never, never>: пропусков нет, дополнительных требований нет.
 *
 * type Invalid = Complete<readonly [DispatchHandlers], Effects>;
 * // Record<'ApiEffect', never>: ApiEffect не покрыт.
 * // Пересечение этого типа с аргументами reducing/effecting вызывает ошибку.
 *
 * type Optional = Complete<readonly [Partial<ApiHandlers>], { type: 'ApiEffect' }>;
 * // Record<'ApiEffect', never>: необязательный обработчик тоже считается пропуском.
 *
 * type NoEffects = Complete<readonly [], never>;
 * // Record<never, never>: для пустого union обработчики не требуются.
 *
 * Проверка выполняется для кортежей с фиксированной длиной. Если length имеет
 * тип number, возвращается unknown, чтобы не мешать выводу типов аргументов.
 * Поэтому Complete применяется вместе с Unique, ограничивающим динамические
 * массивы/rest-хвосты и запрещающим дубли: Unique<TTables> & Complete<TTables, TTrigger>.
 */
export type Complete<THandlerTables extends readonly object[], TTrigger extends Trigger> =
  number extends THandlerTables['length']
    ? unknown
    : Record<MissingHandlerKeys<THandlerTables, TTrigger>, never>;
