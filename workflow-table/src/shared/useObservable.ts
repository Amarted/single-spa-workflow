
import type { Observable, Subscription } from 'rxjs';
import { onMounted, onUnmounted, type Ref, ref } from 'vue';

/**
 * Автоматически подписывается на RxJS Observable при монтировании и отписывается при размонтировании.
 * 
 * @param observable rxjs Observable, на значение котрого нужно создать ref
 * @param initialValue начальное значение до прихода первого значения из observable
 * @returns значение из observable в виде Ref
 */
export function useObservable<T>(observable: Observable<T>, initialValue: T): Ref<T> {
  const value = ref<T>(initialValue);
  let subscription: Subscription | null = null;

  onMounted(() => {
    subscription = observable.subscribe({
      next: (newValue) => (value.value = newValue),
      error: (error) => console.error('useObservable error:', error),
    });
  });

  onUnmounted(() => {
    subscription?.unsubscribe();
  });

  return value as Ref<T>;
}